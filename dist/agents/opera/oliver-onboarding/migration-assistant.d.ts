/**
 * VERSATIL OPERA v6.1.0 - Migration Assistant
 *
 * Helps migrate from other frameworks to VERSATIL
 */
import { ScanResult } from './project-scanner.js';
export interface MigrationStrategy {
    from: string;
    to: string;
    steps: MigrationStep[];
    estimatedMinutes: number;
    compatibility: 'high' | 'medium' | 'low';
}
export interface MigrationStep {
    description: string;
    action: string;
    manual: boolean;
}
export declare class MigrationAssistant {
    private logger;
    private projectRoot;
    constructor(projectRoot: string);
    detectMigration(scanResult: ScanResult): Promise<MigrationStrategy | null>;
    applyStrategy(strategy: MigrationStrategy): Promise<void>;
}
