#!/bin/bash

# VERSATIL SDLC Framework - Automated pnpm Migration Script
# This script updates all files from npm to pnpm commands
# Run from project root: bash scripts/migrate-to-pnpm.sh

set -e

echo "🚀 VERSATIL SDLC Framework - pnpm Migration Script"
echo "=================================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL_FILES=0
UPDATED_FILES=0
SKIPPED_FILES=0

# Backup directory
BACKUP_DIR="./backup-pre-pnpm-$(date +%Y%m%d-%H%M%S)"

# Function to backup file
backup_file() {
    local file=$1
    local backup_path="${BACKUP_DIR}/${file}"
    mkdir -p "$(dirname "$backup_path")"
    cp "$file" "$backup_path"
    echo -e "${BLUE}📋 Backed up: $file${NC}"
}

# Function to update file
update_file() {
    local file=$1
    local description=$2

    if [ ! -f "$file" ]; then
        echo -e "${YELLOW}⚠️  File not found: $file${NC}"
        ((SKIPPED_FILES++))
        return
    fi

    backup_file "$file"

    echo -e "${GREEN}✏️  Updating: $file - $description${NC}"

    # Perform replacements
    sed -i.tmp 's/npm install -g /pnpm add -g /g' "$file"
    sed -i.tmp 's/npm install --save-dev /pnpm add -D /g' "$file"
    sed -i.tmp 's/npm install --save /pnpm add /g' "$file"
    sed -i.tmp 's/npm install /pnpm install /g' "$file"
    sed -i.tmp 's/npm ci$/pnpm install --frozen-lockfile/g' "$file"
    sed -i.tmp "s/cache: 'npm'/cache: 'pnpm'/g" "$file"
    sed -i.tmp "s/npm uninstall /pnpm remove /g" "$file"
    sed -i.tmp 's/npm cache clean/pnpm store prune/g' "$file"
    sed -i.tmp 's/npm audit/pnpm audit/g' "$file"

    # Clean up temp file
    rm -f "$file.tmp"

    ((UPDATED_FILES++))
}

echo "📦 Creating backup directory: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"
echo ""

# ============================================
# Phase 1: Shell Scripts
# ============================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Phase 1: Updating Shell Scripts${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

update_file "scripts/install.sh" "Installation script"
update_file "scripts/install-mcps.sh" "MCP installation script"
update_file "scripts/setup-mcp-modules.sh" "MCP modules setup"
update_file "scripts/deploy-production.sh" "Production deployment"
update_file "scripts/install-versatil-mcp.sh" "VERSATIL MCP install"
update_file "scripts/run-accessibility-tests.sh" "Accessibility tests"

echo ""

# ============================================
# Phase 2: JavaScript/CommonJS Scripts
# ============================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Phase 2: Updating JS/CJS Scripts${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

update_file "scripts/postinstall-wizard.cjs" "Postinstall wizard"
update_file "scripts/recover-framework.cjs" "Framework recovery"
update_file "scripts/release.cjs" "Release script"
update_file "scripts/setup-enhanced.cjs" "Enhanced setup"
update_file "scripts/migrate-to-1.2.0.cjs" "Migration script"
update_file "scripts/uninstall.cjs" "Uninstall script"
update_file "scripts/setup-supabase-auto.cjs" "Supabase auto-setup"
update_file "scripts/deploy-edge-functions.cjs" "Edge functions deployment"

echo ""

# ============================================
# Phase 3: PowerShell Scripts
# ============================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Phase 3: Updating PowerShell Scripts${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

update_file "scripts/install.ps1" "Windows installation script"

echo ""

# ============================================
# Phase 4: Dockerfiles
# ============================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Phase 4: Updating Dockerfiles${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ -f "docs/deployment/Dockerfile" ]; then
    backup_file "docs/deployment/Dockerfile"
    echo -e "${GREEN}✏️  Updating: docs/deployment/Dockerfile${NC}"

    # More complex replacements for Dockerfile
    sed -i.tmp 's/COPY package\*\.json/COPY package.json pnpm-lock.yaml/g' "docs/deployment/Dockerfile"
    sed -i.tmp 's/RUN npm ci --only=production/RUN corepack enable pnpm \&\& pnpm install --prod --frozen-lockfile/g' "docs/deployment/Dockerfile"
    sed -i.tmp 's/RUN npm run build/RUN pnpm build/g' "docs/deployment/Dockerfile"
    rm -f "docs/deployment/Dockerfile.tmp"

    ((UPDATED_FILES++))
fi

if [ -f "templates/enterprise/Dockerfile.prod" ]; then
    backup_file "templates/enterprise/Dockerfile.prod"
    echo -e "${GREEN}✏️  Updating: templates/enterprise/Dockerfile.prod${NC}"

    sed -i.tmp 's/COPY package\*\.json/COPY package.json pnpm-lock.yaml/g' "templates/enterprise/Dockerfile.prod"
    sed -i.tmp 's/RUN npm ci --only=production/RUN corepack enable pnpm \&\& pnpm install --prod --frozen-lockfile/g' "templates/enterprise/Dockerfile.prod"
    sed -i.tmp 's/RUN npm run build/RUN pnpm build/g' "templates/enterprise/Dockerfile.prod"
    rm -f "templates/enterprise/Dockerfile.prod.tmp"

    ((UPDATED_FILES++))
fi

echo ""

# ============================================
# Phase 5: Documentation
# ============================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Phase 5: Updating Documentation${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# High priority docs
update_file "README.md" "Main README"
update_file "docs/getting-started/installation.md" "Installation guide"
update_file "docs/getting-started/quick-start.md" "Quick start guide"
update_file "docs/INSTALLATION.md" "Full installation docs"
update_file "docs/CONTRIBUTING.md" "Contributing guide"

# Update all markdown files in docs (excluding node_modules)
echo ""
echo -e "${YELLOW}📚 Updating remaining documentation files...${NC}"

DOC_COUNT=0
find docs -name "*.md" -not -path "*/node_modules/*" | while read -r file; do
    update_file "$file" "Documentation update"
    ((DOC_COUNT++))
done

echo ""

# ============================================
# Phase 6: GitHub Actions Workflows
# ============================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Phase 6: Updating GitHub Actions Workflows${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${YELLOW}⚠️  GitHub Actions workflows require manual insertion of pnpm setup steps${NC}"
echo -e "${YELLOW}   See PNPM_MIGRATION_STATUS.md for details${NC}"
echo ""

# Update basic npm commands in workflows
find .github/workflows -name "*.yml" -o -name "*.yaml" | while read -r file; do
    # Skip npm-publish.yml - must keep npm publish
    if [[ "$file" == *"npm-publish.yml"* ]]; then
        echo -e "${YELLOW}⏭️  Skipped: $file (must keep npm publish)${NC}"
        ((SKIPPED_FILES++))
        continue
    fi

    update_file "$file" "Workflow automation"
done

echo ""

# ============================================
# Summary
# ============================================
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Migration Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}📊 Summary:${NC}"
echo -e "   Files updated: ${GREEN}${UPDATED_FILES}${NC}"
echo -e "   Files skipped: ${YELLOW}${SKIPPED_FILES}${NC}"
echo -e "   Backup location: ${BLUE}${BACKUP_DIR}${NC}"
echo ""
echo -e "${YELLOW}⚠️  Important Next Steps:${NC}"
echo ""
echo "1. Review changes:"
echo "   git diff"
echo ""
echo "2. Add pnpm setup steps to GitHub Actions workflows manually"
echo "   (See PNPM_MIGRATION_STATUS.md for template)"
echo ""
echo "3. Test installation:"
echo "   pnpm install --frozen-lockfile"
echo ""
echo "4. Test build:"
echo "   pnpm build"
echo ""
echo "5. Test scripts:"
echo "   pnpm test"
echo ""
echo "6. Commit changes:"
echo "   git add ."
echo "   git commit -m 'feat: migrate from npm to pnpm@10.17.0'"
echo ""
echo -e "${BLUE}📖 For detailed migration status, see: PNPM_MIGRATION_STATUS.md${NC}"
echo ""
