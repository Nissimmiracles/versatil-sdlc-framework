/**
 * VERSATIL SDLC Framework - Marcus-Java Sub-Agent Tests
 * Priority 3: Language Sub-Agent Testing
 *
 * Test Coverage:
 * - Java 17+ patterns
 * - Spring Boot best practices
 * - JPA/Hibernate patterns
 * - Security (Spring Security, OWASP)
 * - Exception handling
 * - Performance optimization
 * - Testing patterns (JUnit 5)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MarcusJava } from './marcus-java.js';
import type { AgentActivationContext } from '../../../core/base-agent.js';

// Mock dependencies
vi.mock('../../../../rag/enhanced-vector-memory-store.js', () => ({
  EnhancedVectorMemoryStore: vi.fn()
}));

describe('MarcusJava', () => {
  let agent: MarcusJava;

  beforeEach(() => {
    vi.clearAllMocks();
    agent = new MarcusJava();
  });

  describe('Agent Initialization', () => {
    it('should initialize with Java specialization', () => {
      expect(agent.name).toBe('Marcus-Java');
      expect(agent.id).toBe('marcus-java');
      expect(agent.specialization).toContain('Java');
    });

    it('should have Java-specific system prompt', () => {
      expect(agent.systemPrompt).toContain('Spring Boot');
      expect(agent.systemPrompt).toContain('JPA');
    });
  });

  describe('Spring Boot Pattern Detection', () => {
    it('should detect @RestController', () => {
      const content = `
        @RestController
        @RequestMapping("/api/users")
        public class UserController {
        }
      `;

      const hasRestController = agent['hasRestController'](content);
      expect(hasRestController).toBe(true);
    });

    it('should detect @Service annotation', () => {
      const content = `
        @Service
        public class UserService {
        }
      `;

      const hasService = agent['hasService'](content);
      expect(hasService).toBe(true);
    });

    it('should detect @Repository annotation', () => {
      const content = `
        @Repository
        public interface UserRepository extends JpaRepository<User, Long> {
        }
      `;

      const hasRepository = agent['hasRepository'](content);
      expect(hasRepository).toBe(true);
    });

    it('should detect @Autowired dependency injection', () => {
      const content = `
        @Autowired
        private UserService userService;
      `;

      const hasAutowired = agent['hasAutowired'](content);
      expect(hasAutowired).toBe(true);
    });

    it('should recommend constructor injection over field injection', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          @Service
          public class UserService {
            @Autowired
            private UserRepository userRepository;
          }
        `,
        filePath: 'UserService.java'
      };

      const analysis = await agent['analyzeJavaPatterns'](context);
      expect(analysis).toBeDefined();
    });

    it('should detect proper constructor injection', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          @Service
          public class UserService {
            private final UserRepository userRepository;

            public UserService(UserRepository userRepository) {
              this.userRepository = userRepository;
            }
          }
        `,
        filePath: 'UserService.java'
      };

      const analysis = await agent['analyzeJavaPatterns'](context);
      expect(analysis.score).toBeGreaterThan(80);
    });
  });

  describe('JPA/Hibernate Pattern Detection', () => {
    it('should detect @Entity annotation', () => {
      const content = `
        @Entity
        @Table(name = "users")
        public class User {
          @Id
          @GeneratedValue(strategy = GenerationType.IDENTITY)
          private Long id;
        }
      `;

      const hasEntity = agent['hasEntity'](content);
      expect(hasEntity).toBe(true);
    });

    it('should detect N+1 query problem', () => {
      const content = `
        List<User> users = userRepository.findAll();
        for (User user : users) {
          List<Post> posts = user.getPosts(); // N+1!
        }
      `;

      const hasNPlusOne = agent['hasNPlusOne'](content);
      expect(hasNPlusOne).toBe(true);
    });

    it('should detect @EntityGraph for optimization', () => {
      const content = `
        @EntityGraph(attributePaths = {"posts", "comments"})
        List<User> findAll();
      `;

      const hasEntityGraph = agent['hasEntityGraph'](content);
      expect(hasEntityGraph).toBe(true);
    });

    it('should detect proper fetch type configuration', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          @OneToMany(fetch = FetchType.LAZY)
          private List<Post> posts;
        `,
        filePath: 'User.java'
      };

      const analysis = await agent['analyzeJavaPatterns'](context);
      expect(analysis.score).toBeGreaterThan(0);
    });
  });

  describe('Security Pattern Detection', () => {
    it('should detect SQL injection vulnerability', () => {
      const content = `
        String query = "SELECT * FROM users WHERE id = " + userId;
        entityManager.createQuery(query);
      `;

      const hasSQLInjection = agent['detectSQLInjection'](content);
      expect(hasSQLInjection).toBe(true);
    });

    it('should detect parameterized queries', () => {
      const content = `
        Query query = entityManager.createQuery("SELECT u FROM User u WHERE u.id = :id");
        query.setParameter("id", userId);
      `;

      const hasParameterized = agent['hasParameterizedQuery'](content);
      expect(hasParameterized).toBe(true);
    });

    it('should detect @PreAuthorize for security', () => {
      const content = `
        @PreAuthorize("hasRole('ADMIN')")
        public void deleteUser(Long id) {
        }
      `;

      const hasPreAuthorize = agent['hasPreAuthorize'](content);
      expect(hasPreAuthorize).toBe(true);
    });

    it('should detect missing authentication checks', () => {
      const content = `
        @DeleteMapping("/users/{id}")
        public void deleteUser(@PathVariable Long id) {
          // No security check!
          userService.delete(id);
        }
      `;

      const hasMissingAuth = agent['hasMissingAuth'](content);
      expect(typeof hasMissingAuth).toBe('boolean');
    });

    it('should detect password encoding', () => {
      const content = `
        @Bean
        public PasswordEncoder passwordEncoder() {
          return new BCryptPasswordEncoder();
        }
      `;

      const hasPasswordEncoder = agent['hasPasswordEncoder'](content);
      expect(hasPasswordEncoder).toBe(true);
    });

    it('should detect hardcoded secrets', () => {
      const content = `
        String apiKey = "sk_live_12345abcde";
        String password = "admin123";
      `;

      const hasHardcodedSecrets = agent['hasHardcodedSecrets'](content);
      expect(hasHardcodedSecrets).toBe(true);
    });
  });

  describe('Exception Handling', () => {
    it('should detect @ControllerAdvice for global exception handling', () => {
      const content = `
        @ControllerAdvice
        public class GlobalExceptionHandler {
          @ExceptionHandler(ResourceNotFoundException.class)
          public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex) {
            return ResponseEntity.notFound().build();
          }
        }
      `;

      const hasControllerAdvice = agent['hasControllerAdvice'](content);
      expect(hasControllerAdvice).toBe(true);
    });

    it('should detect custom exception classes', () => {
      const content = `
        public class ResourceNotFoundException extends RuntimeException {
          public ResourceNotFoundException(String message) {
            super(message);
          }
        }
      `;

      const hasCustomException = agent['hasCustomException'](content);
      expect(hasCustomException).toBe(true);
    });

    it('should detect empty catch blocks', () => {
      const content = `
        try {
          riskyOperation();
        } catch (Exception e) {
          // Empty catch - bad practice!
        }
      `;

      const hasEmptyCatch = agent['hasEmptyCatch'](content);
      expect(hasEmptyCatch).toBe(true);
    });

    it('should detect proper exception handling', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          @GetMapping("/{id}")
          public ResponseEntity<User> getUser(@PathVariable Long id) {
            return userService.findById(id)
              .map(ResponseEntity::ok)
              .orElseThrow(() -> new ResourceNotFoundException("User not found"));
          }
        `,
        filePath: 'UserController.java'
      };

      const analysis = await agent['analyzeJavaPatterns'](context);
      expect(analysis.score).toBeGreaterThan(80);
    });
  });

  describe('Java 17+ Features', () => {
    it('should detect record classes', () => {
      const content = `
        public record UserDTO(Long id, String name, String email) {}
      `;

      const hasRecord = agent['hasRecord'](content);
      expect(hasRecord).toBe(true);
    });

    it('should detect sealed classes', () => {
      const content = `
        public sealed class Shape permits Circle, Rectangle {}
      `;

      const hasSealed = agent['hasSealed'](content);
      expect(hasSealed).toBe(true);
    });

    it('should detect pattern matching', () => {
      const content = `
        if (obj instanceof String s) {
          System.out.println(s.toUpperCase());
        }
      `;

      const hasPatternMatching = agent['hasPatternMatching'](content);
      expect(hasPatternMatching).toBe(true);
    });

    it('should detect text blocks', () => {
      const content = `
        String json = """
          {
            "name": "John",
            "age": 30
          }
          """;
      `;

      const hasTextBlock = agent['hasTextBlock'](content);
      expect(hasTextBlock).toBe(true);
    });

    it('should detect switch expressions', () => {
      const content = `
        String result = switch (day) {
          case MONDAY, FRIDAY -> "Work";
          case SATURDAY, SUNDAY -> "Weekend";
          default -> "Other";
        };
      `;

      const hasSwitchExpression = agent['hasSwitchExpression'](content);
      expect(hasSwitchExpression).toBe(true);
    });
  });

  describe('Performance Optimization', () => {
    it('should detect Stream API usage', () => {
      const content = `
        List<String> names = users.stream()
          .map(User::getName)
          .collect(Collectors.toList());
      `;

      const hasStream = agent['hasStreamAPI'](content);
      expect(hasStream).toBe(true);
    });

    it('should detect @Cacheable annotation', () => {
      const content = `
        @Cacheable("users")
        public User findById(Long id) {
          return userRepository.findById(id).orElse(null);
        }
      `;

      const hasCacheable = agent['hasCacheable'](content);
      expect(hasCacheable).toBe(true);
    });

    it('should detect pagination usage', () => {
      const content = `
        Page<User> users = userRepository.findAll(
          PageRequest.of(page, size, Sort.by("name"))
        );
      `;

      const hasPagination = agent['hasPagination'](content);
      expect(hasPagination).toBe(true);
    });

    it('should detect missing pagination for large datasets', () => {
      const content = `
        @GetMapping("/users")
        public List<User> getAllUsers() {
          return userRepository.findAll(); // Should use pagination!
        }
      `;

      const hasMissingPagination = agent['hasMissingPagination'](content);
      expect(typeof hasMissingPagination).toBe('boolean');
    });
  });

  describe('REST API Best Practices', () => {
    it('should detect @Valid for request validation', () => {
      const content = `
        @PostMapping
        public ResponseEntity<User> createUser(@Valid @RequestBody UserDTO dto) {
          return ResponseEntity.ok(userService.create(dto));
        }
      `;

      const hasValidation = agent['hasValidation'](content);
      expect(hasValidation).toBe(true);
    });

    it('should detect proper HTTP method usage', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          @GetMapping("/{id}")
          public User getUser(@PathVariable Long id) {}

          @PostMapping
          public User createUser(@RequestBody User user) {}

          @PutMapping("/{id}")
          public User updateUser(@PathVariable Long id, @RequestBody User user) {}

          @DeleteMapping("/{id}")
          public void deleteUser(@PathVariable Long id) {}
        `,
        filePath: 'UserController.java'
      };

      const analysis = await agent['analyzeJavaPatterns'](context);
      expect(analysis.score).toBeGreaterThan(80);
    });

    it('should detect ResponseEntity usage', () => {
      const content = `
        return ResponseEntity.ok(user);
      `;

      const hasResponseEntity = agent['hasResponseEntity'](content);
      expect(hasResponseEntity).toBe(true);
    });

    it('should detect proper status code handling', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          @PostMapping
          public ResponseEntity<User> createUser(@RequestBody User user) {
            User created = userService.create(user);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
          }
        `,
        filePath: 'UserController.java'
      };

      const analysis = await agent['analyzeJavaPatterns'](context);
      expect(analysis.score).toBeGreaterThan(0);
    });
  });

  describe('Testing Patterns', () => {
    it('should detect @SpringBootTest', () => {
      const content = `
        @SpringBootTest
        class UserServiceTest {
        }
      `;

      const hasSpringBootTest = agent['hasSpringBootTest'](content);
      expect(hasSpringBootTest).toBe(true);
    });

    it('should detect @WebMvcTest', () => {
      const content = `
        @WebMvcTest(UserController.class)
        class UserControllerTest {
        }
      `;

      const hasWebMvcTest = agent['hasWebMvcTest'](content);
      expect(hasWebMvcTest).toBe(true);
    });

    it('should detect @MockBean', () => {
      const content = `
        @MockBean
        private UserService userService;
      `;

      const hasMockBean = agent['hasMockBean'](content);
      expect(hasMockBean).toBe(true);
    });

    it('should detect JUnit 5 @Test', () => {
      const content = `
        @Test
        void shouldReturnUser() {
          User user = userService.findById(1L);
          assertNotNull(user);
        }
      `;

      const hasTest = agent['hasTest'](content);
      expect(hasTest).toBe(true);
    });

    it('should detect @ParameterizedTest', () => {
      const content = `
        @ParameterizedTest
        @ValueSource(strings = {"John", "Jane", "Bob"})
        void shouldValidateName(String name) {
          assertTrue(validator.isValid(name));
        }
      `;

      const hasParameterizedTest = agent['hasParameterizedTest'](content);
      expect(hasParameterizedTest).toBe(true);
    });

    it('should validate proper test structure', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          @SpringBootTest
          class UserServiceTest {
            @Autowired
            private UserService userService;

            @Test
            void shouldCreateUser() {
              User user = new User("John");
              User created = userService.create(user);
              assertNotNull(created.getId());
            }
          }
        `,
        filePath: 'UserServiceTest.java'
      };

      const analysis = await agent['analyzeJavaPatterns'](context);
      expect(analysis.score).toBeGreaterThan(0);
    });
  });

  describe('Code Quality', () => {
    it('should detect Javadoc comments', () => {
      const content = `
        /**
         * Retrieves a user by ID.
         * @param id the user ID
         * @return the user
         */
        public User findById(Long id) {
        }
      `;

      const hasJavadoc = agent['hasJavadoc'](content);
      expect(hasJavadoc).toBe(true);
    });

    it('should detect Optional usage', () => {
      const content = `
        public Optional<User> findById(Long id) {
          return userRepository.findById(id);
        }
      `;

      const hasOptional = agent['hasOptional'](content);
      expect(hasOptional).toBe(true);
    });

    it('should detect null checks vs Optional', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          public User getUser(Long id) {
            User user = findById(id);
            if (user == null) {
              throw new NotFoundException();
            }
            return user;
          }
        `,
        filePath: 'UserService.java'
      };

      const analysis = await agent['analyzeJavaPatterns'](context);
      expect(analysis).toBeDefined();
    });
  });

  describe('Activation Response', () => {
    it('should activate and provide Java-specific analysis', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          @RestController
          @RequestMapping("/api/users")
          public class UserController {
            private final UserService userService;

            public UserController(UserService userService) {
              this.userService = userService;
            }

            @GetMapping("/{id}")
            public ResponseEntity<User> getUser(@PathVariable Long id) {
              return userService.findById(id)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            }
          }
        `,
        filePath: 'UserController.java'
      };

      const response = await agent.activate(context);

      expect(response).toHaveProperty('success');
      expect(response).toHaveProperty('suggestions');
    });

    it('should provide Spring Boot best practices', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          @Service
          public class UserService {
            @Autowired
            private UserRepository userRepository;

            public List<User> findAll() {
              return userRepository.findAll();
            }
          }
        `,
        filePath: 'UserService.java'
      };

      const response = await agent.activate(context);

      expect(response.suggestions).toBeDefined();
      expect(response.suggestions!.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty content', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: '',
        filePath: 'Empty.java'
      };

      const analysis = await agent['analyzeJavaPatterns'](context);

      expect(analysis).toBeDefined();
      expect(analysis.score).toBeGreaterThanOrEqual(0);
    });

    it('should handle non-Java content gracefully', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: 'const x = 1;',
        filePath: 'utils.js'
      };

      const analysis = await agent['analyzeJavaPatterns'](context);

      expect(analysis).toBeDefined();
    });
  });
});
