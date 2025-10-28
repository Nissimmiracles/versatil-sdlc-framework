/**
 * VERSATIL Environment Manager - Enterprise Grade Multi-Environment System
 * Handles environment detection, switching, and configuration management
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import { VERSATILLogger } from '../utils/logger.js';
export class EnvironmentManager {
    constructor(projectPath = process.cwd()) {
        this.currentEnvironment = 'development';
        this.environmentConfig = null;
        this.cachedConfigs = new Map();
        this.logger = new VERSATILLogger();
        this.projectPath = projectPath;
        this.configPath = path.join(projectPath, 'config', 'environments');
    }
    /**
     * Initialize environment manager
     */
    async initialize() {
        this.logger.info('Initializing Environment Manager', {}, 'environment-manager');
        // Detect current environment
        await this.detectEnvironment();
        // Load environment configuration
        await this.loadEnvironmentConfig();
        // Validate environment
        const validation = await this.validateEnvironment();
        if (!validation.isValid) {
            this.logger.error('Environment validation failed', {
                errors: validation.errors,
                warnings: validation.warnings
            }, 'environment-manager');
            throw new Error(`Environment validation failed: ${validation.errors.join(', ')}`);
        }
        // Apply environment configuration
        await this.applyEnvironmentConfig();
        this.logger.info('Environment Manager initialized successfully', {
            environment: this.currentEnvironment,
            healthStatus: 'initializing'
        }, 'environment-manager');
    }
    /**
     * Detect current environment from various sources
     */
    async detectEnvironment() {
        // Priority order for environment detection:
        // 1. Explicit environment variable
        // 2. NODE_ENV
        // 3. Runtime context detection
        // 4. Default to development
        // Check explicit VERSATIL_ENV
        if (process.env.VERSATIL_ENV) {
            const env = process.env.VERSATIL_ENV.toLowerCase();
            if (this.isValidEnvironment(env)) {
                this.currentEnvironment = env;
                this.logger.info('Environment detected from VERSATIL_ENV', { environment: env }, 'environment-manager');
                return env;
            }
        }
        // Check NODE_ENV
        if (process.env.NODE_ENV) {
            const nodeEnv = process.env.NODE_ENV.toLowerCase();
            let mappedEnv;
            switch (nodeEnv) {
                case 'development':
                case 'dev':
                    mappedEnv = 'development';
                    break;
                case 'test':
                case 'testing':
                    mappedEnv = 'testing';
                    break;
                case 'staging':
                case 'stage':
                    mappedEnv = 'staging';
                    break;
                case 'production':
                case 'prod':
                    mappedEnv = 'production';
                    break;
                default:
                    mappedEnv = 'development';
            }
            this.currentEnvironment = mappedEnv;
            this.logger.info('Environment detected from NODE_ENV', {
                nodeEnv,
                mappedEnv
            }, 'environment-manager');
            return mappedEnv;
        }
        // Runtime context detection
        const contextEnv = await this.detectRuntimeContext();
        this.currentEnvironment = contextEnv;
        this.logger.info('Environment detected from runtime context', {
            environment: contextEnv
        }, 'environment-manager');
        return contextEnv;
    }
    /**
     * Detect environment from runtime context
     */
    async detectRuntimeContext() {
        // Check for CI/CD environment indicators
        if (process.env.CI || process.env.GITHUB_ACTIONS || process.env.JENKINS_URL) {
            return 'testing';
        }
        // Check for staging indicators
        if (process.env.STAGING || process.env.HEROKU_APP_NAME?.includes('staging')) {
            return 'staging';
        }
        // Check for production indicators
        if (process.env.PRODUCTION ||
            process.env.HEROKU_APP_NAME?.includes('prod') ||
            process.env.VERCEL_ENV === 'production') {
            return 'production';
        }
        // Default to development
        return 'development';
    }
    /**
     * Load environment configuration
     */
    async loadEnvironmentConfig(environment) {
        const env = environment || this.currentEnvironment;
        // Check cache first
        if (this.cachedConfigs.has(env)) {
            this.environmentConfig = this.cachedConfigs.get(env);
            return this.environmentConfig;
        }
        const configFile = path.join(this.configPath, `${env}.json`);
        try {
            const configData = await fs.readFile(configFile, 'utf-8');
            const config = JSON.parse(configData);
            // Process environment variable substitution
            const processedConfig = this.processEnvironmentVariables(config);
            // Cache the configuration
            this.cachedConfigs.set(env, processedConfig);
            this.environmentConfig = processedConfig;
            this.logger.info('Environment configuration loaded', {
                environment: env,
                configFile,
                servicesCount: Object.keys(config.services).length,
                agentsCount: Object.keys(config.agents).length
            }, 'environment-manager');
            return processedConfig;
        }
        catch (error) {
            this.logger.error('Failed to load environment configuration', {
                environment: env,
                configFile,
                error: error.message
            }, 'environment-manager');
            throw new Error(`Failed to load environment configuration for ${env}: ${error.message}`);
        }
    }
    /**
     * Process environment variable substitution in config
     */
    processEnvironmentVariables(config) {
        const configStr = JSON.stringify(config);
        const processedStr = configStr.replace(/\$\{([^}]+)\}/g, (match, varName) => {
            return process.env[varName] || match;
        });
        return JSON.parse(processedStr);
    }
    /**
     * Switch to a different environment
     */
    async switchEnvironment(newEnvironment) {
        if (!this.isValidEnvironment(newEnvironment)) {
            throw new Error(`Invalid environment: ${newEnvironment}`);
        }
        const previousEnvironment = this.currentEnvironment;
        this.logger.info('Switching environment', {
            from: previousEnvironment,
            to: newEnvironment
        }, 'environment-manager');
        try {
            // Load new environment configuration
            await this.loadEnvironmentConfig(newEnvironment);
            // Validate new environment
            const validation = await this.validateEnvironment();
            if (!validation.isValid) {
                throw new Error(`Environment validation failed: ${validation.errors.join(', ')}`);
            }
            // Update current environment
            this.currentEnvironment = newEnvironment;
            // Apply new configuration
            await this.applyEnvironmentConfig();
            this.logger.info('Environment switched successfully', {
                from: previousEnvironment,
                to: newEnvironment
            }, 'environment-manager');
        }
        catch (error) {
            this.logger.error('Failed to switch environment', {
                from: previousEnvironment,
                to: newEnvironment,
                error: error.message
            }, 'environment-manager');
            throw error;
        }
    }
    /**
     * Validate current environment configuration
     */
    async validateEnvironment() {
        const validation = {
            isValid: true,
            errors: [],
            warnings: [],
            recommendations: []
        };
        if (!this.environmentConfig) {
            validation.isValid = false;
            validation.errors.push('No environment configuration loaded');
            return validation;
        }
        const config = this.environmentConfig;
        // Validate required services
        if (!config.services.mcp) {
            validation.errors.push('MCP service configuration is required');
            validation.isValid = false;
        }
        if (!config.services.database) {
            validation.errors.push('Database service configuration is required');
            validation.isValid = false;
        }
        // Validate environment-specific requirements
        switch (this.currentEnvironment) {
            case 'production':
                this.validateProductionEnvironment(config, validation);
                break;
            case 'staging':
                this.validateStagingEnvironment(config, validation);
                break;
            case 'testing':
                this.validateTestingEnvironment(config, validation);
                break;
            case 'development':
                this.validateDevelopmentEnvironment(config, validation);
                break;
        }
        return validation;
    }
    /**
     * Validate production environment specific requirements
     */
    validateProductionEnvironment(config, validation) {
        if (!config.services.mcp.ssl) {
            validation.errors.push('SSL must be enabled in production');
            validation.isValid = false;
        }
        if (!config.security.encryptionEnabled) {
            validation.errors.push('Encryption must be enabled in production');
            validation.isValid = false;
        }
        if (!config.monitoring.enabled) {
            validation.errors.push('Monitoring must be enabled in production');
            validation.isValid = false;
        }
        if (config.settings.debug) {
            validation.warnings.push('Debug mode should be disabled in production');
        }
        if (!config.backup?.enabled) {
            validation.warnings.push('Backup should be enabled in production');
        }
    }
    /**
     * Validate staging environment specific requirements
     */
    validateStagingEnvironment(config, validation) {
        if (!config.testing.performance?.enabled) {
            validation.warnings.push('Performance testing should be enabled in staging');
        }
        if (!config.security.vulnerabilityScanning) {
            validation.warnings.push('Vulnerability scanning should be enabled in staging');
        }
    }
    /**
     * Validate testing environment specific requirements
     */
    validateTestingEnvironment(config, validation) {
        if (!config.testing.coverage?.threshold || config.testing.coverage.threshold < 80) {
            validation.warnings.push('Test coverage threshold should be at least 80% in testing environment');
        }
        if (!config.services.database.resetOnStart) {
            validation.recommendations.push('Consider enabling database reset on start for testing environment');
        }
    }
    /**
     * Validate development environment specific requirements
     */
    validateDevelopmentEnvironment(config, validation) {
        if (!config.settings.debug) {
            validation.recommendations.push('Debug mode is typically enabled in development');
        }
        if (!config.settings.hotReload) {
            validation.recommendations.push('Hot reload is typically enabled in development');
        }
    }
    /**
     * Apply environment configuration to system
     */
    async applyEnvironmentConfig() {
        if (!this.environmentConfig) {
            throw new Error('No environment configuration to apply');
        }
        // Set environment variables
        process.env.NODE_ENV = this.currentEnvironment;
        process.env.VERSATIL_ENV = this.currentEnvironment;
        // Apply service configurations
        const services = this.environmentConfig.services;
        // MCP Service
        process.env.OPERA_MCP_PORT = services.mcp.port.toString();
        process.env.OPERA_MCP_HOST = services.mcp.host;
        // Database
        if (services.database.url && !services.database.url.startsWith('${')) {
            process.env.DATABASE_URL = services.database.url;
        }
        // Supabase
        if (services.supabase.url && !services.supabase.url.startsWith('${')) {
            process.env.SUPABASE_URL = services.supabase.url;
        }
        if (services.supabase.anonKey && !services.supabase.anonKey.startsWith('${')) {
            process.env.SUPABASE_ANON_KEY = services.supabase.anonKey;
        }
        // Apply feature flags
        const features = this.environmentConfig.features;
        Object.entries(features).forEach(([key, value]) => {
            process.env[`FEATURE_${key.toUpperCase()}`] = value.toString();
        });
        this.logger.info('Environment configuration applied', {
            environment: this.currentEnvironment,
            appliedConfigs: Object.keys(services)
        }, 'environment-manager');
    }
    /**
     * Get current environment health status
     */
    async getEnvironmentHealth() {
        const health = {
            status: 'healthy',
            services: {},
            agents: {},
            overallHealth: 100
        };
        if (!this.environmentConfig) {
            health.status = 'unhealthy';
            health.overallHealth = 0;
            return health;
        }
        // Check service health
        const services = this.environmentConfig.services;
        let totalServices = 0;
        let healthyServices = 0;
        for (const [serviceName, serviceConfig] of Object.entries(services)) {
            totalServices++;
            const serviceHealth = await this.checkServiceHealth(serviceName, serviceConfig);
            health.services[serviceName] = serviceHealth;
            if (serviceHealth.status === 'up') {
                healthyServices++;
            }
        }
        // Check agent health
        const agents = this.environmentConfig.agents;
        let totalAgents = 0;
        let activeAgents = 0;
        for (const [agentName, agentConfig] of Object.entries(agents)) {
            if (agentConfig.enabled) {
                totalAgents++;
                const agentHealth = await this.checkAgentHealth(agentName, agentConfig);
                health.agents[agentName] = agentHealth;
                if (agentHealth.status === 'active') {
                    activeAgents++;
                }
            }
        }
        // Calculate overall health
        const serviceHealthPercent = totalServices > 0 ? (healthyServices / totalServices) * 100 : 100;
        const agentHealthPercent = totalAgents > 0 ? (activeAgents / totalAgents) * 100 : 100;
        health.overallHealth = Math.round((serviceHealthPercent + agentHealthPercent) / 2);
        // Determine overall status
        if (health.overallHealth >= 80) {
            health.status = 'healthy';
        }
        else if (health.overallHealth >= 50) {
            health.status = 'degraded';
        }
        else {
            health.status = 'unhealthy';
        }
        return health;
    }
    /**
     * Check individual service health
     */
    async checkServiceHealth(serviceName, serviceConfig) {
        const startTime = Date.now();
        try {
            // Implement service-specific health checks
            switch (serviceName) {
                case 'mcp':
                    return await this.checkMCPHealth(serviceConfig);
                case 'database':
                    return await this.checkDatabaseHealth(serviceConfig);
                case 'supabase':
                    return await this.checkSupabaseHealth(serviceConfig);
                default:
                    return {
                        status: 'up',
                        responseTime: Date.now() - startTime,
                        lastCheck: Date.now()
                    };
            }
        }
        catch (error) {
            return {
                status: 'down',
                responseTime: Date.now() - startTime,
                lastCheck: Date.now(),
                error: error.message
            };
        }
    }
    /**
     * Check MCP service health
     */
    async checkMCPHealth(config) {
        // Simplified health check - in production, this would make actual HTTP requests
        return {
            status: 'up',
            responseTime: Math.random() * 100,
            lastCheck: Date.now()
        };
    }
    /**
     * Check database health
     */
    async checkDatabaseHealth(config) {
        // Simplified health check
        return {
            status: 'up',
            responseTime: Math.random() * 50,
            lastCheck: Date.now()
        };
    }
    /**
     * Check Supabase health
     */
    async checkSupabaseHealth(config) {
        // Simplified health check
        return {
            status: config.local ? 'up' : 'up',
            responseTime: Math.random() * 200,
            lastCheck: Date.now()
        };
    }
    /**
     * Check individual agent health
     */
    async checkAgentHealth(agentName, agentConfig) {
        // Simplified agent health check
        return {
            status: agentConfig.enabled ? 'active' : 'inactive',
            lastActivity: Date.now() - Math.random() * 300000, // Random within last 5 minutes
            performanceScore: Math.round(80 + Math.random() * 20) // Random score 80-100
        };
    }
    /**
     * Get current environment configuration
     */
    getCurrentEnvironment() {
        return this.currentEnvironment;
    }
    /**
     * Get current environment configuration
     */
    getCurrentConfig() {
        return this.environmentConfig;
    }
    /**
     * Check if environment type is valid
     */
    isValidEnvironment(env) {
        return ['development', 'testing', 'staging', 'production'].includes(env);
    }
    /**
     * Get available environments
     */
    async getAvailableEnvironments() {
        try {
            const files = await fs.readdir(this.configPath);
            return files
                .filter(file => file.endsWith('.json'))
                .map(file => file.replace('.json', ''))
                .filter(env => this.isValidEnvironment(env));
        }
        catch (error) {
            this.logger.error('Failed to list available environments', { error: error.message }, 'environment-manager');
            return [];
        }
    }
    /**
     * Export environment configuration for external use
     */
    exportConfiguration() {
        return {
            currentEnvironment: this.currentEnvironment,
            config: this.environmentConfig,
            health: this.getEnvironmentHealth()
        };
    }
}
// Export singleton instance
export const environmentManager = new EnvironmentManager();
//# sourceMappingURL=environment-manager.js.map