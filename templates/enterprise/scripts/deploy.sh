#!/bin/bash

# VERSATIL SDLC Framework - Enterprise Deployment Script
# Automated deployment with Enhanced OPERA agents, monitoring, and security

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOYMENT_TYPE=${1:-docker-compose}
ENVIRONMENT=${2:-production}
VERSION=${3:-latest}

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."

    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
        exit 1
    fi

    # Check Docker Compose for docker-compose deployment
    if [[ "$DEPLOYMENT_TYPE" == "docker-compose" ]] && ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed"
        exit 1
    fi

    # Check kubectl for Kubernetes deployment
    if [[ "$DEPLOYMENT_TYPE" == "kubernetes" ]] && ! command -v kubectl &> /dev/null; then
        error "kubectl is not installed"
        exit 1
    fi

    # Check if .env file exists
    if [[ ! -f ".env" ]]; then
        warning ".env file not found, copying from .env.example"
        if [[ -f ".env.example" ]]; then
            cp .env.example .env
            warning "Please update .env file with your configuration"
        else
            error ".env.example not found"
            exit 1
        fi
    fi

    success "Prerequisites check passed"
}

# Pre-deployment validation
pre_deployment_validation() {
    log "Running pre-deployment validation..."

    # Run Enhanced OPERA self-analysis
    if [[ -f "scripts/self-improve.js" ]]; then
        log "Running Enhanced OPERA self-analysis..."
        if ! node scripts/self-improve.js; then
            warning "Self-analysis found issues but continuing deployment"
        fi
    fi

    # Build and test application
    log "Building application..."
    npm run build:release

    # Run security scan
    if command -v trivy &> /dev/null; then
        log "Running security scan..."
        trivy fs . --severity HIGH,CRITICAL --exit-code 1 || {
            error "Security scan failed"
            exit 1
        }
    else
        warning "Trivy not found, skipping security scan"
    fi

    success "Pre-deployment validation completed"
}

# Deploy with Docker Compose
deploy_docker_compose() {
    log "Deploying with Docker Compose..."

    # Load environment variables
    source .env

    # Build images
    log "Building Docker images..."
    docker-compose -f templates/enterprise/docker-compose.yml build

    # Start services
    log "Starting services..."
    docker-compose -f templates/enterprise/docker-compose.yml up -d

    # Wait for services to be healthy
    log "Waiting for services to be healthy..."
    timeout 300 bash -c '
        while ! docker-compose -f templates/enterprise/docker-compose.yml ps | grep -q "Up (healthy)"; do
            echo "Waiting for services to be healthy..."
            sleep 10
        done
    ' || {
        error "Services failed to become healthy"
        docker-compose -f templates/enterprise/docker-compose.yml logs
        exit 1
    }

    success "Docker Compose deployment completed"
}

# Deploy to Kubernetes
deploy_kubernetes() {
    log "Deploying to Kubernetes..."

    # Check if namespace exists
    if ! kubectl get namespace versatil-sdlc &> /dev/null; then
        log "Creating namespace..."
        kubectl apply -f templates/enterprise/kubernetes/namespace.yaml
    fi

    # Apply secrets (if they don't exist)
    if ! kubectl get secret versatil-secrets -n versatil-sdlc &> /dev/null; then
        log "Creating secrets..."
        kubectl create secret generic versatil-secrets \
            --from-literal=redis-url="redis://redis:6379" \
            --from-literal=postgres-url="postgresql://user:pass@postgres:5432/versatil" \
            -n versatil-sdlc
    fi

    # Apply configuration
    log "Applying Kubernetes manifests..."
    kubectl apply -f templates/enterprise/kubernetes/

    # Wait for deployment to be ready
    log "Waiting for deployment to be ready..."
    kubectl rollout status deployment/versatil-app -n versatil-sdlc --timeout=300s

    # Check pod health
    log "Checking pod health..."
    kubectl get pods -n versatil-sdlc

    success "Kubernetes deployment completed"
}

# Run health checks
run_health_checks() {
    log "Running health checks..."

    case $DEPLOYMENT_TYPE in
        "docker-compose")
            # Health check for Docker Compose
            if docker-compose -f templates/enterprise/docker-compose.yml exec -T versatil-app node healthcheck.js; then
                success "Health check passed"
            else
                error "Health check failed"
                exit 1
            fi
            ;;
        "kubernetes")
            # Health check for Kubernetes
            POD=$(kubectl get pods -n versatil-sdlc -l app=versatil-app -o jsonpath='{.items[0].metadata.name}')
            if kubectl exec -n versatil-sdlc $POD -- node healthcheck.js; then
                success "Health check passed"
            else
                error "Health check failed"
                exit 1
            fi
            ;;
    esac
}

# Post-deployment verification
post_deployment_verification() {
    log "Running post-deployment verification..."

    # Check service endpoints
    case $DEPLOYMENT_TYPE in
        "docker-compose")
            log "Checking service endpoints..."
            curl -f http://localhost:3000/health || {
                error "Main application health check failed"
                exit 1
            }

            if curl -f http://localhost:3001/health 2>/dev/null; then
                success "MCP server is running"
            else
                warning "MCP server is not responding"
            fi

            if curl -f http://localhost:9090 2>/dev/null; then
                success "Prometheus is running"
            else
                warning "Prometheus is not responding"
            fi
            ;;
        "kubernetes")
            log "Checking Kubernetes services..."
            kubectl get services -n versatil-sdlc
            ;;
    esac

    # Verify Enhanced OPERA agents
    log "Verifying Enhanced OPERA agents..."
    case $DEPLOYMENT_TYPE in
        "docker-compose")
            if docker-compose -f templates/enterprise/docker-compose.yml exec -T versatil-app test -f /app/.versatil/analytics/metrics.json; then
                success "Enhanced OPERA agents are active"
            else
                warning "Enhanced OPERA agents metrics not found"
            fi
            ;;
        "kubernetes")
            POD=$(kubectl get pods -n versatil-sdlc -l app=versatil-app -o jsonpath='{.items[0].metadata.name}')
            if kubectl exec -n versatil-sdlc $POD -- test -f /app/.versatil/analytics/metrics.json; then
                success "Enhanced OPERA agents are active"
            else
                warning "Enhanced OPERA agents metrics not found"
            fi
            ;;
    esac

    success "Post-deployment verification completed"
}

# Cleanup on failure
cleanup_on_failure() {
    error "Deployment failed, cleaning up..."

    case $DEPLOYMENT_TYPE in
        "docker-compose")
            docker-compose -f templates/enterprise/docker-compose.yml down -v
            ;;
        "kubernetes")
            kubectl delete namespace versatil-sdlc --ignore-not-found=true
            ;;
    esac
}

# Main deployment function
main() {
    log "Starting VERSATIL SDLC Framework Enterprise Deployment"
    log "Deployment Type: $DEPLOYMENT_TYPE"
    log "Environment: $ENVIRONMENT"
    log "Version: $VERSION"

    # Set trap for cleanup on failure
    trap cleanup_on_failure ERR

    # Run deployment steps
    check_prerequisites
    pre_deployment_validation

    case $DEPLOYMENT_TYPE in
        "docker-compose")
            deploy_docker_compose
            ;;
        "kubernetes")
            deploy_kubernetes
            ;;
        *)
            error "Invalid deployment type: $DEPLOYMENT_TYPE"
            error "Supported types: docker-compose, kubernetes"
            exit 1
            ;;
    esac

    run_health_checks
    post_deployment_verification

    success "🎉 VERSATIL SDLC Framework deployed successfully!"
    log "🔍 Enhanced OPERA agents are active and monitoring your codebase"
    log "📊 Access monitoring at:"

    case $DEPLOYMENT_TYPE in
        "docker-compose")
            log "   - Application: http://localhost:3000"
            log "   - Grafana: http://localhost:3001"
            log "   - Prometheus: http://localhost:9090"
            log "   - Kibana: http://localhost:5601"
            ;;
        "kubernetes")
            log "   - Use 'kubectl port-forward' to access services"
            log "   - Run: kubectl get services -n versatil-sdlc"
            ;;
    esac
}

# Show usage
show_usage() {
    echo "Usage: $0 [deployment-type] [environment] [version]"
    echo ""
    echo "Deployment Types:"
    echo "  docker-compose  Deploy using Docker Compose (default)"
    echo "  kubernetes      Deploy to Kubernetes cluster"
    echo ""
    echo "Environment:"
    echo "  production      Production deployment (default)"
    echo "  staging         Staging deployment"
    echo "  development     Development deployment"
    echo ""
    echo "Version:"
    echo "  latest          Use latest version (default)"
    echo "  1.0.0           Use specific version"
    echo ""
    echo "Examples:"
    echo "  $0 docker-compose production latest"
    echo "  $0 kubernetes staging 1.0.0"
    echo "  $0"
}

# Handle command line arguments
if [[ "${1:-}" == "--help" ]] || [[ "${1:-}" == "-h" ]]; then
    show_usage
    exit 0
fi

# Run main function
main "$@"