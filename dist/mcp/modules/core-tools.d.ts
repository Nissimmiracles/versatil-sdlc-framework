/**
 * VERSATIL MCP Core Tools Module
 * Essential tools for all profiles (always loaded)
 *
 * Tools in this module (20):
 * 1. versatil_health_check
 * 2. versatil_list_agents
 * 3. versatil_orchestrate_agents
 * 4. versatil_get_agent_status
 * 5. versatil_task_decompose
 * 6. versatil_guardian_audit
 * 7. versatil_security_boundary_check
 * 8. versatil_secrets_scan
 * 9. versatil_file_operations (read/write/list)
 * 10. versatil_search_files
 * 11. versatil_git_status
 * 12. versatil_git_operations
 * 13. versatil_quality_gates
 * 14. versatil_test_run
 * 15. versatil_coverage_check
 * 16. versatil_profile_switch
 * 17. versatil_module_load
 * 18. versatil_module_unload
 * 19. versatil_module_status
 * 20. versatil_system_info
 */
import { ModuleBase } from './module-base.js';
import { ToolRegistrationOptions } from '../core/module-loader.js';
export declare class CoreToolsModule extends ModuleBase {
    constructor(options: ToolRegistrationOptions);
    /**
     * Register all core tools
     */
    registerTools(): Promise<number>;
}
/**
 * Export function for module loader
 */
export declare function registerTools(options: ToolRegistrationOptions): Promise<number>;
