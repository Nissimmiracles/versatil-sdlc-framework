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
    private analyzeJavaPatterns;
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
}
