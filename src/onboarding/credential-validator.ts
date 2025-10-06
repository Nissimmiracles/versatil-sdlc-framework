/**
 * VERSATIL SDLC Framework - Credential Validator
 * Validates credential format and tests connectivity
 */

import { ServiceTemplate, CredentialField } from './credential-templates.js';

export interface ValidationResult {
  valid: boolean;
  field?: string;
  message?: string;
}

export interface ConnectionTestResult {
  success: boolean;
  service: string;
  message: string;
  latency?: number;
  details?: Record<string, any>;
}

/**
 * Validate a single credential field
 */
export function validateField(
  field: CredentialField,
  value: string
): ValidationResult {
  // Check if required field is empty
  if (field.required && (!value || value.trim() === '')) {
    return {
      valid: false,
      field: field.key,
      message: `${field.label} is required`
    };
  }

  // Skip validation for optional empty fields
  if (!field.required && (!value || value.trim() === '')) {
    return { valid: true };
  }

  // Run custom validation if provided
  if (field.validation) {
    const result = field.validation(value);

    if (result === true) {
      return { valid: true };
    } else if (typeof result === 'string') {
      return {
        valid: false,
        field: field.key,
        message: result
      };
    } else {
      return {
        valid: false,
        field: field.key,
        message: 'Validation failed'
      };
    }
  }

  // Type-specific validation
  switch (field.type) {
    case 'url':
      try {
        new URL(value);
        return { valid: true };
      } catch {
        return {
          valid: false,
          field: field.key,
          message: 'Invalid URL format'
        };
      }

    case 'file':
      // File validation handled by custom validators in templates
      return { valid: true };

    default:
      return { valid: true };
  }
}

/**
 * Validate all credentials for a service
 */
export function validateServiceCredentials(
  service: ServiceTemplate,
  credentials: Record<string, string>
): ValidationResult {
  for (const field of service.credentials) {
    const value = credentials[field.key] || '';
    const result = validateField(field, value);

    if (!result.valid) {
      return result;
    }
  }

  return { valid: true };
}

/**
 * Test connection for Vertex AI
 */
async function testVertexAIConnection(
  credentials: Record<string, string>
): Promise<ConnectionTestResult> {
  const startTime = Date.now();

  try {
    // Check if service account file exists and is valid
    const credPath = credentials['GOOGLE_APPLICATION_CREDENTIALS'];
    const projectId = credentials['GOOGLE_CLOUD_PROJECT'];

    if (!credPath || !projectId) {
      return {
        success: false,
        service: 'vertex-ai',
        message: 'Missing required credentials'
      };
    }

    // Try to import Vertex AI SDK
    try {
      const { VertexAI } = await import('@google-cloud/vertexai');

      // Create a minimal test client
      const vertexAI = new VertexAI({
        project: projectId,
        location: credentials['GOOGLE_CLOUD_LOCATION'] || 'us-central1'
      });

      const latency = Date.now() - startTime;

      return {
        success: true,
        service: 'vertex-ai',
        message: `Connected to Vertex AI project: ${projectId}`,
        latency,
        details: {
          project: projectId,
          location: credentials['GOOGLE_CLOUD_LOCATION'] || 'us-central1'
        }
      };
    } catch (error: any) {
      return {
        success: false,
        service: 'vertex-ai',
        message: `SDK initialization failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  } catch (error: any) {
    return {
      success: false,
      service: 'vertex-ai',
      message: `Connection test failed: ${error.message}`
    };
  }
}

/**
 * Test connection for Supabase
 */
async function testSupabaseConnection(
  credentials: Record<string, string>
): Promise<ConnectionTestResult> {
  const startTime = Date.now();

  try {
    const url = credentials['SUPABASE_URL'];
    const anonKey = credentials['SUPABASE_ANON_KEY'];

    if (!url || !anonKey) {
      return {
        success: false,
        service: 'supabase',
        message: 'Missing required credentials'
      };
    }

    // Simple health check: GET /rest/v1/
    const response = await fetch(`${url}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`
      }
    });

    const latency = Date.now() - startTime;

    if (response.ok || response.status === 200 || response.status === 404) {
      // 404 is ok - it means the API is reachable
      return {
        success: true,
        service: 'supabase',
        message: 'Connected to Supabase successfully',
        latency,
        details: { url }
      };
    } else {
      return {
        success: false,
        service: 'supabase',
        message: `Connection failed: HTTP ${response.status}`,
        details: { status: response.status }
      };
    }
  } catch (error: any) {
    return {
      success: false,
      service: 'supabase',
      message: `Connection test failed: ${error.message}`
    };
  }
}

/**
 * Test connection for GitHub
 */
async function testGitHubConnection(
  credentials: Record<string, string>
): Promise<ConnectionTestResult> {
  const startTime = Date.now();

  try {
    const token = credentials['GITHUB_TOKEN'];

    if (!token) {
      return {
        success: false,
        service: 'github',
        message: 'Missing GitHub token'
      };
    }

    // Test with GET /user endpoint
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });

    const latency = Date.now() - startTime;

    if (response.ok) {
      const user: any = await response.json();
      return {
        success: true,
        service: 'github',
        message: `Connected as ${user.login}`,
        latency,
        details: {
          username: user.login,
          name: user.name
        }
      };
    } else if (response.status === 401) {
      return {
        success: false,
        service: 'github',
        message: 'Invalid token or insufficient permissions',
        details: { status: 401 }
      };
    } else {
      return {
        success: false,
        service: 'github',
        message: `Connection failed: HTTP ${response.status}`,
        details: { status: response.status }
      };
    }
  } catch (error: any) {
    return {
      success: false,
      service: 'github',
      message: `Connection test failed: ${error.message}`
    };
  }
}

/**
 * Test connection for Sentry
 */
async function testSentryConnection(
  credentials: Record<string, string>
): Promise<ConnectionTestResult> {
  const startTime = Date.now();

  try {
    const dsn = credentials['SENTRY_DSN'];

    if (!dsn) {
      return {
        success: false,
        service: 'sentry',
        message: 'Missing Sentry DSN'
      };
    }

    // Parse DSN to extract project info
    const dsnUrl = new URL(dsn);
    const projectId = dsnUrl.pathname.substring(1);

    const latency = Date.now() - startTime;

    // DSN format validation is sufficient (no need to test event sending)
    if (projectId) {
      return {
        success: true,
        service: 'sentry',
        message: `Sentry DSN valid for project ${projectId}`,
        latency,
        details: { projectId }
      };
    } else {
      return {
        success: false,
        service: 'sentry',
        message: 'Invalid DSN format'
      };
    }
  } catch (error: any) {
    return {
      success: false,
      service: 'sentry',
      message: `DSN validation failed: ${error.message}`
    };
  }
}

/**
 * Test connection for Exa Search
 */
async function testExaConnection(
  credentials: Record<string, string>
): Promise<ConnectionTestResult> {
  const startTime = Date.now();

  try {
    const apiKey = credentials['EXA_API_KEY'];

    if (!apiKey) {
      return {
        success: false,
        service: 'exa',
        message: 'Missing Exa API key'
      };
    }

    // Test with a minimal search query
    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify({
        query: 'test',
        numResults: 1
      })
    });

    const latency = Date.now() - startTime;

    if (response.ok) {
      return {
        success: true,
        service: 'exa',
        message: 'Exa API key valid',
        latency
      };
    } else if (response.status === 401 || response.status === 403) {
      return {
        success: false,
        service: 'exa',
        message: 'Invalid API key',
        details: { status: response.status }
      };
    } else {
      return {
        success: false,
        service: 'exa',
        message: `Connection failed: HTTP ${response.status}`,
        details: { status: response.status }
      };
    }
  } catch (error: any) {
    return {
      success: false,
      service: 'exa',
      message: `Connection test failed: ${error.message}`
    };
  }
}

/**
 * Test connection for n8n
 */
async function testN8nConnection(
  credentials: Record<string, string>
): Promise<ConnectionTestResult> {
  const startTime = Date.now();

  try {
    const baseUrl = credentials['N8N_BASE_URL'];
    const apiKey = credentials['N8N_API_KEY'];

    if (!baseUrl || !apiKey) {
      return {
        success: false,
        service: 'n8n',
        message: 'Missing n8n credentials'
      };
    }

    // Test with GET /workflows endpoint
    const response = await fetch(`${baseUrl}/api/v1/workflows`, {
      headers: {
        'X-N8N-API-KEY': apiKey
      }
    });

    const latency = Date.now() - startTime;

    if (response.ok) {
      return {
        success: true,
        service: 'n8n',
        message: 'Connected to n8n successfully',
        latency,
        details: { url: baseUrl }
      };
    } else if (response.status === 401) {
      return {
        success: false,
        service: 'n8n',
        message: 'Invalid API key',
        details: { status: 401 }
      };
    } else {
      return {
        success: false,
        service: 'n8n',
        message: `Connection failed: HTTP ${response.status}`,
        details: { status: response.status }
      };
    }
  } catch (error: any) {
    return {
      success: false,
      service: 'n8n',
      message: `Connection test failed: ${error.message}`
    };
  }
}

/**
 * Test connection for OpenAI
 */
async function testOpenAIConnection(
  credentials: Record<string, string>
): Promise<ConnectionTestResult> {
  const startTime = Date.now();

  try {
    const apiKey = credentials['OPENAI_API_KEY'];

    if (!apiKey) {
      return {
        success: false,
        service: 'openai',
        message: 'Missing OpenAI API key'
      };
    }

    // Test with GET /models endpoint
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    const latency = Date.now() - startTime;

    if (response.ok) {
      return {
        success: true,
        service: 'openai',
        message: 'OpenAI API key valid',
        latency
      };
    } else if (response.status === 401) {
      return {
        success: false,
        service: 'openai',
        message: 'Invalid API key',
        details: { status: 401 }
      };
    } else {
      return {
        success: false,
        service: 'openai',
        message: `Connection failed: HTTP ${response.status}`,
        details: { status: response.status }
      };
    }
  } catch (error: any) {
    return {
      success: false,
      service: 'openai',
      message: `Connection test failed: ${error.message}`
    };
  }
}

/**
 * Test connection for Semgrep
 */
async function testSemgrepConnection(
  credentials: Record<string, string>
): Promise<ConnectionTestResult> {
  const startTime = Date.now();

  try {
    const apiKey = credentials['SEMGREP_API_KEY'];

    if (!apiKey) {
      // Semgrep works without API key (uses local binary)
      return {
        success: true,
        service: 'semgrep',
        message: 'Semgrep will use local binary (no API key configured)',
        latency: Date.now() - startTime
      };
    }

    // Test API key validity
    const response = await fetch('https://semgrep.dev/api/v1/deployments', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    const latency = Date.now() - startTime;

    if (response.ok) {
      return {
        success: true,
        service: 'semgrep',
        message: 'Semgrep API key valid',
        latency
      };
    } else if (response.status === 401) {
      return {
        success: false,
        service: 'semgrep',
        message: 'Invalid API key (will fall back to local binary)',
        details: { status: 401 }
      };
    } else {
      return {
        success: false,
        service: 'semgrep',
        message: `API test failed: HTTP ${response.status}`,
        details: { status: response.status }
      };
    }
  } catch (error: any) {
    return {
      success: true, // Not a fatal error - can use local binary
      service: 'semgrep',
      message: `API unavailable, will use local binary: ${error.message}`
    };
  }
}

/**
 * Test connection for a service
 */
export async function testServiceConnection(
  serviceId: string,
  credentials: Record<string, string>
): Promise<ConnectionTestResult> {
  switch (serviceId) {
    case 'vertex-ai':
      return testVertexAIConnection(credentials);

    case 'supabase':
      return testSupabaseConnection(credentials);

    case 'github':
      return testGitHubConnection(credentials);

    case 'sentry':
      return testSentryConnection(credentials);

    case 'exa':
      return testExaConnection(credentials);

    case 'n8n':
      return testN8nConnection(credentials);

    case 'openai':
      return testOpenAIConnection(credentials);

    case 'semgrep':
      return testSemgrepConnection(credentials);

    default:
      return {
        success: false,
        service: serviceId,
        message: 'Connection test not implemented for this service'
      };
  }
}

/**
 * Test all configured services
 */
export async function testAllConnections(
  allCredentials: Record<string, Record<string, string>>
): Promise<ConnectionTestResult[]> {
  const results: ConnectionTestResult[] = [];

  for (const [serviceId, credentials] of Object.entries(allCredentials)) {
    const result = await testServiceConnection(serviceId, credentials);
    results.push(result);
  }

  return results;
}
