/**
 * Three-Tier Handoff Helper
 *
 * Simplifies creating and managing three-tier architecture handoffs:
 * Alex-BA → (Dana-Database + Marcus-Backend + James-Frontend)
 *
 * This is the most common VERSATIL workflow for full-stack features.
 */
import { ThreeTierHandoffContract, MemorySnapshot } from './agent-handoff-contract.js';
/**
 * Feature requirements for three-tier handoff
 */
export interface FeatureRequirements {
    /**
     * Feature name
     */
    name: string;
    /**
     * Feature description
     */
    description: string;
    /**
     * User stories
     */
    userStories: string[];
    /**
     * Business goals
     */
    goals?: string[];
    /**
     * Technical constraints
     */
    constraints?: string[];
}
/**
 * API endpoint definition
 */
export interface APIEndpoint {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    path: string;
    description: string;
    requestSchema?: Record<string, any>;
    responseSchema?: Record<string, any>;
    authentication?: boolean;
}
/**
 * Database table definition
 */
export interface DatabaseTable {
    name: string;
    columns: Array<{
        name: string;
        type: string;
        nullable?: boolean;
        unique?: boolean;
        default?: any;
    }>;
    indexes?: Array<{
        columns: string[];
        unique?: boolean;
    }>;
    foreignKeys?: Array<{
        column: string;
        references: string;
        onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT';
    }>;
}
/**
 * UI component definition
 */
export interface UIComponent {
    name: string;
    type: 'page' | 'component' | 'hook' | 'util';
    description: string;
    props?: Record<string, any>;
}
/**
 * Three-tier handoff builder
 */
export declare class ThreeTierHandoffBuilder {
    private requirements;
    private endpoints;
    private tables;
    private components;
    private memorySnapshot?;
    constructor(requirements: FeatureRequirements);
    /**
     * Add API endpoint
     */
    addEndpoint(endpoint: APIEndpoint): this;
    /**
     * Add database table
     */
    addTable(table: DatabaseTable): this;
    /**
     * Add UI component
     */
    addComponent(component: UIComponent): this;
    /**
     * Set memory snapshot
     */
    setMemorySnapshot(snapshot: MemorySnapshot): this;
    /**
     * Build the three-tier handoff contract
     */
    build(): Promise<ThreeTierHandoffContract>;
    /**
     * Build, validate, and track the contract
     */
    buildAndValidate(): Promise<{
        contract: ThreeTierHandoffContract;
        validation: any;
    }>;
    /**
     * Generate RLS policies for tables
     */
    private generateRLSPolicies;
}
/**
 * Quick helper to create three-tier handoff
 */
export declare function createThreeTierHandoff(requirements: FeatureRequirements, config: {
    endpoints: APIEndpoint[];
    tables: DatabaseTable[];
    components: UIComponent[];
    memorySnapshot?: MemorySnapshot;
}): Promise<ThreeTierHandoffContract>;
