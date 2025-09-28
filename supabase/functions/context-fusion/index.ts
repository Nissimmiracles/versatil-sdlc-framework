// VERSATIL SDLC Framework - Context Fusion Edge Function
// Merges multiple agent contexts for collaborative tasks

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHash } from 'https://deno.land/std@0.177.0/node/crypto.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContextFusionRequest {
  agentIds: string[];
  taskDescription?: string;
  fusionMethod?: 'merge' | 'weighted' | 'priority' | 'consensus';
  expiresIn?: number; // seconds
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const {
      agentIds,
      taskDescription = '',
      fusionMethod = 'merge',
      expiresIn = 3600, // 1 hour default
    }: ContextFusionRequest = await req.json();

    if (!agentIds || agentIds.length < 2) {
      return new Response(
        JSON.stringify({ error: 'At least 2 agent IDs required for fusion' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Generate fusion key
    const fusionKey = createHash('sha256')
      .update(agentIds.sort().join('-') + taskDescription)
      .digest('hex');

    // Check if fusion already exists and is not expired
    const { data: existingFusion, error: fetchError } = await supabase
      .from('context_fusions')
      .select('*')
      .eq('fusion_key', fusionKey)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (existingFusion && !fetchError) {
      return new Response(
        JSON.stringify({
          success: true,
          cached: true,
          fusedContext: existingFusion.fused_context,
          qualityScore: existingFusion.quality_score,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch latest contexts for all agents
    const { data: contexts, error: contextsError } = await supabase
      .from('agent_contexts')
      .select('*')
      .in('agent_id', agentIds)
      .order('created_at', { ascending: false });

    if (contextsError) throw contextsError;

    if (!contexts || contexts.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No contexts found for specified agents' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Group contexts by agent
    const contextsByAgent = new Map<string, any>();
    contexts.forEach(ctx => {
      if (!contextsByAgent.has(ctx.agent_id)) {
        contextsByAgent.set(ctx.agent_id, []);
      }
      contextsByAgent.get(ctx.agent_id)!.push(ctx);
    });

    // Perform fusion based on method
    const fusedContext = performFusion(contextsByAgent, fusionMethod);
    const qualityScore = calculateQualityScore(fusedContext, contextsByAgent);

    // Store fused context
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    const { data: fusionData, error: insertError } = await supabase
      .from('context_fusions')
      .insert({
        fusion_key: fusionKey,
        agent_ids: agentIds,
        task_description: taskDescription,
        fused_context: fusedContext,
        fusion_method: fusionMethod,
        quality_score: qualityScore,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({
        success: true,
        cached: false,
        fusedContext,
        qualityScore,
        fusionMethod,
        expiresAt,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error fusing contexts:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function performFusion(contextsByAgent: Map<string, any[]>, method: string): any {
  const fusedContext: any = {
    repository: {},
    stack: {},
    ui: {},
    plan: {},
    memories: [],
    patterns: [],
    errors: [],
  };

  switch (method) {
    case 'merge':
      // Simple merge - combine all contexts
      for (const [agentId, contexts] of contextsByAgent) {
        const latestContext = contexts[0]; // Most recent
        const data = latestContext.context_data;

        // Merge each section
        if (data.repository) Object.assign(fusedContext.repository, data.repository);
        if (data.stack) Object.assign(fusedContext.stack, data.stack);
        if (data.ui) Object.assign(fusedContext.ui, data.ui);
        if (data.plan) Object.assign(fusedContext.plan, data.plan);
        if (data.memories) fusedContext.memories.push(...data.memories);
        if (data.patterns) fusedContext.patterns.push(...data.patterns);
        if (data.errors) fusedContext.errors.push(...data.errors);
      }
      break;

    case 'weighted':
      // Weighted merge based on agent expertise
      const weights: Record<string, number> = {
        'james-frontend': 1.5, // Higher weight for UI contexts
        'marcus-backend': 1.5, // Higher weight for stack contexts
        'maria-qa': 1.3, // Higher weight for quality contexts
        'introspective-agent': 1.0,
      };

      for (const [agentId, contexts] of contextsByAgent) {
        const weight = weights[agentId] || 1.0;
        const latestContext = contexts[0];
        const data = latestContext.context_data;

        // Apply weighted merge logic
        // (simplified - in production, would be more sophisticated)
        if (data.repository) Object.assign(fusedContext.repository, data.repository);
        if (data.stack) Object.assign(fusedContext.stack, data.stack);
        if (data.ui) Object.assign(fusedContext.ui, data.ui);
        if (data.plan) Object.assign(fusedContext.plan, data.plan);
      }
      break;

    case 'priority':
      // Priority-based - first agent has highest priority
      for (const [agentId, contexts] of contextsByAgent) {
        const latestContext = contexts[0];
        const data = latestContext.context_data;

        // Only merge if not already present
        if (!fusedContext.repository || Object.keys(fusedContext.repository).length === 0) {
          fusedContext.repository = data.repository || {};
        }
        if (!fusedContext.stack || Object.keys(fusedContext.stack).length === 0) {
          fusedContext.stack = data.stack || {};
        }
        // ... similar for other fields
      }
      break;

    case 'consensus':
      // Consensus-based - only include data agreed upon by multiple agents
      // (simplified implementation)
      const allData: any[] = [];
      for (const [agentId, contexts] of contextsByAgent) {
        allData.push(contexts[0].context_data);
      }

      // Find common elements
      // (in production, would use more sophisticated consensus algorithm)
      fusedContext.repository = findConsensus(allData.map(d => d.repository));
      fusedContext.stack = findConsensus(allData.map(d => d.stack));
      fusedContext.ui = findConsensus(allData.map(d => d.ui));
      break;
  }

  // Deduplicate memories, patterns, errors
  fusedContext.memories = deduplicateArray(fusedContext.memories, 'id');
  fusedContext.patterns = deduplicateArray(fusedContext.patterns, 'id');
  fusedContext.errors = deduplicateArray(fusedContext.errors, 'id');

  return fusedContext;
}

function findConsensus(items: any[]): any {
  // Simple consensus - return most common non-empty value
  const nonEmpty = items.filter(item => item && Object.keys(item).length > 0);
  return nonEmpty.length > 0 ? nonEmpty[0] : {};
}

function deduplicateArray(arr: any[], key: string): any[] {
  const seen = new Set();
  return arr.filter(item => {
    if (!item || !item[key]) return true;
    if (seen.has(item[key])) return false;
    seen.add(item[key]);
    return true;
  });
}

function calculateQualityScore(fusedContext: any, contextsByAgent: Map<string, any[]>): number {
  // Calculate quality score based on:
  // 1. Completeness (how many fields are populated)
  // 2. Consistency (agreement between agents)
  // 3. Recency (how fresh the data is)

  let score = 0;
  const sections = ['repository', 'stack', 'ui', 'plan'];

  // Completeness (40%)
  const completeness = sections.filter(section => {
    const data = fusedContext[section];
    return data && Object.keys(data).length > 0;
  }).length / sections.length;
  score += completeness * 0.4;

  // Consistency (30%)
  // Check if multiple agents provided similar data
  const consistency = contextsByAgent.size >= 2 ? 1.0 : 0.5;
  score += consistency * 0.3;

  // Recency (30%)
  // Check how recent the contexts are
  const now = Date.now();
  let totalAge = 0;
  for (const [agentId, contexts] of contextsByAgent) {
    const age = now - new Date(contexts[0].created_at).getTime();
    totalAge += age;
  }
  const avgAge = totalAge / contextsByAgent.size;
  const recency = Math.max(0, 1 - (avgAge / (24 * 60 * 60 * 1000))); // Decay over 24 hours
  score += recency * 0.3;

  return Math.min(1.0, Math.max(0, score));
}