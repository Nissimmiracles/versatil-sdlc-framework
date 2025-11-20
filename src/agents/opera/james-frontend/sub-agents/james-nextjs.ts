/**
 * James-NextJS: Next.js 14+ Frontend Specialist
 *
 * Language-specific sub-agent for Next.js 14+ development.
 * Specializes in App Router, Server Components, Server Actions, and modern Next.js patterns.
 *
 * Auto-activates on: Next.js files (app/**, pages/**, next.config.js), Server Components, Route Handlers
 *
 * @module james-nextjs
 * @version 6.6.0
 * @parent james-frontend
 */

import { EnhancedJames } from '../enhanced-james.js';
import { AgentActivationContext, AgentResponse } from '../../../core/base-agent.js';
import { EnhancedVectorMemoryStore } from '../../../../rag/enhanced-vector-memory-store.js';

export interface NextJSBestPractices {
  appRouterPatterns: string[];
  serverComponentPatterns: string[];
  dataFetchingPatterns: string[];
  performanceOptimizations: string[];
  seoPatterns: string[];
}

export class JamesNextJS extends EnhancedJames {
  name = 'James-NextJS';
  id = 'james-nextjs';
  specialization = 'Next.js 14+ Frontend Specialist';
  systemPrompt = `You are James-NextJS, a specialized Next.js 14+ expert with deep knowledge of:
- App Router architecture (app directory, layouts, templates)
- Server Components vs Client Components
- Server Actions for mutations
- Route Handlers (app/api/route.ts)
- Metadata API for SEO
- Image optimization with next/image
- Font optimization with next/font
- Streaming and Suspense
- Parallel and Intercepting Routes
- Middleware for authentication and redirects`;

  constructor(vectorStore?: EnhancedVectorMemoryStore) {
    super(vectorStore);
  }

  /**
   * Override activate to add Next.js-specific validation
   */
  async activate(context: AgentActivationContext): Promise<AgentResponse> {
    // Run base James activation
    const response = await super.activate(context);

    // Add Next.js-specific analysis
    const nextjsAnalysis = await this.analyzeNextJSPatterns(context);

    // Enhance response with Next.js insights
    response.suggestions = response.suggestions || [];
    response.suggestions.push(...nextjsAnalysis.suggestions);

    if (response.context) {
      response.context.nextjsAnalysis = nextjsAnalysis;
    }

    return response;
  }

  /**
   * Analyze Next.js-specific patterns
   */
  public async analyzeNextPatterns(context: AgentActivationContext): Promise<{
    score: number;
    suggestions: Array<{ type: string; message: string; priority: string }>;
    bestPractices: NextJSBestPractices;
  }> {
    return this.analyzeNextJSPatterns(context);
  }

  private async analyzeNextJSPatterns(context: AgentActivationContext): Promise<{
    score: number;
    suggestions: Array<{ type: string; message: string; priority: string }>;
    bestPractices: NextJSBestPractices;
  }> {
    const content = context.content || '';
    const filePath = context.filePath || '';
    const suggestions: Array<{ type: string; message: string; priority: string }> = [];
    const bestPractices: NextJSBestPractices = {
      appRouterPatterns: [],
      serverComponentPatterns: [],
      dataFetchingPatterns: [],
      performanceOptimizations: [],
      seoPatterns: []
    };

    let score = 100;

    // Check for Pages Router in Next.js 14+ project
    if (this.usesPagesRouter(filePath)) {
      score -= 10;
      suggestions.push({
        type: 'architecture',
        message: 'Using Pages Router in Next.js 14+. Migrate to App Router for better performance.',
        priority: 'medium'
      });
      bestPractices.appRouterPatterns.push('Use App Router (app directory) in Next.js 13+');
    }

    // Check for missing "use client" directive
    if (this.needsUseClient(content) && !content.includes('"use client"')) {
      score -= 15;
      suggestions.push({
        type: 'server-components',
        message: 'Component uses client-side features without "use client" directive.',
        priority: 'high'
      });
      bestPractices.serverComponentPatterns.push('Add "use client" directive to components using hooks or browser APIs');
    }

    // Check for unnecessary "use client"
    if (content.includes('"use client"') && !this.needsUseClient(content)) {
      score -= 8;
      suggestions.push({
        type: 'server-components',
        message: 'Unnecessary "use client" directive. Component can be a Server Component.',
        priority: 'medium'
      });
      bestPractices.serverComponentPatterns.push('Keep components as Server Components by default');
    }

    // Check for data fetching patterns
    if (this.hasClientSideDataFetching(content) && this.isAppRouter(filePath)) {
      score -= 10;
      suggestions.push({
        type: 'data-fetching',
        message: 'Using client-side data fetching in Server Component context. Fetch data on server.',
        priority: 'medium'
      });
      bestPractices.dataFetchingPatterns.push('Prefer server-side data fetching with async/await in Server Components');
    }

    // Check for getServerSideProps in app directory
    if (content.includes('getServerSideProps') && this.isAppRouter(filePath)) {
      score -= 20;
      suggestions.push({
        type: 'data-fetching',
        message: 'getServerSideProps is not supported in App Router. Use Server Components.',
        priority: 'critical'
      });
      bestPractices.dataFetchingPatterns.push('Use async Server Components instead of getServerSideProps');
    }

    // Check for Image component best practices
    if (this.hasImages(content) && !content.includes('next/image')) {
      score -= 10;
      suggestions.push({
        type: 'performance',
        message: 'Using <img> tags. Use next/image for automatic optimization.',
        priority: 'high'
      });
      bestPractices.performanceOptimizations.push('Always use next/image for images');
    }

    // Check for Link component usage
    if (this.hasLinks(content) && !content.includes('next/link')) {
      score -= 8;
      suggestions.push({
        type: 'navigation',
        message: 'Using <a> tags for internal links. Use next/link for prefetching.',
        priority: 'medium'
      });
      bestPractices.appRouterPatterns.push('Use next/link for internal navigation');
    }

    // Check for Font optimization
    if (this.hasFontLinks(content) && !content.includes('next/font')) {
      score -= 5;
      suggestions.push({
        type: 'performance',
        message: 'Loading fonts via CDN. Use next/font for optimized font loading.',
        priority: 'low'
      });
      bestPractices.performanceOptimizations.push('Use next/font for automatic font optimization');
    }

    // Check for metadata API
    if (filePath.includes('/page.') && !this.checkMetadata(content)) {
      score -= 5;
      suggestions.push({
        type: 'seo',
        message: 'Page missing metadata export. Add metadata or generateMetadata for SEO.',
        priority: 'medium'
      });
      bestPractices.seoPatterns.push('Export metadata or generateMetadata from page components');
    }

    // Check for loading UI
    if (filePath.includes('/page.') && !this.hasLoadingState(filePath)) {
      suggestions.push({
        type: 'ux',
        message: 'Page missing loading.tsx. Add loading UI for better UX during Suspense.',
        priority: 'low'
      });
      bestPractices.appRouterPatterns.push('Create loading.tsx for loading states');
    }

    // Check for error handling
    if (filePath.includes('/page.') && !this.checkHasErrorBoundary(filePath)) {
      suggestions.push({
        type: 'error-handling',
        message: 'Page missing error.tsx. Add error boundary for better error handling.',
        priority: 'low'
      });
      bestPractices.appRouterPatterns.push('Create error.tsx for error boundaries');
    }

    // Check for Server Actions usage
    if (this.hasFormSubmission(content) && !this.usesServerActions(content)) {
      score -= 5;
      suggestions.push({
        type: 'server-actions',
        message: 'Form submission could use Server Actions. Add "use server" action.',
        priority: 'low'
      });
      bestPractices.dataFetchingPatterns.push('Use Server Actions for form mutations');
    }

    // Check for streaming with Suspense
    if (this.checkAsyncComponent(content) && !content.includes('Suspense')) {
      score -= 10;
      suggestions.push({
        type: 'performance',
        message: 'Async Server Component without Suspense boundary. Add Suspense for streaming.',
        priority: 'medium'
      });
      bestPractices.serverComponentPatterns.push('Wrap async Server Components in Suspense boundaries');
    }

    // Check for dynamic imports for code splitting
    if (this.hasLargeComponent(content) && !content.includes('dynamic')) {
      suggestions.push({
        type: 'performance',
        message: 'Large component detected. Consider dynamic import with next/dynamic.',
        priority: 'low'
      });
      bestPractices.performanceOptimizations.push('Use next/dynamic for code splitting large components');
    }

    // Check for route handlers best practices
    if (filePath.includes('/route.')) {
      if (!this.hasProperRouteHandlerExports(content)) {
        score -= 10;
        suggestions.push({
          type: 'api-routes',
          message: 'Route handler missing proper exports (GET, POST, etc.).',
          priority: 'high'
        });
        bestPractices.appRouterPatterns.push('Export named HTTP method functions (GET, POST) from route.ts');
      }
    }

    // Check for parallel routes usage
    if (this.hasMultipleSections(content) && !this.usesParallelRoutes(filePath)) {
      suggestions.push({
        type: 'architecture',
        message: 'Multiple independent sections. Consider parallel routes with @slots.',
        priority: 'low'
      });
      bestPractices.appRouterPatterns.push('Use parallel routes for independent UI sections');
    }

    // Check for middleware patterns
    if (filePath.includes('middleware.') && !(content.includes('NextResponse') && content.includes('export const config'))) {
      score -= 10;
      suggestions.push({
        type: 'middleware',
        message: 'Middleware missing proper patterns (NextResponse, matcher config).',
        priority: 'medium'
      });
      bestPractices.appRouterPatterns.push('Use NextResponse and config matcher in middleware');
    }

    return {
      score: Math.max(score, 0),
      suggestions,
      bestPractices
    };
  }

  // Router Detection
  public hasAppRouter(filePath: string): boolean {
    return this.isAppRouter(filePath);
  }

  public hasPagesRouter(filePath: string): boolean {
    return this.usesPagesRouter(filePath);
  }

  // Client/Server Component Detection
  public hasUseClient(content: string): boolean {
    return /["']use client["']/.test(content);
  }

  public hasUseServer(content: string): boolean {
    return /["']use server["']/.test(content);
  }

  public hasClientHookInServerComponent(content: string, filePath: string): boolean {
    const isServerComponent = this.isAppRouter(filePath) && !this.hasUseClient(content);
    const hasClientHooks = /useState|useEffect|useContext/.test(content);
    return isServerComponent && hasClientHooks;
  }

  // Server Actions
  public hasServerAction(content: string): boolean {
    return this.usesServerActions(content);
  }

  public hasFormAction(content: string): boolean {
    return /action=\{/.test(content) || /<form\s+action=/.test(content);
  }

  // Data Fetching
  public hasAsyncComponent(content: string): boolean {
    return this.checkAsyncComponent(content);
  }

  private checkAsyncComponent(content: string): boolean {
    return /export default async function/.test(content) || /export async function/.test(content);
  }

  public hasGetServerSideProps(content: string): boolean {
    return /export\s+(async\s+)?function\s+getServerSideProps/.test(content);
  }

  public hasGetStaticProps(content: string): boolean {
    return /export\s+(async\s+)?function\s+getStaticProps/.test(content);
  }

  // Navigation
  public hasLinkComponent(content: string): boolean {
    return /import.*Link.*from\s+['"]next\/link['"]/.test(content) || /<Link/.test(content);
  }

  public hasUseRouter(content: string): boolean {
    return /useRouter\s*\(/.test(content);
  }

  public hasRedirect(content: string): boolean {
    return /redirect\s*\(/.test(content) || /permanentRedirect\s*\(/.test(content);
  }

  public hasDynamicRoute(filePath: string): boolean {
    return /\[[\w]+\]/.test(filePath);
  }

  // Performance
  public hasImageComponent(content: string): boolean {
    return /import.*Image.*from\s+['"]next\/image['"]/.test(content) || /<Image/.test(content);
  }

  public hasDynamicImport(content: string): boolean {
    return /dynamic\s*\(/.test(content) || /import\s*\(/.test(content);
  }

  public hasSuspense(content: string): boolean {
    return /<Suspense/.test(content);
  }

  public hasLoadingFile(filePath: string): boolean {
    return /loading\.(tsx?|jsx?)$/.test(filePath);
  }

  // SEO
  public hasMetadata(content: string): boolean {
    return this.checkMetadata(content);
  }

  private checkMetadata(content: string): boolean {
    return content.includes('export const metadata') || content.includes('export async function generateMetadata');
  }

  public hasGenerateMetadata(content: string): boolean {
    return /export\s+(async\s+)?function\s+generateMetadata/.test(content);
  }

  public hasSitemap(filePath: string): boolean {
    return /sitemap\.(xml|ts|tsx|js|jsx)$/.test(filePath);
  }

  public hasRobots(filePath: string): boolean {
    return /robots\.(txt|ts|tsx|js|jsx)$/.test(filePath);
  }

  // File Conventions
  public hasLayout(filePath: string): boolean {
    return /layout\.(tsx?|jsx?)$/.test(filePath);
  }

  public hasErrorBoundary(filePath: string): boolean {
    return this.checkHasErrorBoundary(filePath);
  }

  private checkHasErrorBoundary(filePath: string): boolean {
    return /error\.(tsx?|jsx?)$/.test(filePath);
  }

  public hasNotFound(filePath: string): boolean {
    return /not-found\.(tsx?|jsx?)$/.test(filePath);
  }

  /**
   * Check if using Pages Router
   */
  private usesPagesRouter(filePath: string): boolean {
    return filePath.includes('/pages/') && !filePath.includes('/app/');
  }

  /**
   * Check if component needs "use client"
   */
  private needsUseClient(content: string): boolean {
    const clientFeatures = [
      'useState', 'useEffect', 'useContext', 'useReducer',
      'onClick', 'onChange', 'onSubmit',
      'window.', 'document.', 'localStorage', 'sessionStorage'
    ];

    return clientFeatures.some(feature => content.includes(feature));
  }

  /**
   * Check if in App Router context
   */
  private isAppRouter(filePath: string): boolean {
    return filePath.includes('/app/');
  }

  /**
   * Check for client-side data fetching
   */
  private hasClientSideDataFetching(content: string): boolean {
    return content.includes('useEffect') && (content.includes('fetch(') || content.includes('axios'));
  }

  /**
   * Check for images
   */
  private hasImages(content: string): boolean {
    return /<img/.test(content);
  }

  /**
   * Check for links
   */
  private hasLinks(content: string): boolean {
    return /<a\s+href=/.test(content);
  }

  /**
   * Check for font links
   */
  private hasFontLinks(content: string): boolean {
    return content.includes('fonts.googleapis.com') || content.includes('link rel="preload"');
  }

  /**
   * Check for loading state file
   */
  private hasLoadingState(filePath: string): boolean {
    const dir = filePath.substring(0, filePath.lastIndexOf('/'));
    return false; // In real implementation, check if ${dir}/loading.tsx exists
  }


  /**
   * Check for form submission
   */
  private hasFormSubmission(content: string): boolean {
    return content.includes('<form') || content.includes('onSubmit');
  }

  /**
   * Check for Server Actions usage
   */
  private usesServerActions(content: string): boolean {
    return content.includes('"use server"') || content.includes('action=');
  }


  /**
   * Check if component is large (heuristic)
   */
  private hasLargeComponent(content: string): boolean {
    return content.length > 2000; // Lines of code
  }

  /**
   * Check for proper route handler exports
   */
  private hasProperRouteHandlerExports(content: string): boolean {
    const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    return httpMethods.some(method => content.includes(`export async function ${method}`));
  }

  /**
   * Check for multiple independent sections
   */
  private hasMultipleSections(content: string): boolean {
    return (content.match(/<section/g) || []).length > 2;
  }

  /**
   * Check for parallel routes usage
   */
  private usesParallelRoutes(filePath: string): boolean {
    return filePath.includes('/@');
  }

  /**
   * Generate Next.js-specific recommendations
   */
  generateNextJSRecommendations(content: string): string[] {
    const recommendations: string[] = [];

    // App Router
    if (!content.includes('app/')) {
      recommendations.push('Migrate to App Router for improved performance and developer experience');
    }

    // Caching
    if (content.includes('fetch(') && !content.includes('cache:')) {
      recommendations.push('Configure fetch caching strategy (force-cache, no-store, revalidate)');
    }

    // Incremental Static Regeneration
    if (content.includes('export default')) {
      recommendations.push('Consider ISR with revalidate for pages with dynamic but cacheable content');
    }

    // Edge Runtime
    if (content.includes('export const runtime')) {
      recommendations.push('Use Edge Runtime for global edge deployment and faster cold starts');
    }

    // Middleware
    if (!content.includes('middleware')) {
      recommendations.push('Use middleware for authentication, redirects, and request modification');
    }

    return recommendations;
  }

  /**
   * Override RAG configuration for Next.js domain
   */
  protected getDefaultRAGConfig() {
    return {
      ...super.getDefaultRAGConfig(),
      agentDomain: 'frontend-nextjs',
      maxExamples: 5
    };
  }

  /**
   * Detect Next.js version
   */
  detectNextJSVersion(content: string): string {
    if (content.includes('app/') || content.includes('Server Component')) return 'Next.js 13+ (App Router)';
    if (content.includes('pages/')) return 'Next.js (Pages Router)';
    return 'Next.js (version unknown)';
  }

  /**
   * Detect rendering strategy
   */
  detectRenderingStrategy(content: string): string {
    if (content.includes('generateStaticParams')) return 'Static Site Generation (SSG)';
    if (content.includes('export const dynamic') && content.includes("'force-dynamic'")) return 'Server-Side Rendering (SSR)';
    if (content.includes('export const revalidate')) return 'Incremental Static Regeneration (ISR)';
    if (content.includes('"use client"')) return 'Client-Side Rendering (CSR)';
    return 'Server Component (Default)';
  }
}
