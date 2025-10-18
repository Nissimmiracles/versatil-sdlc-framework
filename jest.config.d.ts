export let preset: string;
export let testEnvironment: string;
export let roots: string[];
export let testMatch: string[];
export let transform: {
    '^.+\\.(ts|tsx)$': string;
};
export let moduleFileExtensions: string[];
export let transformIgnorePatterns: string[];
export let collectCoverageFrom: string[];
export let coverageDirectory: string;
export let coverageReporters: string[];
export let setupFilesAfterEnv: string[];
export let moduleNameMapper: {
    '^@/(.*)$': string;
    '^@/types/(.*)$': string;
    '^@/agents/(.*)$': string;
    '^@/services/(.*)$': string;
    '^@/utils/(.*)$': string;
    '^@/tests/(.*)$': string;
};
export let testTimeout: number;
export let verbose: boolean;
export let collectCoverage: boolean;
export let maxWorkers: string | number;
export let logHeapUsage: boolean;
export let detectOpenHandles: boolean;
export let forceExit: boolean;
export let coverageThreshold: {
    global: {
        branches: number;
        functions: number;
        lines: number;
        statements: number;
    };
    'src/agents/': {
        branches: number;
        functions: number;
        lines: number;
        statements: number;
    };
    'src/testing/': {
        branches: number;
        functions: number;
        lines: number;
        statements: number;
    };
};
export let projects: (string | {
    displayName: string;
    testMatch: string[];
})[];
export let errorOnDeprecated: boolean;
export let globalSetup: string;
export let globalTeardown: string;
export let reporters: (string | (string | {
    publicPath: string;
    filename: string;
    expand: boolean;
})[] | (string | {
    outputDirectory: string;
    outputName: string;
})[])[];
export namespace testEnvironmentOptions {
    namespace opera {
        let agent: string;
        let framework: string;
        let version: string;
        let hybridTesting: boolean;
        let playwrightIntegration: boolean;
    }
}
//# sourceMappingURL=jest.config.d.ts.map