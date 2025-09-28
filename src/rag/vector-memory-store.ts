export const vectorMemoryStore = {
  async initialize(): Promise<void> {},
  async storeMemory(memory: any): Promise<void> {},
  async searchMemories(query: string | any): Promise<any[]> { return []; },
  async queryMemories(query: string | any): Promise<any> {
    const q = typeof query === 'string' ? query : query.query;
    const results = await this.searchMemories(q);
    return { documents: results };
  },
  async getAllMemories(): Promise<any[]> { return []; }
};

export type RAGQuery = any;
