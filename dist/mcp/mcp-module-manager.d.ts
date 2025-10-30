export class MCPModuleManager {
    constructor(projectPath: any);
    projectPath: any;
    config: any;
    activeModules: Map<any, any>;
    tools: Map<any, any>;
    loadConfig(): any;
    initializeProfile(profileName?: string): Promise<void>;
    loadModule(moduleName: any): Promise<void>;
    discoverTools(moduleName: any, process: any): Promise<void>;
    registerModuleTools(moduleName: any, module: any): Promise<void>;
    routeToolCall(toolName: any, params: any): Promise<any>;
    findModuleForTool(toolName: any): any;
    executeToolOnModule(moduleName: any, toolName: any, params: any): Promise<any>;
    sendMCPRequest(process: any, toolName: any, params: any): Promise<any>;
    shutdown(): Promise<void>;
}
