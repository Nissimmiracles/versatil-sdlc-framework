/**
 * Security Header Validator & Auto-Fix Engine
 * Validates and automatically fixes common security header misconfigurations
 *
 * Supports multiple backend frameworks:
 * - Node.js (Express, Fastify, Koa)
 * - Python (FastAPI, Django, Flask)
 * - Ruby on Rails
 * - Go (Gin, Echo)
 * - Java (Spring Boot)
 */
import { SecurityHeaderValidation } from './observatory-scanner.js';
export interface SecurityHeaderConfig {
    'Content-Security-Policy'?: string;
    'Strict-Transport-Security'?: string;
    'X-Frame-Options'?: string;
    'X-Content-Type-Options'?: string;
    'Referrer-Policy'?: string;
    'Permissions-Policy'?: string;
    'Cross-Origin-Embedder-Policy'?: string;
    'Cross-Origin-Opener-Policy'?: string;
    'Cross-Origin-Resource-Policy'?: string;
}
export interface FrameworkDetection {
    framework: 'express' | 'fastify' | 'koa' | 'fastapi' | 'django' | 'flask' | 'rails' | 'gin' | 'echo' | 'spring' | 'unknown';
    language: 'node' | 'python' | 'ruby' | 'go' | 'java' | 'unknown';
    configFile?: string;
    middlewareFile?: string;
}
export interface AutoFixResult {
    success: boolean;
    framework: string;
    filesModified: string[];
    headersAdded: string[];
    recommendations: string[];
    error?: string;
}
export declare class SecurityHeaderValidator {
    private logger;
    private projectPath;
    constructor(projectPath?: string);
    /**
     * Validate all security headers for a URL
     */
    validateHeaders(url: string): Promise<SecurityHeaderValidation[]>;
    /**
     * Get recommended security headers
     */
    getRecommendedHeaders(): SecurityHeaderConfig;
    /**
     * Get minimal security headers (for quick setup)
     */
    getMinimalHeaders(): SecurityHeaderConfig;
    /**
     * Detect backend framework
     */
    detectFramework(): Promise<FrameworkDetection>;
    /**
     * Auto-fix security headers for detected framework
     */
    autoFix(headers?: SecurityHeaderConfig): Promise<AutoFixResult>;
    /**
     * Fix Express.js security headers
     */
    private fixExpressHeaders;
    /**
     * Generate Express middleware code
     */
    private generateExpressMiddleware;
    /**
     * Fix Fastify security headers
     */
    private fixFastifyHeaders;
    /**
     * Generate Fastify plugin code
     */
    private generateFastifyPlugin;
    /**
     * Fix Koa security headers
     */
    private fixKoaHeaders;
    /**
     * Generate Koa middleware code
     */
    private generateKoaMiddleware;
    /**
     * Fix FastAPI security headers
     */
    private fixFastAPIHeaders;
    /**
     * Generate FastAPI middleware code
     */
    private generateFastAPIMiddleware;
    /**
     * Fix Django security headers
     */
    private fixDjangoHeaders;
    /**
     * Generate Django settings code
     */
    private generateDjangoSettings;
    /**
     * Fix Flask security headers
     */
    private fixFlaskHeaders;
    /**
     * Generate Flask middleware code
     */
    private generateFlaskMiddleware;
    /**
     * Fix Rails security headers
     */
    private fixRailsHeaders;
    /**
     * Generate Rails initializer code
     */
    private generateRailsInitializer;
    /**
     * Fix Gin (Go) security headers
     */
    private fixGinHeaders;
    /**
     * Generate Gin middleware code
     */
    private generateGinMiddleware;
    /**
     * Fix Echo (Go) security headers
     */
    private fixEchoHeaders;
    /**
     * Generate Echo middleware code
     */
    private generateEchoMiddleware;
    /**
     * Fix Spring Boot security headers
     */
    private fixSpringHeaders;
    /**
     * Generate Spring Security config code
     */
    private generateSpringConfig;
    /**
     * Check if file exists
     */
    private fileExists;
    /**
     * Ensure directory exists
     */
    private ensureDirectoryExists;
}
export declare const securityHeaderValidator: SecurityHeaderValidator;
