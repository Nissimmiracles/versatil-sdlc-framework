// VERSATIL SDLC Framework - Query Memories Edge Function
// Performs semantic search on stored memories

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QueryMemoriesRequest {
  query: string;
  queryType?: 'semantic' | 'hybrid' | 'text';
  agentId?: string;
  memoryType?: string;
  topK?: number;
  threshold?: number;
  rerank?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const {
      query,
      queryType = 'semantic',
      agentId,
      memoryType,
      topK = 10,
      threshold = 0.7,
      rerank = false,
    }: QueryMemoriesRequest = await req.json();

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let results;

    if (queryType === 'text') {
      // Text-only search
      let queryBuilder = supabase
        .from('versatil_memories')
        .select('*')
        .textSearch('content', query)
        .limit(topK);

      if (agentId) queryBuilder = queryBuilder.eq('agent_id', agentId);
      if (memoryType) queryBuilder = queryBuilder.eq('memory_type', memoryType);

      const { data, error } = await queryBuilder;
      if (error) throw error;
      results = data;

    } else {
      // Semantic or hybrid search - generate embedding
      const openaiKey = Deno.env.get('OPENAI_API_KEY');
      if (!openaiKey) {
        throw new Error('OPENAI_API_KEY not configured');
      }

      const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: query,
          dimensions: 1536,
        }),
      });

      if (!embeddingResponse.ok) {
        throw new Error(`OpenAI API error: ${await embeddingResponse.text()}`);
      }

      const embeddingData = await embeddingResponse.json();
      const queryEmbedding = embeddingData.data[0].embedding;

      if (queryType === 'hybrid') {
        // Hybrid search using custom function
        const { data, error } = await supabase.rpc('hybrid_search_memories', {
          query_text: query,
          query_embedding: queryEmbedding,
          match_count: topK,
        });

        if (error) throw error;
        results = data;

      } else {
        // Semantic search using custom function
        const { data, error } = await supabase.rpc('search_memories', {
          query_embedding: queryEmbedding,
          match_threshold: threshold,
          match_count: topK,
          filter_agent_id: agentId || null,
          filter_memory_type: memoryType || null,
        });

        if (error) throw error;
        results = data;
      }
    }

    // Apply reranking if requested
    if (rerank && results.length > 0) {
      results = applyReranking(results, query);
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
        count: results.length,
        queryType,
        reranked: rerank,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error querying memories:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function applyReranking(results: any[], query: string) {
  // Simple reranking based on recency and relevance
  const now = Date.now();

  return results.map(result => {
    const age = now - new Date(result.created_at).getTime();
    const dayInMs = 24 * 60 * 60 * 1000;

    // Recency score (decays over time)
    let recencyScore = 1.0;
    if (age < dayInMs) recencyScore = 1.0;
    else if (age < 7 * dayInMs) recencyScore = 0.8;
    else if (age < 30 * dayInMs) recencyScore = 0.6;
    else recencyScore = 0.4;

    // Combined score
    const relevanceScore = result.similarity || 1.0;
    result.combined_score = (0.7 * relevanceScore) + (0.3 * recencyScore);

    return result;
  }).sort((a, b) => b.combined_score - a.combined_score);
}