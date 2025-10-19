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

export class MarcusJava extends EnhancedMarcus {
  name = 'Marcus-Java';
  id = 'marcus-java';
  specialization = 'Java 17+ and Spring Boot 3 Specialist';
  systemPrompt = `You are Marcus-Java, a specialized Java backend expert with deep knowledge of:
- Java 17+ features (records, sealed classes, pattern matching)
- Spring Boot 3 and Spring Framework 6
- Spring Data JPA and Hibernate
- Spring Security for authentication/authorization
- Maven and Gradle build tools
- JUnit 5 and Mockito for testing
- RESTful API design with Spring Web
- Microservices with Spring Cloud`;

  constructor(vectorStore?: EnhancedVectorMemoryStore) {
    super(vectorStore);
  }

  async activate(context: AgentActivationContext): Promise<AgentResponse> {
    const response = await super.activate(context);
    const javaAnalysis = await this.analyzeJavaPatterns(context);

    response.suggestions = response.suggestions || [];
    response.suggestions.push(...javaAnalysis.suggestions);

    if (response.context) {
      response.context.javaAnalysis = javaAnalysis;
    }

    return response;
  }

  private async analyzeJavaPatterns(context: AgentActivationContext) {
    const content = context.content || '';
    const suggestions: Array<{ type: string; message: string; priority: string }> = [];
    let score = 100;

    // Check for SQL injection in JPA queries
    if (this.hasSQLInjectionRisk(content)) {
      score -= 25;
      suggestions.push({
        type: 'security',
        message: 'SQL injection risk detected. Use @Query with named parameters.',
        priority: 'critical'
      });
    }

    // Check for N+1 query problem
    if (this.hasNPlusOnePattern(content)) {
      score -= 20;
      suggestions.push({
        type: 'performance',
        message: 'N+1 query detected. Use @EntityGraph or JOIN FETCH.',
        priority: 'high'
      });
    }

    // Check for missing @Transactional
    if (this.needsTransactional(content) && !content.includes('@Transactional')) {
      score -= 15;
      suggestions.push({
        type: 'data-integrity',
        message: 'Database modifications should be wrapped in @Transactional.',
        priority: 'high'
      });
    }

    // Check for exception handling
    if (!this.hasProperExceptionHandling(content)) {
      score -= 10;
      suggestions.push({
        type: 'error-handling',
        message: 'Missing exception handling. Use @ControllerAdvice for global handling.',
        priority: 'medium'
      });
    }

    // Check for validation annotations
    if (this.isRequestDTO(content) && !content.includes('@Valid')) {
      suggestions.push({
        type: 'validation',
        message: 'Missing validation annotations. Use @Valid and Bean Validation.',
        priority: 'medium'
      });
    }

    // Check for dependency injection
    if (content.includes('new ') && this.isSpringComponent(content)) {
      score -= 10;
      suggestions.push({
        type: 'architecture',
        message: 'Direct instantiation detected. Use dependency injection instead.',
        priority: 'medium'
      });
    }

    // Check for Spring Security
    if (this.isController(content) && !content.includes('@PreAuthorize')) {
      suggestions.push({
        type: 'security',
        message: 'Consider adding authorization checks with @PreAuthorize.',
        priority: 'medium'
      });
    }

    // Check for resource leaks
    if (this.hasResourceLeakRisk(content)) {
      score -= 15;
      suggestions.push({
        type: 'resource-management',
        message: 'Potential resource leak. Use try-with-resources.',
        priority: 'high'
      });
    }

    // Check for Records usage (Java 17+)
    if (this.isDTOClass(content) && !content.includes('record ')) {
      suggestions.push({
        type: 'code-quality',
        message: 'Consider using Java records for immutable DTOs.',
        priority: 'low'
      });
    }

    return {
      score: Math.max(score, 0),
      suggestions,
      component: this.detectSpringComponent(content)
    };
  }

  private hasSQLInjectionRisk(content: string): boolean {
    // Check for string concatenation in @Query
    return content.includes('@Query') && (content.includes('+ "') || content.includes('+ \''));
  }

  private hasNPlusOnePattern(content: string): boolean {
    // Check for lazy loading patterns without fetch strategies
    return (content.includes('@OneToMany') || content.includes('@ManyToOne')) &&
           !content.includes('fetch = FetchType.EAGER') &&
           !content.includes('@EntityGraph');
  }

  private needsTransactional(content: string): boolean {
    return content.includes('.save(') ||
           content.includes('.delete(') ||
           content.includes('.update(');
  }

  private hasProperExceptionHandling(content: string): boolean {
    return content.includes('@ExceptionHandler') ||
           content.includes('@ControllerAdvice') ||
           content.includes('try {');
  }

  private isRequestDTO(content: string): boolean {
    return content.includes('Request') && content.includes('class ');
  }

  private isSpringComponent(content: string): boolean {
    return content.includes('@Component') ||
           content.includes('@Service') ||
           content.includes('@Repository') ||
           content.includes('@Controller');
  }

  private isController(content: string): boolean {
    return content.includes('@RestController') || content.includes('@Controller');
  }

  private hasResourceLeakRisk(content: string): boolean {
    const hasResourceUsage = content.includes('new FileInputStream') ||
                             content.includes('new BufferedReader') ||
                             content.includes('new Connection');
    const hasTryWithResources = content.includes('try (');

    return hasResourceUsage && !hasTryWithResources;
  }

  private isDTOClass(content: string): boolean {
    return (content.includes('DTO') || content.includes('Request') || content.includes('Response')) &&
           content.includes('class ');
  }

  private detectSpringComponent(content: string): string {
    if (content.includes('@RestController')) return 'REST Controller';
    if (content.includes('@Controller')) return 'Controller';
    if (content.includes('@Service')) return 'Service';
    if (content.includes('@Repository')) return 'Repository';
    if (content.includes('@Configuration')) return 'Configuration';
    if (content.includes('@Entity')) return 'Entity';
    return 'Spring Component';
  }

  protected getDefaultRAGConfig() {
    return {
      ...super.getDefaultRAGConfig(),
      agentDomain: 'backend-java',
      maxExamples: 5
    };
  }
}
