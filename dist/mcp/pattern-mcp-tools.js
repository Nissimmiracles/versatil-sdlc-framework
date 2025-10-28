/**
 * Pattern Library MCP Tools (v7.5.1)
 *
 * MCP tools for v7.5.0 pattern library integration:
 * - Pattern search and discovery
 * - Pattern application with code generation
 * - Pattern-specific setup tools (WebSocket, Payments, S3, Email, Rate-limiting)
 * - Telemetry analytics integration
 */
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { getMetricsService } from '../telemetry/automation-metrics.js';
// ============================================================================
// Pattern Search
// ============================================================================
export async function searchPatterns(query) {
    const patternsDir = join(process.cwd(), 'templates', 'patterns');
    const patternFiles = [
        'websocket-real-time.json',
        'payment-integration.json',
        'file-upload-s3.json',
        'email-templates.json',
        'api-rate-limiting.json'
    ];
    const results = [];
    const queryTokens = query.toLowerCase().split(/\s+/);
    for (const file of patternFiles) {
        const filePath = join(patternsDir, file);
        if (!existsSync(filePath))
            continue;
        try {
            const content = readFileSync(filePath, 'utf-8');
            const pattern = JSON.parse(content);
            // Calculate match score
            let matchScore = 0;
            const allText = [
                pattern.name,
                pattern.category,
                pattern.description,
                ...pattern.keywords,
                ...pattern.use_cases
            ].join(' ').toLowerCase();
            queryTokens.forEach(token => {
                if (allText.includes(token))
                    matchScore += 10;
            });
            // Boost for keyword exact matches
            pattern.keywords.forEach(kw => {
                if (queryTokens.includes(kw.toLowerCase()))
                    matchScore += 30;
            });
            if (matchScore > 0) {
                results.push({ pattern, file_path: filePath, match_score: matchScore });
            }
        }
        catch (error) {
            console.error(`Failed to load pattern ${file}:`, error);
        }
    }
    return results.sort((a, b) => b.match_score - a.match_score);
}
// ============================================================================
// Pattern Application
// ============================================================================
export async function applyPattern(patternName, options) {
    const patternsDir = join(process.cwd(), 'templates', 'patterns');
    const patternFile = `${patternName}.json`;
    const filePath = join(patternsDir, patternFile);
    if (!existsSync(filePath)) {
        return {
            success: false,
            message: `Pattern not found: ${patternName}. Available: websocket-real-time, payment-integration, file-upload-s3, email-templates, api-rate-limiting`
        };
    }
    const pattern = JSON.parse(readFileSync(filePath, 'utf-8'));
    if (options?.dryRun) {
        return {
            success: true,
            message: `Dry run: Would apply pattern "${pattern.name}"`,
            next_steps: [
                `Install dependencies: ${pattern.technologies.join(', ')}`,
                `Estimated effort: ${pattern.estimated_effort.hours} hours (${pattern.estimated_effort.range})`,
                `Success rate: ${pattern.success_rate}%`,
                'Review pattern JSON for implementation details'
            ]
        };
    }
    return {
        success: true,
        message: `Pattern "${pattern.name}" ready for application`,
        files_created: [],
        next_steps: [
            `1. Review pattern file: templates/patterns/${patternFile}`,
            `2. Install dependencies: ${pattern.technologies.join(', ')}`,
            `3. Follow step-by-step instructions in pattern JSON`,
            `4. Estimated time: ${pattern.estimated_effort.hours} hours`
        ]
    };
}
// ============================================================================
// WebSocket Setup
// ============================================================================
export async function setupWebSocket(options) {
    const port = options?.port || 3001;
    const useAuth = options?.auth !== false;
    const useRooms = options?.rooms !== false;
    return {
        success: true,
        message: `WebSocket setup configuration ready (port: ${port}, auth: ${useAuth}, rooms: ${useRooms})`,
        next_steps: [
            'Install: npm install socket.io socket.io-client',
            'Create src/websocket/socket-server.ts (see pattern JSON)',
            'Create src/hooks/useWebSocket.ts for React client',
            useAuth ? 'Implement JWT authentication middleware' : 'Skip authentication',
            useRooms ? 'Add room management handlers' : 'Skip room management',
            `Start server on port ${port}`,
            'Test connection with client'
        ]
    };
}
// ============================================================================
// Payment Setup
// ============================================================================
export async function setupPayment(options) {
    const provider = options?.provider || 'stripe';
    const useSubscriptions = options?.subscriptions !== false;
    const useWebhooks = options?.webhooks !== false;
    const steps = [
        `Install: npm install ${provider === 'stripe' ? 'stripe @stripe/stripe-js @stripe/react-stripe-js' : provider === 'paypal' ? '@paypal/checkout-server-sdk' : 'stripe @stripe/stripe-js @paypal/checkout-server-sdk'}`,
        'Set environment variables: STRIPE_SECRET_KEY, STRIPE_PUBLIC_KEY',
        'Create src/payments/stripe-service.ts (see pattern JSON)',
        'Create src/components/StripeCheckout.tsx for React'
    ];
    if (useWebhooks) {
        steps.push('Create src/webhooks/stripe-webhook.ts with signature verification');
        steps.push('Configure webhook URL in Stripe dashboard');
    }
    if (useSubscriptions) {
        steps.push('Implement subscription management (create, cancel, upgrade)');
    }
    steps.push('Test with Stripe test cards (4242 4242 4242 4242)');
    return {
        success: true,
        message: `Payment setup ready (provider: ${provider}, subscriptions: ${useSubscriptions}, webhooks: ${useWebhooks})`,
        next_steps: steps
    };
}
// ============================================================================
// S3 Upload Setup
// ============================================================================
export async function setupS3Upload(options) {
    const useImageOpt = options?.imageOptimization !== false;
    const useMultipart = options?.multipart !== false;
    const useCDN = options?.cdn || false;
    const steps = [
        'Install: npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner uuid',
        useImageOpt ? 'Install: npm install sharp' : null,
        'Create S3 bucket in AWS Console',
        'Create IAM user with S3 permissions',
        'Set environment variables: AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET_NAME',
        'Create src/uploads/s3-service.ts (presigned URLs)',
        'Create src/hooks/useS3Upload.ts for React'
    ].filter(Boolean);
    if (useImageOpt) {
        steps.push('Create src/uploads/image-processor.ts with Sharp');
    }
    if (useMultipart) {
        steps.push('Create src/uploads/multipart-upload.ts for large files (>100MB)');
    }
    if (useCDN) {
        steps.push('Set up CloudFront distribution for CDN');
    }
    return {
        success: true,
        message: `S3 upload setup ready (imageOpt: ${useImageOpt}, multipart: ${useMultipart}, CDN: ${useCDN})`,
        next_steps: steps
    };
}
// ============================================================================
// Email Setup
// ============================================================================
export async function setupEmail(options) {
    const provider = options?.provider || 'sendgrid';
    const useTemplates = options?.templates !== false;
    const steps = [
        `Install: npm install ${provider === 'sendgrid' ? '@sendgrid/mail' : provider === 'nodemailer' ? 'nodemailer' : '@sendgrid/mail nodemailer'}`,
        useTemplates ? 'Install: npm install handlebars' : null,
        provider === 'sendgrid' ? 'Create SendGrid account and get API key' : 'Configure SMTP credentials',
        'Set environment variables: SENDGRID_API_KEY, FROM_EMAIL, FROM_NAME',
        'Create src/emails/sendgrid-service.ts',
        useTemplates ? 'Create templates/emails/ directory' : null,
        useTemplates ? 'Create welcome.hbs, password-reset.hbs templates' : null,
        'Test with sandbox mode',
        'Verify domain in production'
    ].filter(Boolean);
    return {
        success: true,
        message: `Email setup ready (provider: ${provider}, templates: ${useTemplates})`,
        next_steps: steps
    };
}
// ============================================================================
// Rate Limiting Setup
// ============================================================================
export async function setupRateLimiting(options) {
    const useDistributed = options?.distributed !== false;
    const useTiered = options?.tiered || false;
    const useCostBased = options?.costBased || false;
    const steps = [
        'Install: npm install express-rate-limit',
        useDistributed ? 'Install: npm install rate-limiter-flexible ioredis rate-limit-redis' : null,
        useDistributed ? 'Set up Redis server (AWS ElastiCache or Redis Cloud)' : null,
        useDistributed ? 'Set environment variables: REDIS_HOST, REDIS_PORT, REDIS_PASSWORD' : null,
        'Create src/middleware/rate-limit.ts',
        useDistributed ? 'Create src/middleware/redis-rate-limit.ts' : null,
        useTiered ? 'Create src/middleware/tiered-rate-limit.ts (free/premium/enterprise)' : null,
        useCostBased ? 'Create src/middleware/token-bucket.ts (cost-based limiting)' : null,
        'Apply middleware to Express routes',
        'Test rate limiting with curl loops'
    ].filter(Boolean);
    return {
        success: true,
        message: `Rate limiting setup ready (distributed: ${useDistributed}, tiered: ${useTiered}, costBased: ${useCostBased})`,
        next_steps: steps
    };
}
// ============================================================================
// Telemetry Report
// ============================================================================
export async function generateTelemetryReport(format = 'console') {
    try {
        const metricsService = getMetricsService(process.cwd());
        if (format === 'json') {
            const hookPerf = metricsService.getHookPerformance();
            const agentStats = metricsService.getAgentActivationStats();
            const topPatterns = metricsService.getTopPatterns(10);
            const crossSkill = metricsService.getCrossSkillPatterns();
            return {
                success: true,
                report: {
                    timestamp: new Date().toISOString(),
                    hookPerformance: hookPerf,
                    agentActivation: agentStats,
                    topPatterns,
                    crossSkillLoading: crossSkill
                }
            };
        }
        const report = metricsService.generateAnalyticsReport();
        return {
            success: true,
            report
        };
    }
    catch (error) {
        return {
            success: false,
            report: `Error generating telemetry report: ${error.message}`
        };
    }
}
// ============================================================================
// Export all tools
// ============================================================================
export const patternMCPTools = {
    pattern_search: searchPatterns,
    pattern_apply: applyPattern,
    websocket_setup: setupWebSocket,
    payment_setup: setupPayment,
    s3_upload_setup: setupS3Upload,
    email_setup: setupEmail,
    rate_limit_setup: setupRateLimiting,
    telemetry_report: generateTelemetryReport
};
//# sourceMappingURL=pattern-mcp-tools.js.map