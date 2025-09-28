// VERSATIL SDLC Framework - Store Memory Edge Function
// Stores agent memories with vector embeddings in Supabase

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StoreMemoryRequest {
  content: string;
  contentType: 'text' | 'code' | 'image' | 'diagram' | 'mixed';
  agentId: string;
  memoryType: 'code' | 'decision' | 'pattern' | 'error' | 'success' | 'learning';
  metadata?: Record<string, any>;
  tags?: string[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { content, contentType, agentId, memoryType, metadata = {}, tags = [] }: StoreMemoryRequest = await req.json();

    // Validate required fields
    if (!content || !agentId || !memoryType) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: content, agentId, memoryType' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate embedding using OpenAI
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
        input: content,
        dimensions: 1536,
      }),
    });

    if (!embeddingResponse.ok) {
      throw new Error(`OpenAI API error: ${await embeddingResponse.text()}`);
    }

    const embeddingData = await embeddingResponse.json();
    const embedding = embeddingData.data[0].embedding;

    // Store in Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data, error } = await supabase
      .from('versatil_memories')
      .insert({
        content,
        content_type: contentType,
        embedding,
        agent_id: agentId,
        memory_type: memoryType,
        metadata: {
          ...metadata,
          tags,
          timestamp: Date.now(),
        },
        relevance_score: 1.0,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        memoryId: data.id,
        message: 'Memory stored successfully',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error storing memory:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});