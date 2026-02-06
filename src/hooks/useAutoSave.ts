'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useDebouncedCallback } from '@mantine/hooks';

type DraftType = 'wiki_article' | 'anunciacao' | 'procedure' | 'sop' | 'other';

interface UseAutoSaveOptions {
    /** Debounce time in ms before saving (default: 2000) */
    debounceMs?: number;
    /** Whether auto-save is enabled (default: true) */
    enabled?: boolean;
    /** Callback when save succeeds */
    onSave?: () => void;
    /** Callback when save fails */
    onError?: (error: Error) => void;
}

interface UseAutoSaveReturn<T> {
    /** The current content state */
    content: T;
    /** Update the content (triggers debounced save) */
    setContent: (value: T | ((prev: T) => T)) => void;
    /** Whether a save is in progress */
    isSaving: boolean;
    /** Last save timestamp */
    lastSaved: Date | null;
    /** Whether content has unsaved changes */
    isDirty: boolean;
    /** Whether initial load is in progress */
    isLoading: boolean;
    /** Force an immediate save */
    saveNow: () => Promise<void>;
    /** Clear the draft (e.g., after publishing) */
    clearDraft: () => Promise<void>;
}

/**
 * useAutoSave - Debounced auto-save hook with localStorage fallback
 * 
 * Saves to localStorage immediately for offline resilience,
 * then syncs to API for server backup.
 * 
 * @param type - The draft type (wiki_article, anunciacao, etc.)
 * @param referenceId - The ID of the parent item (team_id, article_id, etc.)
 * @param initialContent - Initial content state
 * @param options - Configuration options
 */
export function useAutoSave<T extends Record<string, any>>(
    type: DraftType,
    referenceId: string,
    initialContent: T,
    options: UseAutoSaveOptions = {}
): UseAutoSaveReturn<T> {
    const {
        debounceMs = 2000,
        enabled = true,
        onSave,
        onError,
    } = options;

    const localStorageKey = `draft:${type}:${referenceId}`;

    const [content, setContentInternal] = useState<T>(initialContent);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isDirty, setIsDirty] = useState(false);

    const contentRef = useRef(content);
    contentRef.current = content;

    // Load draft on mount
    useEffect(() => {
        const loadDraft = async () => {
            try {
                // First check localStorage (instant)
                const localDraft = localStorage.getItem(localStorageKey);
                if (localDraft) {
                    const parsed = JSON.parse(localDraft);
                    setContentInternal(parsed);
                    setIsLoading(false);
                    return;
                }

                // Then check server
                const response = await fetch(`/api/drafts/${type}/${referenceId}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.draft?.content) {
                        setContentInternal(data.draft.content);
                        // Also save to localStorage for next time
                        localStorage.setItem(localStorageKey, JSON.stringify(data.draft.content));
                    }
                }
            } catch (error) {
                console.error('Error loading draft:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadDraft();
    }, [type, referenceId, localStorageKey]);

    // Save to API
    const saveToApi = useCallback(async (contentToSave: T) => {
        if (!enabled) return;

        setIsSaving(true);
        try {
            const response = await fetch(`/api/drafts/${type}/${referenceId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: contentToSave }),
            });

            if (!response.ok) {
                throw new Error('Failed to save draft');
            }

            setLastSaved(new Date());
            setIsDirty(false);
            onSave?.();
        } catch (error) {
            console.error('Auto-save error:', error);
            onError?.(error instanceof Error ? error : new Error('Save failed'));
        } finally {
            setIsSaving(false);
        }
    }, [type, referenceId, enabled, onSave, onError]);

    // Debounced save
    const debouncedSave = useDebouncedCallback(saveToApi, debounceMs);

    // Set content and trigger saves
    const setContent = useCallback((value: T | ((prev: T) => T)) => {
        setContentInternal(prev => {
            const newValue = typeof value === 'function' ? (value as (prev: T) => T)(prev) : value;

            // Immediate localStorage save
            if (enabled) {
                localStorage.setItem(localStorageKey, JSON.stringify(newValue));
                setIsDirty(true);
                // Debounced API save
                debouncedSave(newValue);
            }

            return newValue;
        });
    }, [enabled, localStorageKey, debouncedSave]);

    // Force immediate save
    const saveNow = useCallback(async () => {
        debouncedSave.cancel();
        await saveToApi(contentRef.current);
    }, [debouncedSave, saveToApi]);

    // Clear draft (e.g., after publishing)
    const clearDraft = useCallback(async () => {
        localStorage.removeItem(localStorageKey);

        try {
            await fetch(`/api/drafts/${type}/${referenceId}`, {
                method: 'DELETE',
            });
        } catch (error) {
            console.error('Error clearing draft:', error);
        }

        setIsDirty(false);
        setLastSaved(null);
    }, [type, referenceId, localStorageKey]);

    // Warn before leaving with unsaved changes
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    return {
        content,
        setContent,
        isSaving,
        lastSaved,
        isDirty,
        isLoading,
        saveNow,
        clearDraft,
    };
}

export default useAutoSave;
