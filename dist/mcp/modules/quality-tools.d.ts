/**
 * VERSATIL MCP Quality Tools Module
 * Testing and quality assurance tools for Maria-QA agent
 *
 * Tools in this module (12):
 * 1. quality_run_tests
 * 2. quality_coverage_report
 * 3. quality_lint_check
 * 4. quality_playwright_test
 * 5. quality_lighthouse_audit
 * 6. quality_accessibility_scan
 * 7. quality_visual_regression
 * 8. quality_stress_test
 * 9. quality_load_test
 * 10. quality_mutation_test
 * 11. quality_security_scan
 * 12. quality_dependency_audit
 */
import { ModuleBase } from './module-base.js';
import { ToolRegistrationOptions } from '../core/module-loader.js';
export declare class QualityToolsModule extends ModuleBase {
    private playwright;
    constructor(options: ToolRegistrationOptions);
    /**
     * Lazy initialize Playwright
     */
    protected initializeTool(toolName: string): Promise<void>;
    /**
     * Register all quality tools
     */
    registerTools(): Promise<number>;
    /**
     * Cleanup Playwright on module unload
     */
    cleanup(): Promise<void>;
}
/**
 * Export function for module loader
 */
export declare function registerTools(options: ToolRegistrationOptions): Promise<number>;
