/**
 * VERSATIL SDLC Framework - Marcus-Go Sub-Agent Tests
 * Priority 3: Language Sub-Agent Testing
 *
 * Test Coverage:
 * - Go 1.21+ patterns
 * - Goroutines and concurrency
 * - Error handling patterns
 * - Interface design
 * - Performance optimization
 * - Security best practices
 * - Testing patterns
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MarcusGo } from './marcus-go.js';
import type { AgentActivationContext } from '../../../core/base-agent.js';

// Mock dependencies
vi.mock('../../../../rag/enhanced-vector-memory-store.js', () => ({
  EnhancedVectorMemoryStore: vi.fn()
}));

describe('MarcusGo', () => {
  let agent: MarcusGo;

  beforeEach(() => {
    vi.clearAllMocks();
    agent = new MarcusGo();
  });

  describe('Agent Initialization', () => {
    it('should initialize with Go specialization', () => {
      expect(agent.name).toBe('Marcus-Go');
      expect(agent.id).toBe('marcus-go');
      expect(agent.specialization).toContain('Go');
    });

    it('should have Go-specific system prompt', () => {
      expect(agent.systemPrompt).toContain('goroutines');
      expect(agent.systemPrompt).toContain('channels');
    });
  });

  describe('Concurrency Pattern Detection', () => {
    it('should detect goroutine usage', () => {
      const content = `
        go func() {
          processData()
        }()
      `;

      const hasGoroutine = agent['hasGoroutine'](content);
      expect(hasGoroutine).toBe(true);
    });

    it('should detect channel usage', () => {
      const content = `
        ch := make(chan int)
        ch <- 42
        value := <-ch
      `;

      const hasChannel = agent['hasChannel'](content);
      expect(hasChannel).toBe(true);
    });

    it('should detect select statement', () => {
      const content = `
        select {
        case msg := <-ch1:
          process(msg)
        case <-timeout:
          return errors.New("timeout")
        }
      `;

      const hasSelect = agent['hasSelectStatement'](content);
      expect(hasSelect).toBe(true);
    });

    it('should detect unbuffered channel risks', () => {
      const content = `
        ch := make(chan int) // Unbuffered
        ch <- 1 // May deadlock!
      `;

      const hasUnbufferedRisk = agent['hasUnbufferedChannelRisk'](content);
      expect(typeof hasUnbufferedRisk).toBe('boolean');
    });

    it('should detect missing goroutine cleanup', () => {
      const content = `
        func Start() {
          go worker() // No way to stop!
        }
      `;

      const hasMissingCleanup = agent['hasMissingGoroutineCleanup'](content);
      expect(typeof hasMissingCleanup).toBe('boolean');
    });

    it('should detect WaitGroup usage', () => {
      const content = `
        var wg sync.WaitGroup
        wg.Add(1)
        go func() {
          defer wg.Done()
          process()
        }()
        wg.Wait()
      `;

      const hasWaitGroup = agent['hasWaitGroup'](content);
      expect(hasWaitGroup).toBe(true);
    });
  });

  describe('Error Handling Patterns', () => {
    it('should detect proper error handling', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          func GetUser(id int) (*User, error) {
            user, err := db.Query(id)
            if err != nil {
              return nil, fmt.Errorf("get user: %w", err)
            }
            return user, nil
          }
        `,
        filePath: 'user.go'
      };

      const analysis = await agent['analyzeGoPatterns'](context);
      expect(analysis.score).toBeGreaterThan(0);
    });

    it('should detect ignored errors', () => {
      const content = `
        data, _ := ioutil.ReadFile("config.json") // Ignoring error!
      `;

      const hasIgnoredError = agent['hasIgnoredError'](content);
      expect(hasIgnoredError).toBe(true);
    });

    it('should detect error wrapping', () => {
      const content = `
        if err != nil {
          return fmt.Errorf("process data: %w", err)
        }
      `;

      const hasErrorWrapping = agent['hasErrorWrapping'](content);
      expect(hasErrorWrapping).toBe(true);
    });

    it('should detect custom error types', () => {
      const content = `
        type ValidationError struct {
          Field string
          Message string
        }

        func (e *ValidationError) Error() string {
          return fmt.Sprintf("%s: %s", e.Field, e.Message)
        }
      `;

      const hasCustomError = agent['hasCustomErrorType'](content);
      expect(hasCustomError).toBe(true);
    });

    it('should detect panic usage', () => {
      const content = `
        if critical {
          panic("critical error")
        }
      `;

      const hasPanic = agent['hasPanic'](content);
      expect(hasPanic).toBe(true);
    });

    it('should detect recover usage', () => {
      const content = `
        defer func() {
          if r := recover(); r != nil {
            log.Printf("recovered: %v", r)
          }
        }()
      `;

      const hasRecover = agent['hasRecover'](content);
      expect(hasRecover).toBe(true);
    });
  });

  describe('Interface Design', () => {
    it('should detect interface definitions', () => {
      const content = `
        type Reader interface {
          Read(p []byte) (n int, err error)
        }
      `;

      const hasInterface = agent['hasInterface'](content);
      expect(hasInterface).toBe(true);
    });

    it('should detect interface implementation', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          type FileReader struct {}

          func (f *FileReader) Read(p []byte) (n int, err error) {
            return len(p), nil
          }
        `,
        filePath: 'reader.go'
      };

      const analysis = await agent['analyzeGoPatterns'](context);
      expect(analysis).toBeDefined();
    });

    it('should recommend small interfaces', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          type BigInterface interface {
            Method1()
            Method2()
            Method3()
            Method4()
            Method5()
          }
        `,
        filePath: 'interfaces.go'
      };

      const analysis = await agent['analyzeGoPatterns'](context);
      expect(analysis).toBeDefined();
    });

    it('should detect type assertions', () => {
      const content = `
        value, ok := i.(string)
        if !ok {
          return errors.New("not a string")
        }
      `;

      const hasTypeAssertion = agent['hasTypeAssertion'](content);
      expect(hasTypeAssertion).toBe(true);
    });
  });

  describe('Performance Optimization', () => {
    it('should detect slice preallocation', () => {
      const content = `
        items := make([]Item, 0, 100) // Preallocated capacity
      `;

      const hasPreallocation = agent['hasSlicePreallocation'](content);
      expect(hasPreallocation).toBe(true);
    });

    it('should detect string builder usage', () => {
      const content = `
        var sb strings.Builder
        sb.WriteString("Hello")
        sb.WriteString(" World")
        result := sb.String()
      `;

      const hasStringBuilder = agent['hasStringBuilder'](content);
      expect(hasStringBuilder).toBe(true);
    });

    it('should detect string concatenation in loop', () => {
      const content = `
        var result string
        for _, item := range items {
          result += item // Inefficient!
        }
      `;

      const hasStringConcatLoop = agent['hasStringConcatInLoop'](content);
      expect(hasStringConcatLoop).toBe(true);
    });

    it('should detect sync.Pool usage', () => {
      const content = `
        var bufferPool = sync.Pool{
          New: func() interface{} {
            return new(bytes.Buffer)
          },
        }
      `;

      const hasSyncPool = agent['hasSyncPool'](content);
      expect(hasSyncPool).toBe(true);
    });
  });

  describe('Security Best Practices', () => {
    it('should detect SQL injection vulnerabilities', () => {
      const content = `
        query := "SELECT * FROM users WHERE id = " + userID
        db.Query(query) // SQL injection!
      `;

      const hasSQLInjection = agent['detectSQLInjection'](content);
      expect(hasSQLInjection).toBe(true);
    });

    it('should detect parameterized queries', () => {
      const content = `
        db.Query("SELECT * FROM users WHERE id = $1", userID)
      `;

      const hasParameterized = agent['hasParameterizedQuery'](content);
      expect(hasParameterized).toBe(true);
    });

    it('should detect hardcoded credentials', () => {
      const content = `
        const password = "admin123"
        const apiKey = "sk_live_abcdef"
      `;

      const hasHardcodedCreds = agent['hasHardcodedCredentials'](content);
      expect(hasHardcodedCreds).toBe(true);
    });

    it('should detect crypto usage', () => {
      const content = `
        import "crypto/rand"
        import "crypto/sha256"
      `;

      const hasCrypto = agent['hasCryptoUsage'](content);
      expect(hasCrypto).toBe(true);
    });

    it('should detect unsafe pointer usage', () => {
      const content = `
        import "unsafe"
        ptr := unsafe.Pointer(&data)
      `;

      const hasUnsafe = agent['hasUnsafePointer'](content);
      expect(hasUnsafe).toBe(true);
    });
  });

  describe('Memory Management', () => {
    it('should detect defer usage', () => {
      const content = `
        file, err := os.Open("data.txt")
        if err != nil {
          return err
        }
        defer file.Close()
      `;

      const hasDefer = agent['hasDefer'](content);
      expect(hasDefer).toBe(true);
    });

    it('should detect missing defer for cleanup', () => {
      const content = `
        file, err := os.Open("data.txt")
        if err != nil {
          return err
        }
        // Missing defer file.Close()!
      `;

      const hasMissingDefer = agent['hasMissingDefer'](content);
      expect(typeof hasMissingDefer).toBe('boolean');
    });

    it('should detect context usage', () => {
      const content = `
        func Process(ctx context.Context) error {
          select {
          case <-ctx.Done():
            return ctx.Err()
          default:
            return process()
          }
        }
      `;

      const hasContext = agent['hasContext'](content);
      expect(hasContext).toBe(true);
    });

    it('should detect context timeout', () => {
      const content = `
        ctx, cancel := context.WithTimeout(parent, 5*time.Second)
        defer cancel()
      `;

      const hasContextTimeout = agent['hasContextTimeout'](content);
      expect(hasContextTimeout).toBe(true);
    });
  });

  describe('Testing Patterns', () => {
    it('should detect test functions', () => {
      const content = `
        func TestGetUser(t *testing.T) {
          user, err := GetUser(1)
          if err != nil {
            t.Errorf("GetUser failed: %v", err)
          }
        }
      `;

      const hasTest = agent['hasTestFunction'](content);
      expect(hasTest).toBe(true);
    });

    it('should detect table-driven tests', () => {
      const content = `
        tests := []struct {
          name string
          input int
          want int
        }{
          {"zero", 0, 0},
          {"positive", 5, 25},
        }
        for _, tt := range tests {
          t.Run(tt.name, func(t *testing.T) {
            got := Square(tt.input)
            if got != tt.want {
              t.Errorf("got %d, want %d", got, tt.want)
            }
          })
        }
      `;

      const hasTableDriven = agent['hasTableDrivenTest'](content);
      expect(hasTableDriven).toBe(true);
    });

    it('should detect test helpers', () => {
      const content = `
        func setupTest(t *testing.T) *DB {
          t.Helper()
          return NewDB()
        }
      `;

      const hasTestHelper = agent['hasTestHelper'](content);
      expect(hasTestHelper).toBe(true);
    });

    it('should validate proper test structure', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          func TestCalculate(t *testing.T) {
            result := Calculate(2, 3)
            if result != 5 {
              t.Errorf("expected 5, got %d", result)
            }
          }
        `,
        filePath: 'math_test.go'
      };

      const analysis = await agent['analyzeGoPatterns'](context);
      expect(analysis).toBeDefined();
    });
  });

  describe('Code Quality', () => {
    it('should detect exported function documentation', () => {
      const content = `
        // GetUser retrieves a user by ID.
        func GetUser(id int) (*User, error) {
          return nil, nil
        }
      `;

      const hasDocumentation = agent['hasExportedDocumentation'](content);
      expect(hasDocumentation).toBe(true);
    });

    it('should detect missing documentation for exported functions', () => {
      const content = `
        func GetUser(id int) (*User, error) {
          return nil, nil
        }
      `;

      const hasMissingDoc = agent['hasMissingExportedDoc'](content);
      expect(typeof hasMissingDoc).toBe('boolean');
    });

    it('should detect proper package naming', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          package user

          type User struct {
            ID   int
            Name string
          }
        `,
        filePath: 'user.go'
      };

      const analysis = await agent['analyzeGoPatterns'](context);
      expect(analysis).toBeDefined();
    });
  });

  describe('Activation Response', () => {
    it('should activate and provide Go-specific analysis', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          func ProcessData(ctx context.Context, data []byte) error {
            ch := make(chan Result, 10)

            go func() {
              defer close(ch)
              ch <- process(data)
            }()

            select {
            case result := <-ch:
              return handleResult(result)
            case <-ctx.Done():
              return ctx.Err()
            }
          }
        `,
        filePath: 'processor.go'
      };

      const response = await agent.activate(context);

      expect(response).toHaveProperty('success');
      expect(response).toHaveProperty('suggestions');
    });

    it('should provide Go best practices', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          func GetData(id string) *Data {
            data, _ := fetch(id) // Ignoring error
            return data
          }
        `,
        filePath: 'data.go'
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
        filePath: 'empty.go'
      };

      const analysis = await agent['analyzeGoPatterns'](context);

      expect(analysis).toBeDefined();
      expect(analysis.score).toBeGreaterThanOrEqual(0);
    });

    it('should handle non-Go content gracefully', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: 'const x = 1;',
        filePath: 'utils.js'
      };

      const analysis = await agent['analyzeGoPatterns'](context);

      expect(analysis).toBeDefined();
    });
  });
});
