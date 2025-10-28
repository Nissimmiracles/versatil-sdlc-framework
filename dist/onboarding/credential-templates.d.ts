/**
 * VERSATIL SDLC Framework - Credential Service Templates
 * Metadata for all MCP services requiring credentials
 */
export interface CredentialField {
    key: string;
    label: string;
    type: 'text' | 'password' | 'file' | 'url';
    required: boolean;
    default?: string;
    placeholder?: string;
    validation?: (value: string) => boolean | string;
    helpText?: string;
}
export interface ServiceTemplate {
    id: string;
    name: string;
    category: 'ai' | 'database' | 'testing' | 'monitoring' | 'automation' | 'search' | 'security' | 'design' | 'infrastructure' | 'documentation';
    description: string;
    required: boolean;
    useCase: string;
    credentials: CredentialField[];
    setupGuide: string;
    signupUrl?: string;
    docsUrl?: string;
    testConnection?: (credentials: Record<string, string>) => Promise<boolean>;
    fallbackAvailable: boolean;
    fallbackDescription?: string;
    usedByAgents?: string[];
}
/**
 * All service templates for credential onboarding
 */
export declare const SERVICE_TEMPLATES: Record<string, ServiceTemplate>;
/**
 * Get service template by ID
 */
export declare function getServiceTemplate(serviceId: string): ServiceTemplate | undefined;
/**
 * Get all service templates
 */
export declare function getAllServiceTemplates(): ServiceTemplate[];
/**
 * Get required services
 */
export declare function getRequiredServices(): ServiceTemplate[];
/**
 * Get optional services
 */
export declare function getOptionalServices(): ServiceTemplate[];
/**
 * Get services by category
 */
export declare function getServicesByCategory(category: ServiceTemplate['category']): ServiceTemplate[];
/**
 * Detect which services are needed based on project analysis
 */
export declare function detectNeededServices(projectAnalysis?: {
    detectedTechnologies?: string[];
    hasTests?: boolean;
    hasBackend?: boolean;
    hasFrontend?: boolean;
    hasML?: boolean;
}): ServiceTemplate[];
/**
 * Agent to service credential mapping
 */
export declare const AGENT_CREDENTIAL_MAP: Record<string, string[]>;
/**
 * Get services needed by specific agents
 */
export declare function getServicesForAgents(agentIds: string[]): ServiceTemplate[];
/**
 * Get agents that use a specific service
 */
export declare function getAgentsUsingService(serviceId: string): string[];
