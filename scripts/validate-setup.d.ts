#!/usr/bin/env node
export = VersatilValidator;
declare class VersatilValidator {
    projectRoot: string;
    versatilDir: string;
    results: {
        passed: number;
        failed: number;
        warnings: number;
        checks: never[];
    };
    showHeader(): void;
    runCheck(name: any, checkFunction: any, required?: boolean): Promise<void>;
    checkCoreFiles(): Promise<void>;
    checkAgentConfiguration(): Promise<void>;
    checkNodeEnvironment(): Promise<void>;
    checkChromeMCP(): Promise<void>;
    checkTestingSetup(): Promise<void>;
    checkGitRepository(): Promise<void>;
    checkCursorRules(): Promise<void>;
    checkClaudeConfiguration(): Promise<void>;
    checkProjectConfiguration(): Promise<void>;
    checkScriptsAndCommands(): Promise<void>;
    checkPackageJsonScripts(): Promise<void>;
    checkDependencies(): Promise<void>;
    validateAgentConfigurations(): Promise<void>;
    runDiagnostics(): Promise<void>;
    generateReport(): Promise<boolean>;
    run(): Promise<boolean>;
}
//# sourceMappingURL=validate-setup.d.ts.map