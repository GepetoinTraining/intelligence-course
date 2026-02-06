/**
 * Google Gemini Embedding Client
 * 
 * Uses text-embedding-004 model (768 dimensions)
 * Rate limit: 1500 RPM
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the client with API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY || '');

// Embedding model configuration
const EMBEDDING_MODEL = 'text-embedding-004';
const EMBEDDING_DIMENSION = 768;

// Rate limiting state
let requestCount = 0;
let resetTime = Date.now() + 60000;
const RATE_LIMIT = 1500; // requests per minute

// Simple in-memory cache
const embeddingCache = new Map<string, number[]>();
const CACHE_MAX_SIZE = 1000;

/**
 * Check and handle rate limiting
 */
function checkRateLimit(): void {
    const now = Date.now();

    // Reset counter if minute has passed
    if (now > resetTime) {
        requestCount = 0;
        resetTime = now + 60000;
    }

    if (requestCount >= RATE_LIMIT) {
        const waitTime = resetTime - now;
        throw new Error(`Rate limit exceeded. Wait ${waitTime}ms`);
    }

    requestCount++;
}

/**
 * Get cache key for text
 */
function getCacheKey(text: string): string {
    // Simple hash for cache key
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return `${EMBEDDING_MODEL}:${hash}`;
}

/**
 * Embed a single text string
 * 
 * @param text The text to embed
 * @returns 768-dimensional embedding vector
 */
export async function embed(text: string): Promise<number[]> {
    // Check cache first
    const cacheKey = getCacheKey(text);
    const cached = embeddingCache.get(cacheKey);
    if (cached) {
        return cached;
    }

    checkRateLimit();

    try {
        const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
        const result = await model.embedContent(text);

        const embedding = result.embedding.values;

        // Validate dimension
        if (embedding.length !== EMBEDDING_DIMENSION) {
            console.warn(`Unexpected embedding dimension: ${embedding.length}, expected ${EMBEDDING_DIMENSION}`);
        }

        // Cache the result
        if (embeddingCache.size >= CACHE_MAX_SIZE) {
            // Remove oldest entry (first key)
            const firstKey = embeddingCache.keys().next().value;
            if (firstKey) embeddingCache.delete(firstKey);
        }
        embeddingCache.set(cacheKey, embedding);

        return embedding;
    } catch (error) {
        console.error('Gemini embedding error:', error);
        throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Embed multiple texts in batch
 * 
 * @param texts Array of texts to embed
 * @returns Array of 768-dimensional embedding vectors
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
    // Process in parallel with concurrency limit
    const BATCH_SIZE = 10;
    const results: number[][] = [];

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
        const batch = texts.slice(i, i + BATCH_SIZE);
        const embeddings = await Promise.all(batch.map(text => embed(text)));
        results.push(...embeddings);
    }

    return results;
}

/**
 * Get embedding dimension (useful for validation)
 */
export function getEmbeddingDimension(): number {
    return EMBEDDING_DIMENSION;
}

/**
 * Clear the embedding cache
 */
export function clearCache(): void {
    embeddingCache.clear();
}

/**
 * Get current cache stats
 */
export function getCacheStats(): { size: number; maxSize: number } {
    return {
        size: embeddingCache.size,
        maxSize: CACHE_MAX_SIZE,
    };
}

/**
 * Get current rate limit stats
 */
export function getRateLimitStats(): {
    requestCount: number;
    limit: number;
    resetsIn: number
} {
    return {
        requestCount,
        limit: RATE_LIMIT,
        resetsIn: Math.max(0, resetTime - Date.now()),
    };
}

