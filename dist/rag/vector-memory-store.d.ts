export declare const vectorMemoryStore: {
    initialize(): Promise<void>;
    storeMemory(memory: any): Promise<void>;
    searchMemories(query: string | any): Promise<any[]>;
    queryMemories(query: string | any): Promise<any>;
    getAllMemories(): Promise<any[]>;
};
export type RAGQuery = any;
