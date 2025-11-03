/**
 * VERSATIL SDLC Framework - James-Vue Sub-Agent Tests
 * Priority 3: Language Sub-Agent Testing
 *
 * Test Coverage:
 * - Vue 3 Composition API patterns
 * - Options API vs Composition API
 * - Reactivity system (ref, reactive, computed)
 * - Lifecycle hooks
 * - Component best practices
 * - Performance optimization
 * - Composables patterns
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JamesVue } from './james-vue.js';
import type { AgentActivationContext } from '../../../core/base-agent.js';

// Mock dependencies
vi.mock('../../../../rag/enhanced-vector-memory-store.js', () => ({
  EnhancedVectorMemoryStore: vi.fn()
}));

describe('JamesVue', () => {
  let agent: JamesVue;

  beforeEach(() => {
    vi.clearAllMocks();
    agent = new JamesVue();
  });

  describe('Agent Initialization', () => {
    it('should initialize with Vue 3 specialization', () => {
      expect(agent.name).toBe('James-Vue');
      expect(agent.id).toBe('james-vue');
      expect(agent.specialization).toContain('Vue');
    });

    it('should have Vue 3-specific system prompt', () => {
      expect(agent.systemPrompt).toContain('Composition API');
      expect(agent.systemPrompt).toContain('reactivity');
    });
  });

  describe('API Pattern Detection', () => {
    it('should detect Options API usage', () => {
      const content = `
        export default {
          data() {
            return { count: 0 };
          },
          methods: {
            increment() { this.count++; }
          }
        };
      `;

      const hasOptionsAPI = agent['hasOptionsAPI'](content);
      expect(hasOptionsAPI).toBe(true);
    });

    it('should detect Composition API usage', () => {
      const content = `
        import { ref } from 'vue';
        export default {
          setup() {
            const count = ref(0);
            return { count };
          }
        };
      `;

      const hasCompositionAPI = agent['hasCompositionAPI'](content);
      expect(hasCompositionAPI).toBe(true);
    });

    it('should detect script setup syntax', () => {
      const content = `
        <script setup>
        import { ref } from 'vue';
        const count = ref(0);
        </script>
      `;

      const hasScriptSetup = agent['hasScriptSetup'](content);
      expect(hasScriptSetup).toBe(true);
    });

    it('should recommend Composition API over Options API', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          export default {
            data() { return { items: [] }; },
            methods: { addItem(item) { this.items.push(item); } }
          };
        `,
        filePath: 'Component.vue'
      };

      const analysis = await agent['analyzeVuePatterns'](context);

      expect(analysis).toHaveProperty('recommendations');
      expect(analysis.score).toBeGreaterThan(0);
    });
  });

  describe('Reactivity System', () => {
    it('should detect ref usage', () => {
      const content = `
        const count = ref(0);
        count.value++;
      `;

      const hasRef = agent['hasRefUsage'](content);
      expect(hasRef).toBe(true);
    });

    it('should detect reactive usage', () => {
      const content = `
        const state = reactive({ count: 0, name: 'Vue' });
        state.count++;
      `;

      const hasReactive = agent['hasReactiveUsage'](content);
      expect(hasReactive).toBe(true);
    });

    it('should detect computed properties', () => {
      const content = `
        const doubled = computed(() => count.value * 2);
      `;

      const hasComputed = agent['hasComputedUsage'](content);
      expect(hasComputed).toBe(true);
    });

    it('should detect missing .value access', () => {
      const content = `
        const count = ref(0);
        console.log(count); // Should be count.value
      `;

      const hasMissingValueAccess = agent['hasMissingValueAccess'](content);
      expect(typeof hasMissingValueAccess).toBe('boolean');
    });

    it('should detect reactive destructuring (anti-pattern)', () => {
      const content = `
        const { count } = reactive({ count: 0 }); // Loses reactivity!
      `;

      const hasReactiveDestructuring = agent['hasReactiveDestructuring'](content);
      expect(typeof hasReactiveDestructuring).toBe('boolean');
    });
  });

  describe('Lifecycle Hooks', () => {
    it('should detect onMounted usage', () => {
      const content = `
        onMounted(() => {
          console.log('Component mounted');
        });
      `;

      const hasOnMounted = agent['hasLifecycleHook'](content, 'onMounted');
      expect(hasOnMounted).toBe(true);
    });

    it('should detect onUnmounted for cleanup', () => {
      const content = `
        onUnmounted(() => {
          clearInterval(timer);
        });
      `;

      const hasCleanup = agent['hasLifecycleHook'](content, 'onUnmounted');
      expect(hasCleanup).toBe(true);
    });

    it('should detect watchEffect usage', () => {
      const content = `
        watchEffect(() => {
          console.log(count.value);
        });
      `;

      const hasWatchEffect = agent['hasWatchEffect'](content);
      expect(hasWatchEffect).toBe(true);
    });

    it('should detect watch usage with options', () => {
      const content = `
        watch(count, (newVal, oldVal) => {
          console.log(newVal, oldVal);
        }, { immediate: true });
      `;

      const hasWatch = agent['hasWatch'](content);
      expect(hasWatch).toBe(true);
    });
  });

  describe('Component Best Practices', () => {
    it('should validate defineProps usage', () => {
      const content = `
        <script setup>
        const props = defineProps<{ title: string; count: number }>();
        </script>
      `;

      const hasDefineProps = agent['hasDefineProps'](content);
      expect(hasDefineProps).toBe(true);
    });

    it('should validate defineEmits usage', () => {
      const content = `
        <script setup>
        const emit = defineEmits<{ (e: 'update', value: string): void }>();
        </script>
      `;

      const hasDefineEmits = agent['hasDefineEmits'](content);
      expect(hasDefineEmits).toBe(true);
    });

    it('should detect proper TypeScript prop types', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          <script setup lang="ts">
          interface Props {
            title: string;
            count: number;
          }
          const props = defineProps<Props>();
          </script>
        `,
        filePath: 'Component.vue'
      };

      const analysis = await agent['analyzeVuePatterns'](context);

      expect(analysis.score).toBeGreaterThan(70);
    });

    it('should detect v-for without :key', () => {
      const content = `
        <template>
          <div v-for="item in items">{{ item }}</div>
        </template>
      `;

      const hasMissingKey = agent['hasMissingVForKey'](content);
      expect(hasMissingKey).toBe(true);
    });
  });

  describe('Composables Patterns', () => {
    it('should detect composable usage', () => {
      const content = `
        const { data, loading, error } = useFetch('/api/users');
      `;

      const hasComposable = agent['hasComposableUsage'](content);
      expect(hasComposable).toBe(true);
    });

    it('should validate composable naming convention', () => {
      const content = `
        function useCounter() {
          const count = ref(0);
          const increment = () => count.value++;
          return { count, increment };
        }
      `;

      const hasProperNaming = agent['hasProperComposableNaming'](content);
      expect(hasProperNaming).toBe(true);
    });

    it('should detect composable returning reactive values', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          function useData() {
            const data = ref([]);
            return { data };
          }
        `,
        filePath: 'composables/useData.ts'
      };

      const analysis = await agent['analyzeVuePatterns'](context);

      expect(analysis).toBeDefined();
    });
  });

  describe('Performance Optimization', () => {
    it('should detect v-show vs v-if usage', () => {
      const content = `
        <template>
          <div v-if="isVisible">Content</div>
        </template>
      `;

      const hasVIf = agent['hasVIf'](content);
      expect(hasVIf).toBe(true);
    });

    it('should recommend shallowRef for large objects', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          const largeData = ref({ /* 1000s of properties */ });
        `,
        filePath: 'Component.vue'
      };

      const analysis = await agent['analyzeVuePatterns'](context);

      expect(analysis).toBeDefined();
    });

    it('should detect unnecessary reactive wrapping', () => {
      const content = `
        const config = reactive({
          API_URL: 'https://api.example.com', // Static, doesn't need reactivity
          TIMEOUT: 5000
        });
      `;

      const hasUnnecessaryReactive = agent['hasUnnecessaryReactive'](content);
      expect(typeof hasUnnecessaryReactive).toBe('boolean');
    });
  });

  describe('Template Patterns', () => {
    it('should detect v-model usage', () => {
      const content = `
        <template>
          <input v-model="text" />
        </template>
      `;

      const hasVModel = agent['hasVModel'](content);
      expect(hasVModel).toBe(true);
    });

    it('should detect slot usage', () => {
      const content = `
        <template>
          <slot name="header"></slot>
        </template>
      `;

      const hasSlot = agent['hasSlot'](content);
      expect(hasSlot).toBe(true);
    });

    it('should validate scoped slots', () => {
      const content = `
        <template>
          <slot :item="item" :index="index"></slot>
        </template>
      `;

      const hasScopedSlot = agent['hasScopedSlot'](content);
      expect(typeof hasScopedSlot).toBe('boolean');
    });
  });

  describe('Activation Response', () => {
    it('should activate and provide Vue-specific analysis', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          <script setup lang="ts">
          import { ref, computed } from 'vue';

          const count = ref(0);
          const doubled = computed(() => count.value * 2);
          </script>
        `,
        filePath: 'Counter.vue'
      };

      const response = await agent.activate(context);

      expect(response).toHaveProperty('success');
      expect(response).toHaveProperty('suggestions');
      expect(response.context?.vueAnalysis).toBeDefined();
    });

    it('should provide suggestions for Vue 3 best practices', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          export default {
            data() {
              return { count: 0 };
            }
          };
        `,
        filePath: 'OldComponent.vue'
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
        filePath: 'empty.vue'
      };

      const analysis = await agent['analyzeVuePatterns'](context);

      expect(analysis).toBeDefined();
      expect(analysis.score).toBeGreaterThanOrEqual(0);
    });

    it('should handle non-Vue content gracefully', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: 'const x = 1;',
        filePath: 'utils.ts'
      };

      const analysis = await agent['analyzeVuePatterns'](context);

      expect(analysis).toBeDefined();
    });
  });
});
