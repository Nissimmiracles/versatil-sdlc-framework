import type { Server } from 'node:http';
import type { GraphRAGStore } from '../lib/graphrag-store.js';
export interface RecoveryTarget {
    projectId: string;
    databaseId: string;
}
export type RecoveryStore = Pick<GraphRAGStore, 'listSoftDeletedTargets' | 'restoreNode' | 'restoreEdge' | 'getNode' | 'getEdge'>;
/** The capability admits this local operator session, never a public/tenant identity. */
export declare function createRecoveryApp(options: {
    store: RecoveryStore;
    capability: string;
    target: RecoveryTarget;
}): import("express-serve-static-core").Express;
export declare function startLocalRecoveryConsole(options: {
    store: RecoveryStore;
    target: RecoveryTarget;
    port?: number;
}): Promise<{
    server: Server;
    url: string;
    launchPath: string;
    close: () => Promise<void>;
}>;
