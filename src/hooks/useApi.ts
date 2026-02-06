'use client';

import { useState, useEffect, useCallback } from 'react';

interface UseApiOptions<T> {
    immediate?: boolean; // Fetch immediately on mount (default: true)
    initialData?: T;
}

interface UseApiResult<T> {
    data: T | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    mutate: (newData: T | null) => void;
}

/**
 * Generic hook for fetching data from API endpoints
 * Usage: const { data, isLoading, error, refetch } = useApi<Campaign[]>('/api/campaigns');
 */
export function useApi<T>(
    endpoint: string,
    options: UseApiOptions<T> = {}
): UseApiResult<T> {
    const { immediate = true, initialData = null } = options;
    const [data, setData] = useState<T | null>(initialData);
    const [isLoading, setIsLoading] = useState(immediate);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(endpoint);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            setData(result.data ?? result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setIsLoading(false);
        }
    }, [endpoint]);

    useEffect(() => {
        if (immediate) {
            fetchData();
        }
    }, [immediate, fetchData]);

    return {
        data,
        isLoading,
        error,
        refetch: fetchData,
        mutate: setData,
    };
}

/**
 * Hook for creating new items via POST
 */
export function useCreate<TInput, TOutput = TInput>(endpoint: string) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const create = async (data: TInput): Promise<TOutput | null> => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            const result = await response.json();
            return result.data ?? result;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            setError(message);
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    return { create, isLoading, error };
}

/**
 * Hook for updating items via PATCH
 */
export function useUpdate<TInput, TOutput = TInput>(endpoint: string) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const update = async (id: string, data: Partial<TInput>): Promise<TOutput | null> => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${endpoint}/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            const result = await response.json();
            return result.data ?? result;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            setError(message);
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    return { update, isLoading, error };
}

/**
 * Hook for deleting items
 */
export function useDelete(endpoint: string) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const remove = async (id: string): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${endpoint}/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            return true;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            setError(message);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    return { remove, isLoading, error };
}

