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
export class MarcusJava extends EnhancedMarcus {
    constructor(vectorStore) {
        super(vectorStore);
        this.name = 'Marcus-Java';
        this.id = 'marcus-java';
        this.specialization = 'Java 17+ and Spring Boot 3 Specialist';
        this.systemPrompt = `You are Marcus-Java, a specialized Java backend expert with deep knowledge of:
- Java 17+ features (records, sealed classes, pattern matching)
- Spring Boot 3 and Spring Framework 6
- Spring Data JPA and Hibernate
- Spring Security for authentication/authorization
- Maven and Gradle build tools
- JUnit 5 and Mockito for testing
- RESTful API design with Spring Web
- Microservices with Spring Cloud`;
    }
    async activate(context) {
        const response = await super.activate(context);
        const javaAnalysis = await this.analyzeJavaPatterns(context);
        response.suggestions = response.suggestions || [];
        response.suggestions.push(...javaAnalysis.suggestions);
        if (response.context) {
            response.context.javaAnalysis = javaAnalysis;
        }
        return response;
    }
    async analyzeJavaPatterns(context) {
        const content = context.content || '';
        const suggestions = [];
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
    hasSQLInjectionRisk(content) {
        // Check for string concatenation in @Query
        return content.includes('@Query') && (content.includes('+ "') || content.includes('+ \''));
    }
    hasNPlusOnePattern(content) {
        // Check for lazy loading patterns without fetch strategies
        return (content.includes('@OneToMany') || content.includes('@ManyToOne')) &&
            !content.includes('fetch = FetchType.EAGER') &&
            !content.includes('@EntityGraph');
    }
    needsTransactional(content) {
        return content.includes('.save(') ||
            content.includes('.delete(') ||
            content.includes('.update(');
    }
    hasProperExceptionHandling(content) {
        return content.includes('@ExceptionHandler') ||
            content.includes('@ControllerAdvice') ||
            content.includes('try {');
    }
    isRequestDTO(content) {
        return content.includes('Request') && content.includes('class ');
    }
    isSpringComponent(content) {
        return content.includes('@Component') ||
            content.includes('@Service') ||
            content.includes('@Repository') ||
            content.includes('@Controller');
    }
    isController(content) {
        return content.includes('@RestController') || content.includes('@Controller');
    }
    hasResourceLeakRisk(content) {
        const hasResourceUsage = content.includes('new FileInputStream') ||
            content.includes('new BufferedReader') ||
            content.includes('new Connection');
        const hasTryWithResources = content.includes('try (');
        return hasResourceUsage && !hasTryWithResources;
    }
    isDTOClass(content) {
        return (content.includes('DTO') || content.includes('Request') || content.includes('Response')) &&
            content.includes('class ');
    }
    detectSpringComponent(content) {
        if (content.includes('@RestController'))
            return 'REST Controller';
        if (content.includes('@Controller'))
            return 'Controller';
        if (content.includes('@Service'))
            return 'Service';
        if (content.includes('@Repository'))
            return 'Repository';
        if (content.includes('@Configuration'))
            return 'Configuration';
        if (content.includes('@Entity'))
            return 'Entity';
        return 'Spring Component';
    }
    getDefaultRAGConfig() {
        return {
            ...super.getDefaultRAGConfig(),
            agentDomain: 'backend-java',
            maxExamples: 5
        };
    }
    // Spring Boot Pattern Detection Methods
    hasRestController(content) {
        return content.includes('@RestController');
    }
    hasService(content) {
        return content.includes('@Service');
    }
    hasRepository(content) {
        return content.includes('@Repository');
    }
    hasAutowired(content) {
        return content.includes('@Autowired');
    }
    // JPA/Hibernate Methods
    hasEntity(content) {
        return content.includes('@Entity');
    }
    hasNPlusOne(content) {
        return this.hasNPlusOnePattern(content);
    }
    hasEntityGraph(content) {
        return content.includes('@EntityGraph');
    }
    // Security Methods
    detectSQLInjection(content) {
        return this.hasSQLInjectionRisk(content);
    }
    hasParameterizedQuery(content) {
        return /setParameter\s*\(/.test(content) || /:[\w]+/.test(content);
    }
    hasPreAuthorize(content) {
        return content.includes('@PreAuthorize');
    }
    hasMissingAuth(content) {
        const isDeleteMapping = /@DeleteMapping/.test(content) || /@PutMapping/.test(content);
        const hasAuth = content.includes('@PreAuthorize') || content.includes('@Secured');
        return isDeleteMapping && !hasAuth;
    }
    hasPasswordEncoder(content) {
        return /PasswordEncoder|BCryptPasswordEncoder/.test(content);
    }
    hasHardcodedSecrets(content) {
        const patterns = [
            /["']sk_live_[\w]+["']/,
            /["']api[_-]?key["']\s*[:=]\s*["'][\w]+["']/i,
            /password\s*=\s*["'][\w]+["']/i
        ];
        return patterns.some(pattern => pattern.test(content));
    }
    // Exception Handling Methods
    hasControllerAdvice(content) {
        return content.includes('@ControllerAdvice');
    }
    hasCustomException(content) {
        return /class\s+\w+Exception\s+extends/.test(content);
    }
    hasEmptyCatch(content) {
        return /catch\s*\([^)]+\)\s*\{\s*\}/.test(content) || /catch\s*\([^)]+\)\s*\{\s*\/\//.test(content);
    }
    // Java 17+ Feature Methods
    hasRecord(content) {
        return /public\s+record\s+\w+/.test(content);
    }
    hasSealed(content) {
        return /sealed\s+class/.test(content) || /sealed\s+interface/.test(content);
    }
    hasPatternMatching(content) {
        return /instanceof\s+\w+\s+\w+/.test(content);
    }
    hasTextBlock(content) {
        return /"""\s*\n/.test(content);
    }
    hasSwitchExpression(content) {
        return /=\s*switch\s*\(/.test(content) || /switch.*->/.test(content);
    }
    // Performance Methods
    hasStreamAPI(content) {
        return /\.stream\(\)/.test(content);
    }
    hasCacheable(content) {
        return content.includes('@Cacheable');
    }
    hasPagination(content) {
        return /Pageable|PageRequest/.test(content);
    }
    hasMissingPagination(content) {
        const isGetAllEndpoint = /@GetMapping.*findAll/.test(content) || /\.findAll\(\)/.test(content);
        const hasPaging = this.hasPagination(content);
        return isGetAllEndpoint && !hasPaging;
    }
    // REST API Methods
    hasValidation(content) {
        return content.includes('@Valid');
    }
    hasResponseEntity(content) {
        return content.includes('ResponseEntity');
    }
    // Testing Methods
    hasSpringBootTest(content) {
        return content.includes('@SpringBootTest');
    }
    hasWebMvcTest(content) {
        return content.includes('@WebMvcTest');
    }
    hasMockBean(content) {
        return content.includes('@MockBean');
    }
    hasTest(content) {
        return content.includes('@Test');
    }
    hasParameterizedTest(content) {
        return content.includes('@ParameterizedTest');
    }
    // Code Quality Methods
    hasJavadoc(content) {
        return /\/\*\*[\s\S]*?\*\//.test(content);
    }
    hasOptional(content) {
        return /Optional</.test(content);
    }
}
//# sourceMappingURL=marcus-java.js.map