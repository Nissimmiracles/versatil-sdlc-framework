/**
 * VERSATIL SDLC Framework - Dr.AI-ML (AI/ML Specialist)
 * Specialized in ML model development, training, deployment, MLOps
 *
 * RAG-Enhanced: Learns from model architectures, training patterns, deployment strategies
 */
import { RAGEnabledAgent } from './rag-enabled-agent.js';
export class DrAiMl extends RAGEnabledAgent {
    constructor(vectorStore) {
        super(vectorStore);
        this.name = 'DrAiMl';
        this.id = 'dr-ai-ml';
        this.specialization = 'AI/ML Specialist & MLOps Engineer';
        this.systemPrompt = 'Expert AI/ML Engineer specializing in model development, training optimization, deployment strategies, and MLOps best practices';
    }
    /**
     * AI/ML-specific RAG configuration
     * Focus on model architectures, training patterns, deployment strategies
     */
    getDefaultRAGConfig() {
        return {
            maxExamples: 3, // Focused examples for ML patterns
            similarityThreshold: 0.85, // High precision for ML code
            agentDomain: 'ai-ml',
            enableLearning: true
        };
    }
    /**
     * AI/ML-specific pattern analysis
     */
    async runPatternAnalysis(context) {
        const content = context.content || '';
        const filePath = context.filePath || '';
        const patterns = [];
        // Model architecture patterns
        if (content.match(/model\s*=|Sequential\(|Model\(|nn\.Module|keras\.layers/i)) {
            patterns.push({
                type: 'model-architecture',
                message: 'Neural network model architecture detected',
                severity: 'info',
                location: { file: filePath, line: 0 }
            });
        }
        // Training pipeline patterns
        if (content.match(/model\.fit|trainer\.train|optimizer|loss_fn|train_loop/i)) {
            patterns.push({
                type: 'training-pipeline',
                message: 'Model training pipeline detected',
                severity: 'info',
                location: { file: filePath, line: 0 }
            });
        }
        // Data preprocessing patterns
        if (content.match(/transform|normalize|augment|preprocessing|feature_engineering/i)) {
            patterns.push({
                type: 'data-preprocessing',
                message: 'Data preprocessing or feature engineering detected',
                severity: 'info',
                location: { file: filePath, line: 0 }
            });
        }
        // Model evaluation patterns
        if (content.match(/evaluate|metrics|accuracy|precision|recall|f1_score|confusion_matrix/i)) {
            patterns.push({
                type: 'model-evaluation',
                message: 'Model evaluation and metrics detected',
                severity: 'info',
                location: { file: filePath, line: 0 }
            });
        }
        // Hyperparameter tuning patterns
        if (content.match(/hyperparameter|grid_search|optuna|learning_rate|batch_size/i)) {
            patterns.push({
                type: 'hyperparameter-tuning',
                message: 'Hyperparameter tuning configuration detected',
                severity: 'info',
                location: { file: filePath, line: 0 }
            });
        }
        // Model deployment patterns
        if (content.match(/save_model|load_model|inference|predict|deploy|mlflow|serving/i)) {
            patterns.push({
                type: 'model-deployment',
                message: 'Model deployment or serving detected',
                severity: 'info',
                location: { file: filePath, line: 0 }
            });
        }
        // MLOps patterns
        if (content.match(/mlflow|wandb|tensorboard|experiment_tracking|model_registry/i)) {
            patterns.push({
                type: 'mlops',
                message: 'MLOps tooling or experiment tracking detected',
                severity: 'info',
                location: { file: filePath, line: 0 }
            });
        }
        // Performance issues (warnings)
        if (content.match(/\.cpu\(\)|device='cpu'|no GPU|slow training/i)) {
            patterns.push({
                type: 'performance-warning',
                message: 'Potential performance issue: CPU-only training detected',
                severity: 'high',
                location: { file: filePath, line: 0 }
            });
        }
        // Data leakage risks (critical)
        if (content.match(/fit_transform.*test|test.*fit|target.*features/i)) {
            patterns.push({
                type: 'data-leakage-risk',
                message: 'CRITICAL: Potential data leakage detected in preprocessing',
                severity: 'critical',
                location: { file: filePath, line: 0 }
            });
        }
        return {
            patterns,
            score: patterns.filter(p => p.severity === 'critical').length === 0 ? 95 : 70, // ML quality score
            summary: `Detected ${patterns.length} AI/ML patterns`,
            recommendations: patterns
                .filter(p => p.severity === 'high' || p.severity === 'critical')
                .map(p => p.message)
        };
    }
    /**
     * Override activate to add AI/ML-specific context
     */
    async activate(context) {
        // Call parent (RAGEnabledAgent) to get RAG-enhanced response
        const response = await super.activate(context);
        // Add AI/ML-specific enhancements
        if (response.context) {
            response.context = {
                ...response.context,
                mlInsights: {
                    modelArchitectureDetected: context.content?.match(/model\s*=|Sequential/i) !== null,
                    trainingPipelinePresent: context.content?.match(/model\.fit|trainer/i) !== null,
                    evaluationMetrics: this.extractEvaluationMetrics(context.content || ''),
                    mlopsTooling: context.content?.match(/mlflow|wandb|tensorboard/i) !== null
                }
            };
        }
        // Add AI/ML-specific suggestions if RAG context available
        const ragContext = context.ragContext;
        if (ragContext && ragContext.previousSolutions) {
            const mlSuggestions = this.generateMLSuggestions(ragContext, context);
            response.suggestions = [...(response.suggestions || []), ...mlSuggestions];
        }
        // Determine handoffs
        response.handoffTo = this.determineHandoffs(context, response);
        return response;
    }
    /**
     * Extract evaluation metrics from content
     */
    extractEvaluationMetrics(content) {
        const metrics = [];
        const metricPatterns = ['accuracy', 'precision', 'recall', 'f1', 'auc', 'mae', 'mse', 'rmse'];
        for (const metric of metricPatterns) {
            if (content.toLowerCase().includes(metric)) {
                metrics.push(metric);
            }
        }
        return metrics;
    }
    /**
     * Generate AI/ML-specific suggestions from RAG context
     */
    generateMLSuggestions(ragContext, context) {
        const suggestions = [];
        // Model architecture suggestions
        if (context.content?.includes('model') && ragContext.similarCode.length > 0) {
            suggestions.push({
                type: 'architecture-optimization',
                message: 'Similar models in previous projects achieved better performance with batch normalization and dropout',
                priority: 'medium',
                file: context.filePath || 'model.py'
            });
        }
        // Training optimization suggestions
        if (context.content?.includes('train') && ragContext.previousSolutions['training-pipeline']) {
            suggestions.push({
                type: 'training-optimization',
                message: 'Consider using learning rate scheduling and early stopping for better convergence',
                priority: 'medium',
                file: context.filePath || 'train.py'
            });
        }
        // Data preprocessing suggestions
        if (context.content?.includes('preprocess') && ragContext.projectStandards.length > 0) {
            suggestions.push({
                type: 'preprocessing-best-practice',
                message: 'Fit preprocessing on training data only, then transform both train and test sets',
                priority: 'high',
                file: context.filePath || 'preprocessing.py'
            });
        }
        // MLOps suggestions
        if (context.content?.match(/model\.save|save_model/i) && ragContext.agentExpertise.length > 0) {
            suggestions.push({
                type: 'mlops-recommendation',
                message: 'Recommend using MLflow for experiment tracking and model registry',
                priority: 'medium',
                file: context.filePath || 'train.py'
            });
        }
        // Performance optimization
        if (context.content?.includes('cpu')) {
            suggestions.push({
                type: 'performance-optimization',
                message: 'Training on GPU can be 10-100x faster. Consider using CUDA device if available',
                priority: 'high',
                file: context.filePath || 'config.py'
            });
        }
        return suggestions;
    }
    /**
     * Determine which agents to hand off to
     */
    determineHandoffs(context, response) {
        const handoffs = [];
        // Hand off to Marcus for API deployment
        if (context.content?.match(/inference|predict|api|endpoint/i)) {
            handoffs.push('marcus-backend');
        }
        // Hand off to Maria for model testing
        if (context.content?.match(/test|evaluate|validation/i)) {
            handoffs.push('maria-qa');
        }
        // Hand off to Sarah PM for project planning
        if (response.priority === 'critical' || context.content?.includes('deadline')) {
            handoffs.push('sarah-pm');
        }
        return handoffs;
    }
    /**
     * Get base prompt template for AI/ML
     */
    getBasePromptTemplate() {
        return `You are Dr.AI-ML, an expert AI/ML Engineer specializing in model development and MLOps.
Your role is to design model architectures, optimize training pipelines, and ensure robust deployment strategies.
Focus on best practices in model development, data quality, and production readiness.`;
    }
    /**
     * Generate domain-specific handoffs based on analysis
     */
    generateDomainHandoffs(analysis) {
        const handoffs = [];
        // Check if data leakage detected (critical)
        if (analysis.patterns.some(p => p.type === 'data-leakage-risk')) {
            handoffs.push('maria-qa'); // Immediate QA review needed
        }
        // Check if deployment patterns need backend support
        if (analysis.patterns.some(p => p.type === 'model-deployment')) {
            handoffs.push('marcus-backend');
        }
        // Check if performance issues need PM escalation
        if (analysis.patterns.some(p => p.severity === 'high' || p.severity === 'critical')) {
            handoffs.push('sarah-pm');
        }
        return handoffs;
    }
}
//# sourceMappingURL=dr-ai-ml.js.map