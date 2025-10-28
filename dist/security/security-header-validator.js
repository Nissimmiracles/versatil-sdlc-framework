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
import * as fs from 'fs/promises';
import * as path from 'path';
import { VERSATILLogger } from '../utils/logger.js';
import { observatoryScanner } from './observatory-scanner.js';
export class SecurityHeaderValidator {
    constructor(projectPath = process.cwd()) {
        this.logger = new VERSATILLogger();
        this.projectPath = projectPath;
    }
    /**
     * Validate all security headers for a URL
     */
    async validateHeaders(url) {
        this.logger.info('Validating security headers', { url }, 'security-header-validator');
        const validations = await observatoryScanner.validateSecurityHeaders(url);
        const failures = validations.filter(v => !v.valid || !v.present);
        if (failures.length > 0) {
            this.logger.warn('Security header violations detected', {
                url,
                failures: failures.length,
                issues: failures.map(f => f.header)
            }, 'security-header-validator');
        }
        return validations;
    }
    /**
     * Get recommended security headers
     */
    getRecommendedHeaders() {
        return {
            'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests",
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
            'X-Frame-Options': 'DENY',
            'X-Content-Type-Options': 'nosniff',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()',
            'Cross-Origin-Embedder-Policy': 'require-corp',
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Cross-Origin-Resource-Policy': 'same-origin'
        };
    }
    /**
     * Get minimal security headers (for quick setup)
     */
    getMinimalHeaders() {
        return {
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
            'X-Frame-Options': 'SAMEORIGIN',
            'X-Content-Type-Options': 'nosniff',
            'Referrer-Policy': 'no-referrer-when-downgrade'
        };
    }
    /**
     * Detect backend framework
     */
    async detectFramework() {
        this.logger.info('Detecting backend framework', { projectPath: this.projectPath }, 'security-header-validator');
        const detection = {
            framework: 'unknown',
            language: 'unknown'
        };
        try {
            // Check for Node.js frameworks
            const packageJsonPath = path.join(this.projectPath, 'package.json');
            if (await this.fileExists(packageJsonPath)) {
                const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
                const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
                if (deps.express) {
                    detection.framework = 'express';
                    detection.language = 'node';
                    detection.middlewareFile = 'src/middleware/security.ts';
                }
                else if (deps.fastify) {
                    detection.framework = 'fastify';
                    detection.language = 'node';
                    detection.middlewareFile = 'src/plugins/security.ts';
                }
                else if (deps.koa) {
                    detection.framework = 'koa';
                    detection.language = 'node';
                    detection.middlewareFile = 'src/middleware/security.ts';
                }
            }
            // Check for Python frameworks
            const requirementsPath = path.join(this.projectPath, 'requirements.txt');
            if (await this.fileExists(requirementsPath)) {
                const requirements = await fs.readFile(requirementsPath, 'utf-8');
                if (requirements.includes('fastapi')) {
                    detection.framework = 'fastapi';
                    detection.language = 'python';
                    detection.middlewareFile = 'app/middleware/security.py';
                }
                else if (requirements.includes('django')) {
                    detection.framework = 'django';
                    detection.language = 'python';
                    detection.configFile = 'config/settings.py';
                }
                else if (requirements.includes('flask')) {
                    detection.framework = 'flask';
                    detection.language = 'python';
                    detection.middlewareFile = 'app/__init__.py';
                }
            }
            // Check for Ruby on Rails
            const gemfilePath = path.join(this.projectPath, 'Gemfile');
            if (await this.fileExists(gemfilePath)) {
                const gemfile = await fs.readFile(gemfilePath, 'utf-8');
                if (gemfile.includes('rails')) {
                    detection.framework = 'rails';
                    detection.language = 'ruby';
                    detection.configFile = 'config/initializers/security.rb';
                }
            }
            // Check for Go frameworks
            const goModPath = path.join(this.projectPath, 'go.mod');
            if (await this.fileExists(goModPath)) {
                const goMod = await fs.readFile(goModPath, 'utf-8');
                if (goMod.includes('gin-gonic/gin')) {
                    detection.framework = 'gin';
                    detection.language = 'go';
                    detection.middlewareFile = 'middleware/security.go';
                }
                else if (goMod.includes('labstack/echo')) {
                    detection.framework = 'echo';
                    detection.language = 'go';
                    detection.middlewareFile = 'middleware/security.go';
                }
            }
            // Check for Java Spring Boot
            const pomPath = path.join(this.projectPath, 'pom.xml');
            const gradlePath = path.join(this.projectPath, 'build.gradle');
            if (await this.fileExists(pomPath) || await this.fileExists(gradlePath)) {
                detection.framework = 'spring';
                detection.language = 'java';
                detection.configFile = 'src/main/java/config/SecurityConfig.java';
            }
            this.logger.info('Framework detected', detection, 'security-header-validator');
            return detection;
        }
        catch (error) {
            this.logger.warn('Framework detection failed', { error: error.message }, 'security-header-validator');
            return detection;
        }
    }
    /**
     * Auto-fix security headers for detected framework
     */
    async autoFix(headers = this.getRecommendedHeaders()) {
        const framework = await this.detectFramework();
        this.logger.info('Applying security header auto-fix', {
            framework: framework.framework,
            language: framework.language
        }, 'security-header-validator');
        switch (framework.framework) {
            case 'express':
                return this.fixExpressHeaders(headers);
            case 'fastify':
                return this.fixFastifyHeaders(headers);
            case 'koa':
                return this.fixKoaHeaders(headers);
            case 'fastapi':
                return this.fixFastAPIHeaders(headers);
            case 'django':
                return this.fixDjangoHeaders(headers);
            case 'flask':
                return this.fixFlaskHeaders(headers);
            case 'rails':
                return this.fixRailsHeaders(headers);
            case 'gin':
                return this.fixGinHeaders(headers);
            case 'echo':
                return this.fixEchoHeaders(headers);
            case 'spring':
                return this.fixSpringHeaders(headers);
            default:
                return {
                    success: false,
                    framework: 'unknown',
                    filesModified: [],
                    headersAdded: [],
                    recommendations: [
                        'Framework not detected - please manually configure security headers',
                        'Refer to docs/security/MOZILLA_OBSERVATORY.md for framework-specific instructions'
                    ],
                    error: 'Unknown framework'
                };
        }
    }
    /**
     * Fix Express.js security headers
     */
    async fixExpressHeaders(headers) {
        const middlewarePath = path.join(this.projectPath, 'src/middleware/security.ts');
        const code = this.generateExpressMiddleware(headers);
        try {
            await this.ensureDirectoryExists(path.dirname(middlewarePath));
            await fs.writeFile(middlewarePath, code, 'utf-8');
            return {
                success: true,
                framework: 'express',
                filesModified: [middlewarePath],
                headersAdded: Object.keys(headers),
                recommendations: [
                    'Import and use security middleware in your Express app:',
                    "import { securityHeaders } from './middleware/security';",
                    'app.use(securityHeaders);',
                    '',
                    'Or install helmet.js for production:',
                    'npm install helmet',
                    "app.use(helmet());"
                ]
            };
        }
        catch (error) {
            return {
                success: false,
                framework: 'express',
                filesModified: [],
                headersAdded: [],
                recommendations: [],
                error: error.message
            };
        }
    }
    /**
     * Generate Express middleware code
     */
    generateExpressMiddleware(headers) {
        return `/**
 * Security Headers Middleware for Express
 * Auto-generated by VERSATIL Security Scanner
 */

import { Request, Response, NextFunction } from 'express';

export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Set security headers
${Object.entries(headers).map(([key, value]) => `  res.setHeader('${key}', '${value}');`).join('\n')}

  next();
}

// Alternative: Use helmet.js (recommended for production)
// npm install helmet
// import helmet from 'helmet';
// export const securityHeaders = helmet({
//   contentSecurityPolicy: {
//     directives: {
//       defaultSrc: ["'self'"],
//       scriptSrc: ["'self'", "'unsafe-inline'"],
//       styleSrc: ["'self'", "'unsafe-inline'"],
//       imgSrc: ["'self'", "data:", "https:"],
//     },
//   },
//   hsts: {
//     maxAge: 31536000,
//     includeSubDomains: true,
//     preload: true,
//   },
// });
`;
    }
    /**
     * Fix Fastify security headers
     */
    async fixFastifyHeaders(headers) {
        const pluginPath = path.join(this.projectPath, 'src/plugins/security.ts');
        const code = this.generateFastifyPlugin(headers);
        try {
            await this.ensureDirectoryExists(path.dirname(pluginPath));
            await fs.writeFile(pluginPath, code, 'utf-8');
            return {
                success: true,
                framework: 'fastify',
                filesModified: [pluginPath],
                headersAdded: Object.keys(headers),
                recommendations: [
                    'Register security plugin in your Fastify app:',
                    "import securityPlugin from './plugins/security';",
                    'fastify.register(securityPlugin);',
                    '',
                    'Or install @fastify/helmet:',
                    'npm install @fastify/helmet',
                    "fastify.register(require('@fastify/helmet'));"
                ]
            };
        }
        catch (error) {
            return {
                success: false,
                framework: 'fastify',
                filesModified: [],
                headersAdded: [],
                recommendations: [],
                error: error.message
            };
        }
    }
    /**
     * Generate Fastify plugin code
     */
    generateFastifyPlugin(headers) {
        return `/**
 * Security Headers Plugin for Fastify
 * Auto-generated by VERSATIL Security Scanner
 */

import { FastifyPluginCallback } from 'fastify';
import fp from 'fastify-plugin';

const securityPlugin: FastifyPluginCallback = (fastify, opts, done) => {
  fastify.addHook('onSend', async (request, reply) => {
    // Set security headers
${Object.entries(headers).map(([key, value]) => `    reply.header('${key}', '${value}');`).join('\n')}
  });

  done();
};

export default fp(securityPlugin, {
  name: 'security-headers',
});

// Alternative: Use @fastify/helmet (recommended for production)
// npm install @fastify/helmet
// import helmet from '@fastify/helmet';
// export default helmet;
`;
    }
    /**
     * Fix Koa security headers
     */
    async fixKoaHeaders(headers) {
        const middlewarePath = path.join(this.projectPath, 'src/middleware/security.ts');
        const code = this.generateKoaMiddleware(headers);
        try {
            await this.ensureDirectoryExists(path.dirname(middlewarePath));
            await fs.writeFile(middlewarePath, code, 'utf-8');
            return {
                success: true,
                framework: 'koa',
                filesModified: [middlewarePath],
                headersAdded: Object.keys(headers),
                recommendations: [
                    'Use security middleware in your Koa app:',
                    "import { securityHeaders } from './middleware/security';",
                    'app.use(securityHeaders);',
                    '',
                    'Or install koa-helmet:',
                    'npm install koa-helmet',
                    "const helmet = require('koa-helmet');",
                    'app.use(helmet());'
                ]
            };
        }
        catch (error) {
            return {
                success: false,
                framework: 'koa',
                filesModified: [],
                headersAdded: [],
                recommendations: [],
                error: error.message
            };
        }
    }
    /**
     * Generate Koa middleware code
     */
    generateKoaMiddleware(headers) {
        return `/**
 * Security Headers Middleware for Koa
 * Auto-generated by VERSATIL Security Scanner
 */

import { Context, Next } from 'koa';

export async function securityHeaders(ctx: Context, next: Next) {
  // Set security headers
${Object.entries(headers).map(([key, value]) => `  ctx.set('${key}', '${value}');`).join('\n')}

  await next();
}

// Alternative: Use koa-helmet (recommended for production)
// npm install koa-helmet
// import helmet from 'koa-helmet';
// export const securityHeaders = helmet();
`;
    }
    /**
     * Fix FastAPI security headers
     */
    async fixFastAPIHeaders(headers) {
        const middlewarePath = path.join(this.projectPath, 'app/middleware/security.py');
        const code = this.generateFastAPIMiddleware(headers);
        try {
            await this.ensureDirectoryExists(path.dirname(middlewarePath));
            await fs.writeFile(middlewarePath, code, 'utf-8');
            return {
                success: true,
                framework: 'fastapi',
                filesModified: [middlewarePath],
                headersAdded: Object.keys(headers),
                recommendations: [
                    'Add security middleware to your FastAPI app:',
                    'from app.middleware.security import add_security_headers',
                    'app.middleware("http")(add_security_headers)'
                ]
            };
        }
        catch (error) {
            return {
                success: false,
                framework: 'fastapi',
                filesModified: [],
                headersAdded: [],
                recommendations: [],
                error: error.message
            };
        }
    }
    /**
     * Generate FastAPI middleware code
     */
    generateFastAPIMiddleware(headers) {
        return `"""
Security Headers Middleware for FastAPI
Auto-generated by VERSATIL Security Scanner
"""

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        # Set security headers
${Object.entries(headers).map(([key, value]) => `        response.headers['${key}'] = '${value}'`).join('\n')}

        return response

def add_security_headers(request: Request, call_next):
    """Alternative middleware function"""
    return SecurityHeadersMiddleware(request.app).dispatch(request, call_next)
`;
    }
    /**
     * Fix Django security headers
     */
    async fixDjangoHeaders(headers) {
        const settingsPath = path.join(this.projectPath, 'config/settings.py');
        const code = this.generateDjangoSettings(headers);
        return {
            success: true,
            framework: 'django',
            filesModified: [],
            headersAdded: Object.keys(headers),
            recommendations: [
                'Add to your Django settings.py:',
                '',
                code,
                '',
                'Or install django-csp:',
                'pip install django-csp',
                "MIDDLEWARE.append('csp.middleware.CSPMiddleware')"
            ]
        };
    }
    /**
     * Generate Django settings code
     */
    generateDjangoSettings(headers) {
        return `# Security Headers Configuration
# Auto-generated by VERSATIL Security Scanner

# HTTPS/SSL
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# HSTS
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# Security Headers
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'

# Content Security Policy (requires django-csp)
# pip install django-csp
CSP_DEFAULT_SRC = ("'self'",)
CSP_SCRIPT_SRC = ("'self'", "'unsafe-inline'")
CSP_STYLE_SRC = ("'self'", "'unsafe-inline'")
CSP_IMG_SRC = ("'self'", "data:", "https:")
`;
    }
    /**
     * Fix Flask security headers
     */
    async fixFlaskHeaders(headers) {
        const middlewarePath = path.join(this.projectPath, 'app/__init__.py');
        const code = this.generateFlaskMiddleware(headers);
        return {
            success: true,
            framework: 'flask',
            filesModified: [],
            headersAdded: Object.keys(headers),
            recommendations: [
                'Add to your Flask app initialization:',
                '',
                code,
                '',
                'Or install flask-talisman:',
                'pip install flask-talisman',
                'from flask_talisman import Talisman',
                'Talisman(app)'
            ]
        };
    }
    /**
     * Generate Flask middleware code
     */
    generateFlaskMiddleware(headers) {
        return `# Security Headers Configuration
# Auto-generated by VERSATIL Security Scanner

@app.after_request
def add_security_headers(response):
    """Add security headers to all responses"""
${Object.entries(headers).map(([key, value]) => `    response.headers['${key}'] = '${value}'`).join('\n')}
    return response
`;
    }
    /**
     * Fix Rails security headers
     */
    async fixRailsHeaders(headers) {
        const initializerPath = path.join(this.projectPath, 'config/initializers/security.rb');
        const code = this.generateRailsInitializer(headers);
        try {
            await this.ensureDirectoryExists(path.dirname(initializerPath));
            await fs.writeFile(initializerPath, code, 'utf-8');
            return {
                success: true,
                framework: 'rails',
                filesModified: [initializerPath],
                headersAdded: Object.keys(headers),
                recommendations: [
                    'Security headers configured in config/initializers/security.rb',
                    'Restart Rails server to apply changes',
                    '',
                    'Or use secure_headers gem:',
                    'gem "secure_headers"',
                    'bundle install'
                ]
            };
        }
        catch (error) {
            return {
                success: false,
                framework: 'rails',
                filesModified: [],
                headersAdded: [],
                recommendations: [],
                error: error.message
            };
        }
    }
    /**
     * Generate Rails initializer code
     */
    generateRailsInitializer(headers) {
        return `# Security Headers Configuration
# Auto-generated by VERSATIL Security Scanner

Rails.application.config.action_dispatch.default_headers = {
${Object.entries(headers).map(([key, value]) => `  '${key}' => '${value}',`).join('\n')}
}

# Alternative: Use secure_headers gem (recommended)
# gem 'secure_headers'
# SecureHeaders::Configuration.default do |config|
#   config.hsts = "max-age=31536000; includeSubDomains; preload"
#   config.x_frame_options = "DENY"
#   config.x_content_type_options = "nosniff"
#   config.x_xss_protection = "1; mode=block"
#   config.referrer_policy = %w[origin-when-cross-origin strict-origin-when-cross-origin]
# end
`;
    }
    /**
     * Fix Gin (Go) security headers
     */
    async fixGinHeaders(headers) {
        const middlewarePath = path.join(this.projectPath, 'middleware/security.go');
        const code = this.generateGinMiddleware(headers);
        try {
            await this.ensureDirectoryExists(path.dirname(middlewarePath));
            await fs.writeFile(middlewarePath, code, 'utf-8');
            return {
                success: true,
                framework: 'gin',
                filesModified: [middlewarePath],
                headersAdded: Object.keys(headers),
                recommendations: [
                    'Use security middleware in your Gin app:',
                    'import "yourapp/middleware"',
                    'router.Use(middleware.SecurityHeaders())'
                ]
            };
        }
        catch (error) {
            return {
                success: false,
                framework: 'gin',
                filesModified: [],
                headersAdded: [],
                recommendations: [],
                error: error.message
            };
        }
    }
    /**
     * Generate Gin middleware code
     */
    generateGinMiddleware(headers) {
        return `package middleware

// Security Headers Middleware for Gin
// Auto-generated by VERSATIL Security Scanner

import "github.com/gin-gonic/gin"

func SecurityHeaders() gin.HandlerFunc {
    return func(c *gin.Context) {
${Object.entries(headers).map(([key, value]) => `        c.Header("${key}", "${value}")`).join('\n')}
        c.Next()
    }
}
`;
    }
    /**
     * Fix Echo (Go) security headers
     */
    async fixEchoHeaders(headers) {
        const middlewarePath = path.join(this.projectPath, 'middleware/security.go');
        const code = this.generateEchoMiddleware(headers);
        try {
            await this.ensureDirectoryExists(path.dirname(middlewarePath));
            await fs.writeFile(middlewarePath, code, 'utf-8');
            return {
                success: true,
                framework: 'echo',
                filesModified: [middlewarePath],
                headersAdded: Object.keys(headers),
                recommendations: [
                    'Use security middleware in your Echo app:',
                    'import "yourapp/middleware"',
                    'e.Use(middleware.SecurityHeaders)'
                ]
            };
        }
        catch (error) {
            return {
                success: false,
                framework: 'echo',
                filesModified: [],
                headersAdded: [],
                recommendations: [],
                error: error.message
            };
        }
    }
    /**
     * Generate Echo middleware code
     */
    generateEchoMiddleware(headers) {
        return `package middleware

// Security Headers Middleware for Echo
// Auto-generated by VERSATIL Security Scanner

import "github.com/labstack/echo/v4"

func SecurityHeaders(next echo.HandlerFunc) echo.HandlerFunc {
    return func(c echo.Context) error {
${Object.entries(headers).map(([key, value]) => `        c.Response().Header().Set("${key}", "${value}")`).join('\n')}
        return next(c)
    }
}
`;
    }
    /**
     * Fix Spring Boot security headers
     */
    async fixSpringHeaders(headers) {
        const configPath = path.join(this.projectPath, 'src/main/java/config/SecurityConfig.java');
        const code = this.generateSpringConfig(headers);
        return {
            success: true,
            framework: 'spring',
            filesModified: [],
            headersAdded: Object.keys(headers),
            recommendations: [
                'Create SecurityConfig.java in your project:',
                '',
                code,
                '',
                'Spring Security automatically adds security headers.',
                'Customize as needed in your @Configuration class.'
            ]
        };
    }
    /**
     * Generate Spring Security config code
     */
    generateSpringConfig(headers) {
        return `package config;

// Security Headers Configuration for Spring Boot
// Auto-generated by VERSATIL Security Scanner

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .headers()
                .contentSecurityPolicy("${headers['Content-Security-Policy'] || "default-src 'self'"}")
                .and()
                .httpStrictTransportSecurity()
                    .maxAgeInSeconds(31536000)
                    .includeSubDomains(true)
                .and()
                .frameOptions().deny()
                .xssProtection().block(true)
                .contentTypeOptions()
                .referrerPolicy()
                    .policy(ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN);

        return http.build();
    }
}
`;
    }
    /**
     * Check if file exists
     */
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Ensure directory exists
     */
    async ensureDirectoryExists(dirPath) {
        try {
            await fs.mkdir(dirPath, { recursive: true });
        }
        catch (error) {
            // Directory already exists or can't be created
        }
    }
}
// Export singleton instance
export const securityHeaderValidator = new SecurityHeaderValidator();
//# sourceMappingURL=security-header-validator.js.map