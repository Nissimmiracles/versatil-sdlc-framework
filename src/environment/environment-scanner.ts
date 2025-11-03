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
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  watchForChanges(callback: Function): void {}
};
