

export type ProviderId =
  | 'anthropic'
  | 'openai'
  | 'groq'
  | 'openrouter'
  | 'ollama'
  | 'none';

interface ProviderSpec {
  id: ProviderId;
  label: string;
  envKey: string | null;
  endpoint: string;
  defaultModel: string;
  /** 'anthropic' has its own request shape; everyone else is OpenAI-compatible. */
  dialect: 'anthropic' | 'openai';
}

const PROVIDERS: Record<Exclude<ProviderId, 'none'>, ProviderSpec> = {
  anthropic: {
    id: 'anthropic',
    label: 'Anthropic Claude',
    envKey: 'ANTHROPIC_API_KEY',
    endpoint: 'https://api.anthropic.com/v1/messages',
    defaultModel: 'claude-haiku-4-5-20251001',
    dialect: 'anthropic',
  },
  openai: {
    id: 'openai',
    label: 'OpenAI',
    envKey: 'OPENAI_API_KEY',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    defaultModel: 'gpt-4o-mini',
    dialect: 'openai',
  },
  groq: {
    id: 'groq',
    label: 'Groq',
    envKey: 'GROQ_API_KEY',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    defaultModel: 'llama-3.3-70b-versatile',
    dialect: 'openai',
  },
  openrouter: {
    id: 'openrouter',
    label: 'OpenRouter',
    envKey: 'OPENROUTER_API_KEY',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    defaultModel: 'meta-llama/llama-3.3-70b-instruct',
    dialect: 'openai',
  },
  ollama: {
    id: 'ollama',
    label: 'Ollama (local)',
    envKey: null, // runs locally, no API key
    // Resolved lazily in getEndpoint() so OLLAMA_HOST is read after env loading.
    endpoint: '/v1/chat/completions',
    defaultModel: 'llama3.2',
    dialect: 'openai',
  },
};

/**
 * Read an API key defensively: pasted keys frequently carry surrounding
 * whitespace, newlines or stray quotes, which would otherwise be sent inside
 * an auth header and produce a confusing 401.
 */
function readKey(name: string): string {
  return (process.env[name] || '').trim().replace(/^["']|["']$/g, '');
}

function getEndpoint(spec: ProviderSpec): string {
  if (spec.id === 'ollama') {
    return (process.env.OLLAMA_HOST || 'http://localhost:11434') + spec.endpoint;
  }
  return spec.endpoint;
}

/**
 * Resolve the active provider.
 * Explicit AI_PROVIDER wins; otherwise we auto-detect the first key present.
 */
function resolveProvider(): ProviderSpec | null {
  const explicit = (process.env.AI_PROVIDER || '').trim().toLowerCase();

  if (explicit && explicit !== 'none') {
    const spec = PROVIDERS[explicit as Exclude<ProviderId, 'none'>];
    if (!spec) {
      console.warn(
        `[CityVerse AI] Unknown AI_PROVIDER "${explicit}". ` +
          `Valid: ${Object.keys(PROVIDERS).join(', ')}, none.`,
      );
      return null;
    }
    if (spec.envKey && !readKey(spec.envKey)) {
      console.warn(
        `[CityVerse AI] AI_PROVIDER="${explicit}" but ${spec.envKey} is not set. ` +
          `Using offline briefing engine.`,
      );
      return null;
    }
    return spec;
  }

  if (explicit === 'none') return null;

  // Auto-detect: first provider whose key is present.
  const order: Exclude<ProviderId, 'none'>[] = [
    'anthropic',
    'openai',
    'groq',
    'openrouter',
  ];
  for (const id of order) {
    const spec = PROVIDERS[id];
    if (spec.envKey && readKey(spec.envKey)) return spec;
  }

  return null;
}

/**
 * Resolved lazily on first use (then cached) so that environment loading order
 * can never affect detection.
 */
let cached: { spec: ProviderSpec | null } | null = null;

function getActiveProvider(): ProviderSpec | null {
  if (!cached) cached = { spec: resolveProvider() };
  return cached.spec;
}

/** Model actually in use (env override wins over the provider default). */
export function getActiveModel(): string {
  const spec = getActiveProvider();
  if (!spec) return 'offline-briefing-engine';
  return process.env.AI_MODEL || spec.defaultModel;
}

/** Human-readable info for the /api/ai/info endpoint and the Settings screen. */
export function getProviderInfo() {
  const spec = getActiveProvider();
  return {
    provider: spec ? spec.id : ('none' as ProviderId),
    label: spec ? spec.label : 'Offline Briefing Engine',
    model: getActiveModel(),
    live: Boolean(spec),
  };
}

export function isAiEnabled(): boolean {
  return Boolean(getActiveProvider());
}

/** Strip markdown fences / prose and isolate the JSON object in a model reply. */
function extractJson(raw: string): string {
  let text = raw.trim();
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();

  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    return text.slice(start, end + 1);
  }
  return text;
}

/**
 * Send a prompt to the configured provider and parse the JSON briefing.
 * Returns null on any failure so the caller can fall back gracefully.
 */
export async function generateBriefing(
  prompt: string,
  systemPrompt: string,
): Promise<unknown | null> {
  const spec = getActiveProvider();
  if (!spec) return null;

  const model = getActiveModel();
  const timeoutMs = Number(process.env.AI_TIMEOUT_MS || 20000);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let headers: Record<string, string>;
    let body: Record<string, unknown>;

    if (spec.dialect === 'anthropic') {
      headers = {
        'Content-Type': 'application/json',
        'x-api-key': readKey(spec.envKey!),
        'anthropic-version': '2023-06-01',
      };
      body = {
        model,
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
      };
    } else {
      headers = { 'Content-Type': 'application/json' };
      if (spec.envKey && readKey(spec.envKey)) {
        headers.Authorization = `Bearer ${readKey(spec.envKey)}`;
      }
      body = {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: 0.4,
        response_format: { type: 'json_object' },
      };
    }

    const response = await fetch(getEndpoint(spec), {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      console.error(
        `[CityVerse AI] ${spec.label} responded ${response.status}. ${detail.slice(0, 300)}`,
      );
      return null;
    }

    const data = (await response.json()) as any;

    const rawText =
      spec.dialect === 'anthropic'
        ? (data?.content ?? [])
            .filter((block: any) => block?.type === 'text')
            .map((block: any) => block.text)
            .join('\n')
        : data?.choices?.[0]?.message?.content ?? '';

    if (!rawText) {
      console.error('[CityVerse AI] Empty response from provider.');
      return null;
    }

    return JSON.parse(extractJson(rawText));
  } catch (err) {
    const reason =
      err instanceof Error && err.name === 'AbortError'
        ? `timed out after ${timeoutMs}ms`
        : String(err);
    console.error(`[CityVerse AI] AI request failed (${reason}). Using offline briefing.`);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Logged once at boot so it's obvious which engine is live during a demo. */
export function logProviderStatus() {
  const info = getProviderInfo();
  if (info.live) {
    console.log(`[CityVerse AI] AI engine: ${info.label} (${info.model})`);
  } else {
    console.log(
      '[CityVerse AI] AI engine: offline briefing engine (no API key configured).',
    );
    console.log(
      '[CityVerse AI] For live AI, add a free Groq key to .env.local: https://console.groq.com/keys',
    );
  }
}
