/**
 * Vector Math Utilities
 * 
 * Core operations for embedding similarity and clustering
 */

/**
 * Calculate cosine similarity between two vectors
 * Returns value between -1 and 1 (1 = identical, 0 = orthogonal, -1 = opposite)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
        throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`);
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    if (magnitude === 0) return 0;

    return dotProduct / magnitude;
}

/**
 * Calculate Euclidean distance between two vectors
 */
export function euclideanDistance(a: number[], b: number[]): number {
    if (a.length !== b.length) {
        throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`);
    }

    let sum = 0;
    for (let i = 0; i < a.length; i++) {
        const diff = a[i] - b[i];
        sum += diff * diff;
    }

    return Math.sqrt(sum);
}

/**
 * Normalize a vector to unit length
 */
export function normalize(v: number[]): number[] {
    const magnitude = Math.sqrt(v.reduce((sum, val) => sum + val * val, 0));
    if (magnitude === 0) return v.map(() => 0);
    return v.map(val => val / magnitude);
}

/**
 * Calculate the centroid (average) of multiple vectors
 */
export function centroid(vectors: number[][]): number[] {
    if (vectors.length === 0) {
        throw new Error('Cannot calculate centroid of empty array');
    }

    const dim = vectors[0].length;
    const result = new Array(dim).fill(0);

    for (const v of vectors) {
        for (let i = 0; i < dim; i++) {
            result[i] += v[i];
        }
    }

    return result.map(val => val / vectors.length);
}

/**
 * Add two vectors element-wise
 */
export function add(a: number[], b: number[]): number[] {
    if (a.length !== b.length) {
        throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`);
    }
    return a.map((val, i) => val + b[i]);
}

/**
 * Subtract vector b from vector a element-wise
 */
export function subtract(a: number[], b: number[]): number[] {
    if (a.length !== b.length) {
        throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`);
    }
    return a.map((val, i) => val - b[i]);
}

/**
 * Scale a vector by a scalar
 */
export function scale(v: number[], scalar: number): number[] {
    return v.map(val => val * scalar);
}

/**
 * Calculate dot product of two vectors
 */
export function dot(a: number[], b: number[]): number {
    if (a.length !== b.length) {
        throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`);
    }
    return a.reduce((sum, val, i) => sum + val * b[i], 0);
}

/**
 * Calculate magnitude (L2 norm) of a vector
 */
export function magnitude(v: number[]): number {
    return Math.sqrt(v.reduce((sum, val) => sum + val * val, 0));
}

// ============================================================================
// Clustering Utilities
// ============================================================================

export interface ClusterResult {
    clusters: number[][];    // Array of clusters, each containing vector indices
    centroids: number[][];   // Centroid of each cluster
    assignments: number[];   // Cluster assignment for each vector
}

/**
 * K-means clustering
 * 
 * @param vectors Array of vectors to cluster
 * @param k Number of clusters
 * @param maxIterations Maximum iterations (default 100)
 * @returns Cluster assignments and centroids
 */
export function kMeansCluster(
    vectors: number[][],
    k: number,
    maxIterations: number = 100
): ClusterResult {
    if (vectors.length === 0) {
        return { clusters: [], centroids: [], assignments: [] };
    }

    if (k >= vectors.length) {
        // Each vector is its own cluster
        return {
            clusters: vectors.map((_, i) => [i]),
            centroids: vectors.map(v => [...v]),
            assignments: vectors.map((_, i) => i),
        };
    }

    const dim = vectors[0].length;

    // Initialize centroids with random vectors (k-means++)
    const centroids: number[][] = [];
    const usedIndices = new Set<number>();

    // First centroid: random
    const firstIdx = Math.floor(Math.random() * vectors.length);
    centroids.push([...vectors[firstIdx]]);
    usedIndices.add(firstIdx);

    // Remaining centroids: k-means++ initialization
    for (let c = 1; c < k; c++) {
        const distances = vectors.map((v, i) => {
            if (usedIndices.has(i)) return 0;
            // Distance to nearest existing centroid
            let minDist = Infinity;
            for (const cent of centroids) {
                const dist = euclideanDistance(v, cent);
                if (dist < minDist) minDist = dist;
            }
            return minDist * minDist; // Square for probability weighting
        });

        const totalDist = distances.reduce((a, b) => a + b, 0);
        let random = Math.random() * totalDist;

        for (let i = 0; i < distances.length; i++) {
            random -= distances[i];
            if (random <= 0 && !usedIndices.has(i)) {
                centroids.push([...vectors[i]]);
                usedIndices.add(i);
                break;
            }
        }
    }

    // Ensure we have k centroids
    while (centroids.length < k) {
        for (let i = 0; i < vectors.length; i++) {
            if (!usedIndices.has(i)) {
                centroids.push([...vectors[i]]);
                usedIndices.add(i);
                break;
            }
        }
    }

    let assignments = new Array(vectors.length).fill(0);

    // Iterate
    for (let iter = 0; iter < maxIterations; iter++) {
        // Assign each vector to nearest centroid
        const newAssignments = vectors.map(v => {
            let minDist = Infinity;
            let bestCluster = 0;
            for (let c = 0; c < k; c++) {
                const dist = euclideanDistance(v, centroids[c]);
                if (dist < minDist) {
                    minDist = dist;
                    bestCluster = c;
                }
            }
            return bestCluster;
        });

        // Check for convergence
        let changed = false;
        for (let i = 0; i < assignments.length; i++) {
            if (assignments[i] !== newAssignments[i]) {
                changed = true;
                break;
            }
        }

        assignments = newAssignments;

        if (!changed) break;

        // Update centroids
        for (let c = 0; c < k; c++) {
            const clusterVectors = vectors.filter((_, i) => assignments[i] === c);
            if (clusterVectors.length > 0) {
                centroids[c] = centroid(clusterVectors);
            }
        }
    }

    // Build final clusters
    const clusters: number[][] = Array.from({ length: k }, () => []);
    for (let i = 0; i < assignments.length; i++) {
        clusters[assignments[i]].push(i);
    }

    return { clusters, centroids, assignments };
}

/**
 * Find the most similar vectors to a query
 * 
 * @param query Query vector
 * @param vectors Array of vectors to search
 * @param topK Number of results to return
 * @returns Array of { index, similarity } sorted by similarity descending
 */
export function findMostSimilar(
    query: number[],
    vectors: number[][],
    topK: number = 10
): { index: number; similarity: number }[] {
    const similarities = vectors.map((v, index) => ({
        index,
        similarity: cosineSimilarity(query, v),
    }));

    return similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK);
}

/**
 * Calculate pairwise similarity matrix
 */
export function similarityMatrix(vectors: number[][]): number[][] {
    const n = vectors.length;
    const matrix: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));

    for (let i = 0; i < n; i++) {
        matrix[i][i] = 1; // Self-similarity
        for (let j = i + 1; j < n; j++) {
            const sim = cosineSimilarity(vectors[i], vectors[j]);
            matrix[i][j] = sim;
            matrix[j][i] = sim;
        }
    }

    return matrix;
}

