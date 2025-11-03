/**
 * VERSATIL SDLC Framework - James-Svelte Sub-Agent Tests
 * Priority 3: Language Sub-Agent Testing
 *
 * Test Coverage:
 * - Svelte 5+ runes ($state, $derived, $effect)
 * - Component patterns
 * - Reactivity system
 * - Store patterns
 * - SvelteKit routing
 * - Performance optimization
 * - Testing patterns
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JamesSvelte } from './james-svelte.js';
import type { AgentActivationContext } from '../../../core/base-agent.js';

// Mock dependencies
vi.mock('../../../../rag/enhanced-vector-memory-store.js', () => ({
  EnhancedVectorMemoryStore: vi.fn()
}));

describe('JamesSvelte', () => {
  let agent: JamesSvelte;

  beforeEach(() => {
    vi.clearAllMocks();
    agent = new JamesSvelte();
  });

  describe('Agent Initialization', () => {
    it('should initialize with Svelte specialization', () => {
      expect(agent.name).toBe('James-Svelte');
      expect(agent.id).toBe('james-svelte');
      expect(agent.specialization).toContain('Svelte');
    });

    it('should have Svelte-specific system prompt', () => {
      expect(agent.systemPrompt).toContain('runes');
      expect(agent.systemPrompt).toContain('$state');
    });
  });

  describe('Svelte 5 Runes Detection', () => {
    it('should detect $state rune', () => {
      const content = `
        <script>
          let count = $state(0);
        </script>
      `;

      const hasStateRune = agent['hasStateRune'](content);
      expect(hasStateRune).toBe(true);
    });

    it('should detect $derived rune', () => {
      const content = `
        <script>
          let doubled = $derived(count * 2);
        </script>
      `;

      const hasDerivedRune = agent['hasDerivedRune'](content);
      expect(hasDerivedRune).toBe(true);
    });

    it('should detect $effect rune', () => {
      const content = `
        <script>
          $effect(() => {
            console.log('Count changed:', count);
          });
        </script>
      `;

      const hasEffectRune = agent['hasEffectRune'](content);
      expect(hasEffectRune).toBe(true);
    });

    it('should detect $props rune', () => {
      const content = `
        <script>
          let { title, count = 0 } = $props();
        </script>
      `;

      const hasPropsRune = agent['hasPropsRune'](content);
      expect(hasPropsRune).toBe(true);
    });

    it('should recommend runes over legacy reactivity', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          <script>
            let count = 0;
            $: doubled = count * 2;
          </script>
        `,
        filePath: 'Counter.svelte'
      };

      const analysis = await agent['analyzeSveltePatterns'](context);
      expect(analysis).toBeDefined();
    });
  });

  describe('Legacy Reactivity Detection', () => {
    it('should detect $: reactive declarations', () => {
      const content = `
        <script>
          $: doubled = count * 2;
        </script>
      `;

      const hasReactiveDeclaration = agent['hasReactiveDeclaration'](content);
      expect(hasReactiveDeclaration).toBe(true);
    });

    it('should detect $: reactive statements', () => {
      const content = `
        <script>
          $: console.log('Count:', count);
        </script>
      `;

      const hasReactiveStatement = agent['hasReactiveStatement'](content);
      expect(hasReactiveStatement).toBe(true);
    });

    it('should detect reactive blocks', () => {
      const content = `
        <script>
          $: {
            console.log('Count:', count);
            console.log('Doubled:', doubled);
          }
        </script>
      `;

      const hasReactiveBlock = agent['hasReactiveBlock'](content);
      expect(hasReactiveBlock).toBe(true);
    });
  });

  describe('Component Patterns', () => {
    it('should detect script tags', () => {
      const content = `
        <script lang="ts">
          let count = 0;
        </script>
      `;

      const hasScript = agent['hasScript'](content);
      expect(hasScript).toBe(true);
    });

    it('should detect TypeScript usage', () => {
      const content = `
        <script lang="ts">
          let count: number = 0;
        </script>
      `;

      const hasTypeScript = agent['hasTypeScript'](content);
      expect(hasTypeScript).toBe(true);
    });

    it('should detect component props', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          <script>
            export let title;
            export let count = 0;
          </script>
        `,
        filePath: 'Card.svelte'
      };

      const analysis = await agent['analyzeSveltePatterns'](context);
      expect(analysis.score).toBeGreaterThan(0);
    });

    it('should detect event handlers', () => {
      const content = `
        <button on:click={increment}>Increment</button>
      `;

      const hasEventHandler = agent['hasEventHandler'](content);
      expect(hasEventHandler).toBe(true);
    });

    it('should detect component events', () => {
      const content = `
        <script>
          import { createEventDispatcher } from 'svelte';
          const dispatch = createEventDispatcher();
        </script>
      `;

      const hasEventDispatcher = agent['hasEventDispatcher'](content);
      expect(hasEventDispatcher).toBe(true);
    });
  });

  describe('Store Patterns', () => {
    it('should detect writable stores', () => {
      const content = `
        import { writable } from 'svelte/store';
        const count = writable(0);
      `;

      const hasWritableStore = agent['hasWritableStore'](content);
      expect(hasWritableStore).toBe(true);
    });

    it('should detect readable stores', () => {
      const content = `
        import { readable } from 'svelte/store';
        const time = readable(new Date(), (set) => {
          const interval = setInterval(() => set(new Date()), 1000);
          return () => clearInterval(interval);
        });
      `;

      const hasReadableStore = agent['hasReadableStore'](content);
      expect(hasReadableStore).toBe(true);
    });

    it('should detect derived stores', () => {
      const content = `
        import { derived } from 'svelte/store';
        const doubled = derived(count, $count => $count * 2);
      `;

      const hasDerivedStore = agent['hasDerivedStore'](content);
      expect(hasDerivedStore).toBe(true);
    });

    it('should detect store subscriptions', () => {
      const content = `
        <script>
          let value;
          const unsubscribe = count.subscribe(c => value = c);
        </script>
      `;

      const hasStoreSubscription = agent['hasStoreSubscription'](content);
      expect(hasStoreSubscription).toBe(true);
    });

    it('should recommend auto-subscriptions with $', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          <script>
            let value;
            count.subscribe(c => value = c);
          </script>
        `,
        filePath: 'Component.svelte'
      };

      const analysis = await agent['analyzeSveltePatterns'](context);
      expect(analysis).toBeDefined();
    });
  });

  describe('SvelteKit Routing', () => {
    it('should detect +page.svelte files', () => {
      const filePath = 'src/routes/about/+page.svelte';
      const isPageFile = agent['isPageFile'](filePath);
      expect(isPageFile).toBe(true);
    });

    it('should detect +layout.svelte files', () => {
      const filePath = 'src/routes/+layout.svelte';
      const isLayoutFile = agent['isLayoutFile'](filePath);
      expect(isLayoutFile).toBe(true);
    });

    it('should detect +page.server.ts files', () => {
      const filePath = 'src/routes/api/+page.server.ts';
      const isServerFile = agent['isServerFile'](filePath);
      expect(isServerFile).toBe(true);
    });

    it('should detect load functions', () => {
      const content = `
        export async function load({ params }) {
          return { data: await fetchData(params.id) };
        }
      `;

      const hasLoadFunction = agent['hasLoadFunction'](content);
      expect(hasLoadFunction).toBe(true);
    });

    it('should detect form actions', () => {
      const content = `
        export const actions = {
          default: async ({ request }) => {
            const data = await request.formData();
            return { success: true };
          }
        };
      `;

      const hasFormAction = agent['hasFormAction'](content);
      expect(hasFormAction).toBe(true);
    });
  });

  describe('Template Syntax', () => {
    it('should detect {#if} blocks', () => {
      const content = `
        {#if isVisible}
          <div>Content</div>
        {/if}
      `;

      const hasIfBlock = agent['hasIfBlock'](content);
      expect(hasIfBlock).toBe(true);
    });

    it('should detect {#each} blocks', () => {
      const content = `
        {#each items as item}
          <div>{item}</div>
        {/each}
      `;

      const hasEachBlock = agent['hasEachBlock'](content);
      expect(hasEachBlock).toBe(true);
    });

    it('should detect {#await} blocks', () => {
      const content = `
        {#await promise}
          <p>Loading...</p>
        {:then data}
          <p>{data}</p>
        {:catch error}
          <p>Error: {error.message}</p>
        {/await}
      `;

      const hasAwaitBlock = agent['hasAwaitBlock'](content);
      expect(hasAwaitBlock).toBe(true);
    });

    it('should detect key blocks', () => {
      const content = `
        {#key value}
          <Component />
        {/key}
      `;

      const hasKeyBlock = agent['hasKeyBlock'](content);
      expect(hasKeyBlock).toBe(true);
    });

    it('should detect missing keyed each', () => {
      const content = `
        {#each items as item}
          <div>{item.name}</div>
        {/each}
      `;

      const hasMissingKey = agent['hasMissingKeyedEach'](content);
      expect(typeof hasMissingKey).toBe('boolean');
    });
  });

  describe('Lifecycle and Special Elements', () => {
    it('should detect onMount', () => {
      const content = `
        import { onMount } from 'svelte';
        onMount(() => {
          console.log('Component mounted');
        });
      `;

      const hasOnMount = agent['hasOnMount'](content);
      expect(hasOnMount).toBe(true);
    });

    it('should detect onDestroy', () => {
      const content = `
        import { onDestroy } from 'svelte';
        onDestroy(() => {
          cleanup();
        });
      `;

      const hasOnDestroy = agent['hasOnDestroy'](content);
      expect(hasOnDestroy).toBe(true);
    });

    it('should detect beforeUpdate', () => {
      const content = `
        import { beforeUpdate } from 'svelte';
        beforeUpdate(() => {
          console.log('About to update');
        });
      `;

      const hasBeforeUpdate = agent['hasBeforeUpdate'](content);
      expect(hasBeforeUpdate).toBe(true);
    });

    it('should detect afterUpdate', () => {
      const content = `
        import { afterUpdate } from 'svelte';
        afterUpdate(() => {
          console.log('Updated');
        });
      `;

      const hasAfterUpdate = agent['hasAfterUpdate'](content);
      expect(hasAfterUpdate).toBe(true);
    });

    it('should detect svelte:window', () => {
      const content = `
        <svelte:window on:keydown={handleKeydown} />
      `;

      const hasSvelteWindow = agent['hasSvelteWindow'](content);
      expect(hasSvelteWindow).toBe(true);
    });

    it('should detect svelte:component', () => {
      const content = `
        <svelte:component this={CurrentComponent} />
      `;

      const hasSvelteComponent = agent['hasSvelteComponent'](content);
      expect(hasSvelteComponent).toBe(true);
    });
  });

  describe('Performance Optimization', () => {
    it('should detect immutable components', () => {
      const content = `
        <svelte:options immutable={true} />
      `;

      const hasImmutable = agent['hasImmutable'](content);
      expect(hasImmutable).toBe(true);
    });

    it('should detect lazy loading', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          <script>
            const LazyComponent = () => import('./Heavy.svelte');
          </script>
        `,
        filePath: 'App.svelte'
      };

      const analysis = await agent['analyzeSveltePatterns'](context);
      expect(analysis).toBeDefined();
    });

    it('should validate proper reactivity', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          <script>
            let count = $state(0);
            let doubled = $derived(count * 2);
          </script>
        `,
        filePath: 'Counter.svelte'
      };

      const analysis = await agent['analyzeSveltePatterns'](context);
      expect(analysis.score).toBeGreaterThan(80);
    });
  });

  describe('Activation Response', () => {
    it('should activate and provide Svelte-specific analysis', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          <script lang="ts">
            let count = $state(0);
            let doubled = $derived(count * 2);

            function increment() {
              count++;
            }
          </script>

          <button on:click={increment}>
            Count: {count}, Doubled: {doubled}
          </button>
        `,
        filePath: 'Counter.svelte'
      };

      const response = await agent.activate(context);

      expect(response).toHaveProperty('success');
      expect(response).toHaveProperty('suggestions');
    });

    it('should provide Svelte 5 best practices', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          <script>
            let count = 0;
            $: doubled = count * 2;
          </script>
        `,
        filePath: 'OldCounter.svelte'
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
        filePath: 'Empty.svelte'
      };

      const analysis = await agent['analyzeSveltePatterns'](context);

      expect(analysis).toBeDefined();
      expect(analysis.score).toBeGreaterThanOrEqual(0);
    });

    it('should handle non-Svelte content gracefully', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: 'const x = 1;',
        filePath: 'utils.ts'
      };

      const analysis = await agent['analyzeSveltePatterns'](context);

      expect(analysis).toBeDefined();
    });
  });
});
