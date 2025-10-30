/**
 * VERSATIL MCP ML/AI Tools Module
 * Machine Learning and AI operations for Dr.AI-ML agent
 *
 * Tools in this module (15):
 * 1. ml_generate_embeddings
 * 2. ml_run_inference
 * 3. ml_train_model
 * 4. ml_evaluate_model
 * 5. ml_prepare_dataset
 * 6. ml_rag_search
 * 7. ml_rag_store
 * 8. ml_calculate_similarity
 * 9. ml_vertex_predict
 * 10. ml_openai_completion
 * 11. ml_anthropic_completion
 * 12. ml_huggingface_inference
 * 13. ml_model_registry_push
 * 14. ml_mlflow_track
 * 15. ml_hyperparameter_tune
 */
import { ModuleBase } from './module-base.js';
import { ToolRegistrationOptions } from '../core/module-loader.js';
export declare class MLToolsModule extends ModuleBase {
    private vertexAI;
    private openai;
    private anthropic;
    constructor(options: ToolRegistrationOptions);
    /**
     * Lazy initialize AI clients
     */
    protected initializeTool(toolName: string): Promise<void>;
    /**
     * Register all ML tools
     */
    registerTools(): Promise<number>;
    /**
     * Cleanup AI clients on module unload
     */
    cleanup(): Promise<void>;
}
/**
 * Export function for module loader
 */
export declare function registerTools(options: ToolRegistrationOptions): Promise<number>;
