export const environmentScanner = {
    async scanEnvironment() {
        return { projectInfo: {}, technology: {}, structure: {} };
    },
    async getLatestScan() {
        return { projectInfo: {}, technology: {}, structure: {} };
    },
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    watchForChanges(callback) { }
};
//# sourceMappingURL=environment-scanner.js.map