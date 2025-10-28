import { EnhancedVectorMemoryStore } from './enhanced-vector-memory-store.js';
// Create singleton instance of enhanced store
const enhancedStore = new EnhancedVectorMemoryStore();
export const vectorMemoryStore = {
    async initialize() {
        await enhancedStore.initialize();
    },
    async storeMemory(memory) {
        await enhancedStore.storeMemory(memory);
    },
    async searchMemories(query) {
        return await enhancedStore.searchMemories(query);
    },
    async queryMemories(query) {
        return await enhancedStore.queryMemories(query);
    },
    async getAllMemories() {
        return await enhancedStore.getAllMemories();
    }
};
//# sourceMappingURL=vector-memory-store.js.map