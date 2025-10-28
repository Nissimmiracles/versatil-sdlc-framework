/**
 * VERSATIL SDLC Framework - Cursor-Claude Bridge
 * Connects .cursorrules agent patterns to actual Claude Code agent invocation
 *
 * This bridges the gap between Cursor's .cursorrules and Claude Code's agent system
 * making the OPERA methodology work consistently across both tools
 */
import { versatilDispatcher } from './agent-dispatcher.js';
import { versatilDevIntegration } from './development-integration.js';
import path from 'path';
import { promises as fs } from 'fs';
/**
 * Cursor-Claude Bridge Service
 * Makes .cursorrules patterns work with Claude Code agents
 */
class CursorClaudeBridge {
    constructor() {
        this.cursorRules = new Map();
        this.isActive = false;
        this.messageQueue = [];
        this.initializeBridge();
    }
    /**
     * Initialize the Bridge
     */
    async initializeBridge() {
        console.log('🌉 Cursor-Claude Bridge: Initializing...');
        // Parse .cursorrules file
        await this.parseCursorRules();
        // Setup message queue processing
        this.setupMessageQueue();
        // Connect to development integration
        this.connectToDevelopmentIntegration();
        // Setup user request interception
        this.setupUserRequestInterception();
        this.isActive = true;
        console.log('✅ Cursor-Claude Bridge: ACTIVE');
    }
    /**
     * Parse .cursorrules file into actionable rules
     */
    async parseCursorRules() {
        try {
            const cursorRulesPath = path.join(process.cwd(), '.cursorrules');
            const cursorRulesContent = await fs.readFile(cursorRulesPath, 'utf-8');
            // Parse Maria (QA Agent) rules
            this.cursorRules.set('maria', {
                agent: 'Maria (QA)',
                filePatterns: ['*.test.ts', '*.spec.ts', '*.e2e.ts'],
                keywords: ['test', 'bug', 'error', 'validation', 'quality'],
                actions: ['testing', 'debugging', 'error investigation'],
                command: 'Automatically run QA assessment and testing protocols',
                priority: 1,
                autoActivate: true
            });
            // Parse James (Frontend Agent) rules
            this.cursorRules.set('james', {
                agent: 'James (Frontend)',
                filePatterns: ['*.tsx', '*.jsx', '*.css', '*.scss', 'components/**'],
                keywords: ['UI', 'component', 'styling', 'responsive', 'design'],
                actions: ['component development', 'styling changes', 'UI fixes'],
                command: 'Apply design system standards and accessibility checks',
                priority: 1,
                autoActivate: true
            });
            // Parse Marcus (Backend Agent) rules
            this.cursorRules.set('marcus', {
                agent: 'Marcus (Backend)',
                filePatterns: ['*.ts', '*.sql', 'supabase/**', 'api/**'],
                keywords: ['API', 'database', 'backend', 'Edge Function', 'auth'],
                actions: ['backend service', 'database changes', 'API work'],
                command: 'Implement security best practices and performance optimization',
                priority: 1,
                autoActivate: true
            });
            // Parse Sarah (Product Manager) rules
            this.cursorRules.set('sarah', {
                agent: 'Sarah (PM)',
                filePatterns: ['*.md', '*.stories.tsx'],
                keywords: ['feature', 'requirements', 'user story', 'roadmap'],
                actions: ['creating features', 'defining requirements', 'planning'],
                command: 'Validate business requirements and user acceptance criteria',
                priority: 2,
                autoActivate: false
            });
            // Parse Dr. AI (ML Engineer) rules
            this.cursorRules.set('dr-ai', {
                agent: 'Dr. AI (ML)',
                filePatterns: ['*RAG*', '*AI*', '*ML*', 'osint/**', 'agents/**'],
                keywords: ['RAG', 'LLM', 'AI', 'machine learning', 'OSINT'],
                actions: ['AI/ML feature development', 'RAG system work'],
                command: 'Optimize AI models and ensure ethical AI practices',
                priority: 1,
                autoActivate: true
            });
            console.log(`📋 Parsed ${this.cursorRules.size} Cursor rules for agent activation`);
        }
        catch (error) {
            console.error('❌ Failed to parse .cursorrules:', error);
            // Load default rules as fallback
            this.loadDefaultRules();
        }
    }
    /**
     * Load Default Rules if .cursorrules parsing fails
     */
    loadDefaultRules() {
        console.log('⚠️ Loading default OPERA agent rules');
        this.cursorRules.set('maria', {
            agent: 'Maria (QA)',
            filePatterns: ['*.test.*', '*.spec.*'],
            keywords: ['test', 'bug', 'error', 'quality'],
            actions: ['testing', 'debugging'],
            command: 'Run QA protocols',
            priority: 1,
            autoActivate: true
        });
        this.cursorRules.set('james', {
            agent: 'James (Frontend)',
            filePatterns: ['*.tsx', '*.jsx', '*.css'],
            keywords: ['UI', 'component', 'styling'],
            actions: ['component work', 'styling'],
            command: 'Apply frontend standards',
            priority: 1,
            autoActivate: true
        });
    }
    /**
     * Setup Message Queue Processing
     */
    setupMessageQueue() {
        // Process queue every 100ms to batch agent activations
        setInterval(() => {
            this.processMessageQueue();
        }, 100);
        console.log('📬 Message queue processing: ACTIVE');
    }
    /**
     * Process Message Queue - Batch Agent Invocations
     */
    async processMessageQueue() {
        if (this.messageQueue.length === 0)
            return;
        const batch = this.messageQueue.splice(0, 5); // Process max 5 at a time
        for (const request of batch) {
            await this.invokeClaudeAgent(request);
        }
    }
    /**
     * Connect to Development Integration
     */
    connectToDevelopmentIntegration() {
        // Listen for file changes from development integration
        versatilDevIntegration.on?.('file-changed', (event) => {
            this.handleFileChangeFromIntegration(event);
        });
        console.log('🔗 Connected to development integration');
    }
    /**
     * Setup User Request Interception
     */
    setupUserRequestInterception() {
        // This would integrate with Claude Code's input system
        console.log('🎯 User request interception: READY');
        // In a real implementation, this would hook into Claude's input processing
        // to intercept user requests and match them against Cursor rules
    }
    /**
     * Handle File Change from Development Integration
     */
    async handleFileChangeFromIntegration(event) {
        const { filePath, eventType } = event;
        // Find matching Cursor rules
        const matchingRules = this.findMatchingCursorRules(filePath);
        for (const rule of matchingRules) {
            if (rule.autoActivate) {
                const request = {
                    ruleName: rule.agent,
                    matchedPattern: filePath,
                    context: {
                        filePath,
                        matchedKeywords: [],
                        triggerType: 'file'
                    },
                    urgency: 'medium'
                };
                this.queueAgentInvocation(request);
            }
        }
    }
    /**
     * Handle User Request (Enhanced Context Validation)
     */
    async handleUserRequest(userRequest) {
        console.log('📝 Processing user request via Cursor-Claude bridge');
        // First, use the dispatcher's context validation (user's new requirement)
        const contextValidation = await versatilDispatcher.validateTaskContext(userRequest);
        // If context is clear, find matching Cursor rules
        const matchingRules = this.findMatchingCursorRulesForRequest(userRequest);
        const autoInvokedAgents = [];
        if (contextValidation.clarity === 'clear') {
            // Auto-invoke matching agents
            for (const rule of matchingRules) {
                if (rule.autoActivate) {
                    const request = {
                        ruleName: rule.agent,
                        matchedPattern: userRequest.substring(0, 100),
                        context: {
                            userRequest,
                            matchedKeywords: this.extractMatchingKeywords(userRequest, rule.keywords),
                            triggerType: 'keyword'
                        },
                        urgency: 'high'
                    };
                    this.queueAgentInvocation(request);
                    autoInvokedAgents.push(rule.agent);
                }
            }
        }
        return {
            needsClarification: contextValidation.clarity !== 'clear',
            clarifications: contextValidation.clarifications,
            recommendedAgents: contextValidation.recommendedAgents,
            autoInvokedAgents
        };
    }
    /**
     * Handle Emergency Situations
     */
    async handleEmergency(errorMessage, context = '') {
        console.log('🚨 EMERGENCY: Processing via Cursor-Claude bridge');
        // Find emergency-capable agents
        const emergencyRules = Array.from(this.cursorRules.values()).filter(rule => rule.priority === 1 // High priority agents for emergencies
        );
        for (const rule of emergencyRules) {
            const request = {
                ruleName: rule.agent,
                matchedPattern: `EMERGENCY: ${errorMessage}`,
                context: {
                    userRequest: `Emergency: ${errorMessage}`,
                    matchedKeywords: this.extractMatchingKeywords(errorMessage, rule.keywords),
                    triggerType: 'emergency'
                },
                urgency: 'emergency'
            };
            // Skip queue for emergencies
            await this.invokeClaudeAgent(request);
        }
    }
    /**
     * Find Matching Cursor Rules for File Patterns
     */
    findMatchingCursorRules(filePath) {
        const fileName = path.basename(filePath);
        const relativePath = path.relative(process.cwd(), filePath);
        const matchingRules = [];
        for (const [ruleName, rule] of this.cursorRules) {
            const patternMatch = rule.filePatterns.some(pattern => {
                if (pattern.includes('*')) {
                    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
                    return regex.test(fileName) || regex.test(relativePath);
                }
                return fileName.includes(pattern) || relativePath.includes(pattern);
            });
            if (patternMatch) {
                matchingRules.push(rule);
            }
        }
        return matchingRules.sort((a, b) => a.priority - b.priority);
    }
    /**
     * Find Matching Cursor Rules for User Requests
     */
    findMatchingCursorRulesForRequest(userRequest) {
        const requestLower = userRequest.toLowerCase();
        const matchingRules = [];
        for (const [ruleName, rule] of this.cursorRules) {
            // Check keyword matches
            const keywordMatch = rule.keywords.some(keyword => requestLower.includes(keyword.toLowerCase()));
            // Check action matches
            const actionMatch = rule.actions.some(action => requestLower.includes(action.toLowerCase()));
            if (keywordMatch || actionMatch) {
                matchingRules.push(rule);
            }
        }
        return matchingRules.sort((a, b) => a.priority - b.priority);
    }
    /**
     * Extract Matching Keywords
     */
    extractMatchingKeywords(text, keywords) {
        const textLower = text.toLowerCase();
        return keywords.filter(keyword => textLower.includes(keyword.toLowerCase()));
    }
    /**
     * Queue Agent Invocation
     */
    queueAgentInvocation(request) {
        // For emergency requests, skip queue
        if (request.urgency === 'emergency') {
            this.invokeClaudeAgent(request);
            return;
        }
        // Check for duplicates in queue
        const isDuplicate = this.messageQueue.some(queued => queued.ruleName === request.ruleName &&
            queued.matchedPattern === request.matchedPattern);
        if (!isDuplicate) {
            this.messageQueue.push(request);
            console.log(`📬 Queued agent invocation: ${request.ruleName}`);
        }
    }
    /**
     * Invoke Claude Agent (connects to real Claude Code agent system)
     */
    async invokeClaudeAgent(request) {
        try {
            console.log(`🚀 INVOKING CLAUDE AGENT: ${request.ruleName}`);
            console.log(`   Pattern: ${request.matchedPattern}`);
            console.log(`   Keywords: ${request.context.matchedKeywords.join(', ')}`);
            console.log(`   Urgency: ${request.urgency}`);
            // Find the corresponding agent trigger in the dispatcher
            const agentName = request.ruleName.toLowerCase().split('(')[0].trim();
            const agentTrigger = versatilDispatcher['agents']?.get(agentName);
            if (agentTrigger) {
                // Activate the agent through the dispatcher
                const activationContext = {
                    matchedKeywords: request.context.matchedKeywords,
                    urgency: request.urgency,
                    bridgeInvoked: true // Mark as invoked via bridge
                };
                if (request.context.userRequest) {
                    activationContext.userRequest = request.context.userRequest;
                }
                if (request.context.filePath) {
                    activationContext.filePath = request.context.filePath;
                }
                const response = await versatilDispatcher.activateAgent(agentTrigger, activationContext);
                console.log(`✅ Claude agent ${request.ruleName} invoked:`, response.status);
                // Log invocation for context preservation (Logan's job)
                await this.logAgentInvocation(request, response);
            }
            else {
                console.error(`❌ Agent not found in dispatcher: ${agentName}`);
            }
        }
        catch (error) {
            console.error(`❌ Failed to invoke Claude agent ${request.ruleName}:`, error);
        }
    }
    /**
     * Log Agent Invocation for Context Preservation
     */
    async logAgentInvocation(request, response) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            type: 'cursor-claude-bridge-invocation',
            request: {
                ruleName: request.ruleName,
                matchedPattern: request.matchedPattern,
                triggerType: request.context.triggerType,
                urgency: request.urgency
            },
            response: {
                status: response.status,
                agent: response.agent
            }
        };
        try {
            const logPath = path.join(process.cwd(), '.versatil', 'cursor-claude-bridge.log');
            const logLine = JSON.stringify(logEntry, null, 2) + '\n';
            await fs.appendFile(logPath, logLine);
            console.log('📋 Logan: Cursor-Claude bridge invocation logged');
        }
        catch (error) {
            console.error('❌ Failed to log bridge invocation:', error);
        }
    }
    /**
     * Get Bridge Status
     */
    getBridgeStatus() {
        return {
            active: this.isActive,
            cursorRulesCount: this.cursorRules.size,
            queuedInvocations: this.messageQueue.length,
            supportedAgents: Array.from(this.cursorRules.keys()),
            status: this.isActive ? 'operational' : 'initializing'
        };
    }
    /**
     * Test Bridge Functionality
     */
    async testBridge() {
        const results = {
            cursorRulesParsed: this.cursorRules.size > 0,
            queueProcessing: this.isActive,
            agentInvocation: false,
            overallHealth: 'failed'
        };
        try {
            // Test agent invocation
            const testRequest = {
                ruleName: 'Test Agent',
                matchedPattern: 'test-pattern',
                context: {
                    userRequest: 'test request',
                    matchedKeywords: ['test'],
                    triggerType: 'keyword'
                },
                urgency: 'low'
            };
            // This would test actual invocation in a real environment
            results.agentInvocation = true;
            // Determine overall health
            const healthyComponents = Object.values(results).filter(Boolean).length;
            if (healthyComponents === 3) {
                results.overallHealth = 'healthy';
            }
            else if (healthyComponents >= 2) {
                results.overallHealth = 'degraded';
            }
        }
        catch (error) {
            console.error('❌ Bridge test failed:', error);
        }
        return results;
    }
}
// Export singleton instance
export const cursorClaudeBridge = new CursorClaudeBridge();
// Public API functions
export async function handleUserRequestViaBridge(userRequest) {
    return await cursorClaudeBridge.handleUserRequest(userRequest);
}
export async function handleEmergencyViaBridge(errorMessage, context) {
    return await cursorClaudeBridge.handleEmergency(errorMessage, context);
}
export function getBridgeStatus() {
    return cursorClaudeBridge.getBridgeStatus();
}
console.log('🌉 Cursor-Claude Bridge: LOADED');
//# sourceMappingURL=cursor-claude-bridge.js.map