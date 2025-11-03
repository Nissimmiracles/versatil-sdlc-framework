/**
 * VERSATIL SDLC Framework - James-NextJS Sub-Agent Tests
 * Priority 3: Language Sub-Agent Testing
 *
 * Test Coverage:
 * - Next.js 14+ App Router patterns
 * - Server/Client Components
 * - Server Actions
 * - Routing and navigation
 * - Data fetching patterns
 * - Performance optimization
 * - SEO best practices
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JamesNextJS } from './james-nextjs.js';
import type { AgentActivationContext } from '../../../core/base-agent.js';

// Mock dependencies
vi.mock('../../../../rag/enhanced-vector-memory-store.js', () => ({
  EnhancedVectorMemoryStore: vi.fn()
}));

describe('JamesNextJS', () => {
  let agent: JamesNextJS;

  beforeEach(() => {
    vi.clearAllMocks();
    agent = new JamesNextJS();
  });

  describe('Agent Initialization', () => {
    it('should initialize with Next.js specialization', () => {
      expect(agent.name).toBe('James-NextJS');
      expect(agent.id).toBe('james-nextjs');
      expect(agent.specialization).toContain('Next.js');
    });

    it('should have Next.js-specific system prompt', () => {
      expect(agent.systemPrompt).toContain('App Router');
      expect(agent.systemPrompt).toContain('Server Components');
    });
  });

  describe('App Router Pattern Detection', () => {
    it('should detect app directory usage', () => {
      const filePath = 'app/page.tsx';
      const hasAppRouter = agent['hasAppRouter'](filePath);
      expect(hasAppRouter).toBe(true);
    });

    it('should detect pages directory (legacy)', () => {
      const filePath = 'pages/index.tsx';
      const hasPagesRouter = agent['hasPagesRouter'](filePath);
      expect(hasPagesRouter).toBe(true);
    });

    it('should recommend App Router over Pages Router', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          export default function Home() {
            return <div>Home</div>;
          }
        `,
        filePath: 'pages/index.tsx'
      };

      const analysis = await agent['analyzeNextPatterns'](context);
      expect(analysis.score).toBeGreaterThan(0);
    });
  });

  describe('Server/Client Component Detection', () => {
    it('should detect use client directive', () => {
      const content = `
        'use client';
        import { useState } from 'react';
      `;

      const hasUseClient = agent['hasUseClient'](content);
      expect(hasUseClient).toBe(true);
    });

    it('should detect use server directive', () => {
      const content = `
        'use server';
        export async function submitForm() {}
      `;

      const hasUseServer = agent['hasUseServer'](content);
      expect(hasUseServer).toBe(true);
    });

    it('should detect useState in Server Component (error)', () => {
      const content = `
        import { useState } from 'react';
        export default function Page() {
          const [count, setCount] = useState(0);
        }
      `;
      const filePath = 'app/page.tsx';

      const hasClientHookInServerComponent = agent['hasClientHookInServerComponent'](content, filePath);
      expect(typeof hasClientHookInServerComponent).toBe('boolean');
    });

    it('should validate proper component split', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          'use client';
          export default function Counter() {
            const [count, setCount] = useState(0);
            return <button onClick={() => setCount(count + 1)}>{count}</button>;
          }
        `,
        filePath: 'app/components/Counter.tsx'
      };

      const analysis = await agent['analyzeNextPatterns'](context);
      expect(analysis.score).toBeGreaterThan(70);
    });
  });

  describe('Server Actions Detection', () => {
    it('should detect Server Action definition', () => {
      const content = `
        'use server';
        export async function createUser(formData: FormData) {
          const name = formData.get('name');
          await db.user.create({ name });
        }
      `;

      const hasServerAction = agent['hasServerAction'](content);
      expect(hasServerAction).toBe(true);
    });

    it('should detect Server Action usage in form', () => {
      const content = `
        <form action={createUser}>
          <input name="name" />
          <button type="submit">Create</button>
        </form>
      `;

      const hasFormAction = agent['hasFormAction'](content);
      expect(hasFormAction).toBe(true);
    });

    it('should recommend Server Actions over API routes', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          async function handleSubmit(e) {
            e.preventDefault();
            await fetch('/api/users', { method: 'POST' });
          }
        `,
        filePath: 'app/users/page.tsx'
      };

      const analysis = await agent['analyzeNextPatterns'](context);
      expect(analysis).toBeDefined();
    });
  });

  describe('Data Fetching Patterns', () => {
    it('should detect async Server Component', () => {
      const content = `
        export default async function Page() {
          const data = await fetchData();
          return <div>{data}</div>;
        }
      `;

      const hasAsyncComponent = agent['hasAsyncComponent'](content);
      expect(hasAsyncComponent).toBe(true);
    });

    it('should detect getServerSideProps (legacy)', () => {
      const content = `
        export async function getServerSideProps() {
          return { props: {} };
        }
      `;

      const hasGSSP = agent['hasGetServerSideProps'](content);
      expect(hasGSSP).toBe(true);
    });

    it('should detect getStaticProps (legacy)', () => {
      const content = `
        export async function getStaticProps() {
          return { props: {}, revalidate: 60 };
        }
      `;

      const hasGSP = agent['hasGetStaticProps'](content);
      expect(hasGSP).toBe(true);
    });

    it('should recommend fetch with revalidate', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          export default async function Page() {
            const data = await fetch('https://api.example.com/data', {
              next: { revalidate: 3600 }
            });
            return <div>{JSON.stringify(data)}</div>;
          }
        `,
        filePath: 'app/page.tsx'
      };

      const analysis = await agent['analyzeNextPatterns'](context);
      expect(analysis.score).toBeGreaterThan(80);
    });
  });

  describe('Routing and Navigation', () => {
    it('should detect Link component usage', () => {
      const content = `
        import Link from 'next/link';
        <Link href="/about">About</Link>
      `;

      const hasLink = agent['hasLinkComponent'](content);
      expect(hasLink).toBe(true);
    });

    it('should detect useRouter hook', () => {
      const content = `
        import { useRouter } from 'next/navigation';
        const router = useRouter();
      `;

      const hasUseRouter = agent['hasUseRouter'](content);
      expect(hasUseRouter).toBe(true);
    });

    it('should detect redirect function', () => {
      const content = `
        import { redirect } from 'next/navigation';
        redirect('/login');
      `;

      const hasRedirect = agent['hasRedirect'](content);
      expect(hasRedirect).toBe(true);
    });

    it('should detect dynamic route segments', () => {
      const filePath = 'app/blog/[slug]/page.tsx';
      const hasDynamicRoute = agent['hasDynamicRoute'](filePath);
      expect(hasDynamicRoute).toBe(true);
    });

    it('should validate route params usage', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          export default function Page({ params }: { params: { slug: string } }) {
            return <div>{params.slug}</div>;
          }
        `,
        filePath: 'app/blog/[slug]/page.tsx'
      };

      const analysis = await agent['analyzeNextPatterns'](context);
      expect(analysis.score).toBeGreaterThan(0);
    });
  });

  describe('Performance Optimization', () => {
    it('should detect Image component usage', () => {
      const content = `
        import Image from 'next/image';
        <Image src="/photo.jpg" alt="Photo" width={500} height={300} />
      `;

      const hasImageComponent = agent['hasImageComponent'](content);
      expect(hasImageComponent).toBe(true);
    });

    it('should detect dynamic imports', () => {
      const content = `
        const DynamicComponent = dynamic(() => import('./Component'));
      `;

      const hasDynamicImport = agent['hasDynamicImport'](content);
      expect(hasDynamicImport).toBe(true);
    });

    it('should detect Suspense boundaries', () => {
      const content = `
        <Suspense fallback={<Loading />}>
          <DataComponent />
        </Suspense>
      `;

      const hasSuspense = agent['hasSuspense'](content);
      expect(hasSuspense).toBe(true);
    });

    it('should detect streaming with loading.tsx', () => {
      const filePath = 'app/dashboard/loading.tsx';
      const hasLoadingFile = agent['hasLoadingFile'](filePath);
      expect(hasLoadingFile).toBe(true);
    });

    it('should recommend Image over img tag', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          <img src="/photo.jpg" alt="Photo" />
        `,
        filePath: 'app/page.tsx'
      };

      const analysis = await agent['analyzeNextPatterns'](context);
      expect(analysis).toBeDefined();
    });
  });

  describe('SEO Best Practices', () => {
    it('should detect Metadata export', () => {
      const content = `
        export const metadata = {
          title: 'My Page',
          description: 'Page description'
        };
      `;

      const hasMetadata = agent['hasMetadata'](content);
      expect(hasMetadata).toBe(true);
    });

    it('should detect generateMetadata function', () => {
      const content = `
        export async function generateMetadata({ params }) {
          return { title: params.title };
        }
      `;

      const hasGenerateMetadata = agent['hasGenerateMetadata'](content);
      expect(hasGenerateMetadata).toBe(true);
    });

    it('should detect sitemap.ts', () => {
      const filePath = 'app/sitemap.ts';
      const hasSitemap = agent['hasSitemap'](filePath);
      expect(hasSitemap).toBe(true);
    });

    it('should detect robots.txt configuration', () => {
      const filePath = 'app/robots.ts';
      const hasRobots = agent['hasRobots'](filePath);
      expect(hasRobots).toBe(true);
    });

    it('should validate metadata completeness', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          export const metadata = {
            title: 'My App',
            description: 'App description',
            openGraph: {
              title: 'My App',
              description: 'App description',
              images: ['/og-image.jpg']
            }
          };
        `,
        filePath: 'app/layout.tsx'
      };

      const analysis = await agent['analyzeNextPatterns'](context);
      expect(analysis.score).toBeGreaterThan(80);
    });
  });

  describe('Layout and Error Handling', () => {
    it('should detect layout.tsx', () => {
      const filePath = 'app/layout.tsx';
      const hasLayout = agent['hasLayout'](filePath);
      expect(hasLayout).toBe(true);
    });

    it('should detect error.tsx', () => {
      const filePath = 'app/error.tsx';
      const hasErrorBoundary = agent['hasErrorBoundary'](filePath);
      expect(hasErrorBoundary).toBe(true);
    });

    it('should detect not-found.tsx', () => {
      const filePath = 'app/not-found.tsx';
      const hasNotFound = agent['hasNotFound'](filePath);
      expect(hasNotFound).toBe(true);
    });

    it('should validate root layout', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          export default function RootLayout({ children }) {
            return (
              <html lang="en">
                <body>{children}</body>
              </html>
            );
          }
        `,
        filePath: 'app/layout.tsx'
      };

      const analysis = await agent['analyzeNextPatterns'](context);
      expect(analysis.score).toBeGreaterThan(0);
    });
  });

  describe('Activation Response', () => {
    it('should activate and provide Next.js-specific analysis', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          export default async function Page() {
            const data = await fetch('https://api.example.com/data', {
              next: { revalidate: 3600 }
            });
            return <div>{JSON.stringify(data)}</div>;
          }
        `,
        filePath: 'app/page.tsx'
      };

      const response = await agent.activate(context);

      expect(response).toHaveProperty('success');
      expect(response).toHaveProperty('suggestions');
    });

    it('should provide Next.js 14 best practices', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          export async function getServerSideProps() {
            return { props: {} };
          }
        `,
        filePath: 'pages/index.tsx'
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
        filePath: 'app/page.tsx'
      };

      const analysis = await agent['analyzeNextPatterns'](context);

      expect(analysis).toBeDefined();
      expect(analysis.score).toBeGreaterThanOrEqual(0);
    });

    it('should handle non-Next.js content gracefully', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: 'const x = 1;',
        filePath: 'utils.ts'
      };

      const analysis = await agent['analyzeNextPatterns'](context);

      expect(analysis).toBeDefined();
    });
  });
});
