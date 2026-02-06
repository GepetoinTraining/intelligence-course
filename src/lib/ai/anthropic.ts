import Anthropic from '@anthropic-ai/sdk';

export interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export interface RunParams {
    model: string;
    systemPrompt?: string;
    messages: Message[];
    temperature?: number;
    maxTokens?: number;
}

export interface RunResult {
    output: string;
    inputTokens: number;
    outputTokens: number;
    latencyMs: number;
    error?: {
        code: string;
        message: string;
    };
}

/**
 * Create an Anthropic client with a user's API key
 */
export function createAnthropicClient(apiKey: string) {
    return new Anthropic({ apiKey });
}

/**
 * Run a prompt against Claude
 */
export async function runPrompt(
    apiKey: string,
    params: RunParams
): Promise<RunResult> {
    const client = createAnthropicClient(apiKey);
    const startTime = Date.now();

    try {
        const response = await client.messages.create({
            model: params.model,
            max_tokens: params.maxTokens ?? 4096,
            temperature: params.temperature ?? 0.7,
            system: params.systemPrompt,
            messages: params.messages.map((m) => ({
                role: m.role,
                content: m.content,
            })),
        });

        const latencyMs = Date.now() - startTime;

        // Extract text content from response
        const output = response.content
            .filter((block) => block.type === 'text')
            .map((block) => (block as { type: 'text'; text: string }).text)
            .join('\n');

        return {
            output,
            inputTokens: response.usage.input_tokens,
            outputTokens: response.usage.output_tokens,
            latencyMs,
        };
    } catch (error) {
        const latencyMs = Date.now() - startTime;

        // Handle Anthropic API errors
        if (error instanceof Anthropic.APIError) {
            return {
                output: '',
                inputTokens: 0,
                outputTokens: 0,
                latencyMs,
                error: {
                    code: error.status?.toString() ?? 'unknown',
                    message: error.message,
                },
            };
        }

        // Unknown error
        return {
            output: '',
            inputTokens: 0,
            outputTokens: 0,
            latencyMs,
            error: {
                code: 'unknown',
                message: error instanceof Error ? error.message : 'Unknown error',
            },
        };
    }
}

/**
 * Available Claude models (Feb 2026)
 */
export const CLAUDE_MODELS = [
    {
        id: 'claude-sonnet-4-5-20250929',
        name: 'Claude Sonnet 4.5',
        inputPrice: 3.0,
        outputPrice: 15.0,
        contextWindow: 200000,
    },
    {
        id: 'claude-haiku-4-5-20251001',
        name: 'Claude Haiku 4.5',
        inputPrice: 0.8,
        outputPrice: 4.0,
        contextWindow: 200000,
    },
    {
        id: 'claude-sonnet-4-20250514',
        name: 'Claude Sonnet 4',
        inputPrice: 3.0,
        outputPrice: 15.0,
        contextWindow: 200000,
    },
] as const;

export type ClaudeModelId = (typeof CLAUDE_MODELS)[number]['id'];

