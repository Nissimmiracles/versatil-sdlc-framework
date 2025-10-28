/**
 * VERSATIL SDLC Framework - Credential Validator
 * Validates credential format and tests connectivity
 */
import { ServiceTemplate, CredentialField } from './credential-templates.js';
export interface ValidationResult {
    valid: boolean;
    field?: string;
    message?: string;
}
export interface ConnectionTestResult {
    success: boolean;
    service: string;
    message: string;
    latency?: number;
    details?: Record<string, any>;
}
/**
 * Validate a single credential field
 */
export declare function validateField(field: CredentialField, value: string): ValidationResult;
/**
 * Validate all credentials for a service
 */
export declare function validateServiceCredentials(service: ServiceTemplate, credentials: Record<string, string>): ValidationResult;
/**
 * Test connection for a service
 */
export declare function testServiceConnection(serviceId: string, credentials: Record<string, string>): Promise<ConnectionTestResult>;
/**
 * Test all configured services
 */
export declare function testAllConnections(allCredentials: Record<string, Record<string, string>>): Promise<ConnectionTestResult[]>;
