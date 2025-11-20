/**
 * Marcus-Java: Java/Spring Boot Specialist
 *
 * Language-specific sub-agent for Java 17+ and Spring Boot 3 development.
 * Specializes in Spring Data JPA, Spring Security, and Maven/Gradle.
 *
 * Auto-activates on: pom.xml, build.gradle, .java files
 *
 * @module marcus-java
 * @version 6.6.0
 * @parent marcus-backend
 */
import { EnhancedMarcus } from '../enhanced-marcus.js';
import { AgentActivationContext, AgentResponse } from '../../../core/base-agent.js';
import { EnhancedVectorMemoryStore } from '../../../../rag/enhanced-vector-memory-store.js';
export declare class MarcusJava extends EnhancedMarcus {
    name: string;
    id: string;
    specialization: string;
    systemPrompt: string;
    constructor(vectorStore?: EnhancedVectorMemoryStore);
    activate(context: AgentActivationContext): Promise<AgentResponse>;
    analyzeJavaPatterns(context: AgentActivationContext): Promise<{
        score: number;
        suggestions: {
            type: string;
            message: string;
            priority: string;
        }[];
        component: string;
    }>;
    private hasSQLInjectionRisk;
    private hasNPlusOnePattern;
    private needsTransactional;
    private hasProperExceptionHandling;
    private isRequestDTO;
    private isSpringComponent;
    private isController;
    private hasResourceLeakRisk;
    private isDTOClass;
    private detectSpringComponent;
    protected getDefaultRAGConfig(): {
        agentDomain: string;
        maxExamples: number;
        similarityThreshold: number;
        enableLearning: boolean;
    };
    hasRestController(content: string): boolean;
    hasService(content: string): boolean;
    hasRepository(content: string): boolean;
    hasAutowired(content: string): boolean;
    hasEntity(content: string): boolean;
    hasNPlusOne(content: string): boolean;
    hasEntityGraph(content: string): boolean;
    detectSQLInjection(content: string): boolean;
    hasParameterizedQuery(content: string): boolean;
    hasPreAuthorize(content: string): boolean;
    hasMissingAuth(content: string): boolean;
    hasPasswordEncoder(content: string): boolean;
    hasHardcodedSecrets(content: string): boolean;
    hasControllerAdvice(content: string): boolean;
    hasCustomException(content: string): boolean;
    hasEmptyCatch(content: string): boolean;
    hasRecord(content: string): boolean;
    hasSealed(content: string): boolean;
    hasPatternMatching(content: string): boolean;
    hasTextBlock(content: string): boolean;
    hasSwitchExpression(content: string): boolean;
    hasStreamAPI(content: string): boolean;
    hasCacheable(content: string): boolean;
    hasPagination(content: string): boolean;
    hasMissingPagination(content: string): boolean;
    hasValidation(content: string): boolean;
    hasResponseEntity(content: string): boolean;
    hasSpringBootTest(content: string): boolean;
    hasWebMvcTest(content: string): boolean;
    hasMockBean(content: string): boolean;
    hasTest(content: string): boolean;
    hasParameterizedTest(content: string): boolean;
    hasJavadoc(content: string): boolean;
    hasOptional(content: string): boolean;
}
