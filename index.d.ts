#!/usr/bin/env node
export = VersatilCLI;
declare class VersatilCLI {
    packageRoot: string;
    currentDir: string;
    showHeader(): void;
    showHelp(): void;
    showVersion(): void;
    init(template?: string): Promise<void>;
    copyFrameworkFiles(): Promise<void>;
    copyTemplate(template: any): Promise<void>;
    copyDirectory(source: any, dest: any): void;
    copyFile(source: any, dest: any): void;
    runSetup(): Promise<void>;
    validate(): Promise<void>;
    configureAgents(): Promise<void>;
    run(): Promise<void>;
}
//# sourceMappingURL=index.d.ts.map