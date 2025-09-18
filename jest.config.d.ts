export let preset: string;
export let testEnvironment: string;
export let roots: string[];
export let testMatch: string[];
export let transform: {
    '^.+\\.(ts|tsx)$': string;
};
export let collectCoverageFrom: string[];
export let coverageDirectory: string;
export let coverageReporters: string[];
export let setupFilesAfterEnv: string[];
export let moduleNameMapping: {
    '^@/(.*)$': string;
};
export let testTimeout: number;
export let verbose: boolean;
export let collectCoverage: boolean;
export namespace coverageThreshold {
    namespace global {
        let branches: number;
        let functions: number;
        let lines: number;
        let statements: number;
    }
}
//# sourceMappingURL=jest.config.d.ts.map