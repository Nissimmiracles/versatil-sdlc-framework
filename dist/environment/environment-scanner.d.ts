export interface ProjectContext {
    projectInfo?: any;
    technology?: any;
    structure?: any;
    quality?: any;
    patterns?: any;
    codebase?: any;
}
export declare const environmentScanner: {
    scanEnvironment(): Promise<ProjectContext>;
    getLatestScan(): Promise<ProjectContext | null>;
    watchForChanges(callback: Function): void;
};
