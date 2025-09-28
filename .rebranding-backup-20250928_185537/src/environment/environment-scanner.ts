export interface ProjectContext {
  projectInfo?: any;
  technology?: any;
  structure?: any;
  quality?: any;
  patterns?: any;
  codebase?: any;
}

export const environmentScanner = {
  async scanEnvironment(): Promise<ProjectContext> {
    return { projectInfo: {}, technology: {}, structure: {} };
  },
  async getLatestScan(): Promise<ProjectContext | null> {
    return { projectInfo: {}, technology: {}, structure: {} };
  },
  watchForChanges(callback: Function): void {}
};
