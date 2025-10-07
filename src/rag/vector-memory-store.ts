import { EnhancedVectorMemoryStore } from './enhanced-vector-memory-store.js';

// Create singleton instance of enhanced store
const enhancedStore = new EnhancedVectorMemoryStore();

export const vectorMemoryStore = {
  async initialize(): Promise<void> {
    await enhancedStore.initialize();
  },

  async storeMemory(memory: any): Promise<void> {
    await enhancedStore.storeMemory(memory);
  },

  async searchMemories(query: string | any): Promise<any[]> {
    return await enhancedStore.searchMemories(query);
  },

  async queryMemories(query: string | any): Promise<any> {
    return await enhancedStore.queryMemories(query);
  },

  async getAllMemories(): Promise<any[]> {
    return await enhancedStore.getAllMemories();
  }
};

export type RAGQuery = any;
