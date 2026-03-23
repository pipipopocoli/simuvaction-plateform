import { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '../lib/api-client';
import { API_ENDPOINTS } from '../constants/api';
import type { ChatMessage } from '../types';

export function useMessages(roomId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMessages = useCallback(async (before?: string) => {
    try {
      setError(null);
      const url = before
        ? `${API_ENDPOINTS.chatMessages(roomId)}?before=${before}&limit=50`
        : `${API_ENDPOINTS.chatMessages(roomId)}?limit=50`;
      const data = await apiFetch<ChatMessage[]>(url);

      if (before) {
        setMessages(prev => [...prev, ...data]);
      } else {
        setMessages(data);
      }

      setHasMore(data.length === 50);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  const sendMessage = useCallback(async (content: string, replyToId?: string) => {
    const body: Record<string, unknown> = { body: content };
    if (replyToId) body.replyToId = replyToId;

    const message = await apiFetch<ChatMessage>(API_ENDPOINTS.chatMessages(roomId), {
      method: 'POST',
      body,
    });

    setMessages(prev => [message, ...prev]);
    return message;
  }, [roomId]);

  const loadMore = useCallback(() => {
    if (!hasMore || loading || messages.length === 0) return;
    const oldest = messages[messages.length - 1];
    fetchMessages(oldest.id);
  }, [hasMore, loading, messages, fetchMessages]);

  // Poll for new messages every 3 seconds
  useEffect(() => {
    fetchMessages();

    pollingRef.current = setInterval(async () => {
      try {
        const data = await apiFetch<ChatMessage[]>(
          `${API_ENDPOINTS.chatMessages(roomId)}?limit=20`
        );
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const newMessages = data.filter(m => !existingIds.has(m.id));
          if (newMessages.length > 0) {
            return [...newMessages, ...prev];
          }
          return prev;
        });
      } catch {
        // Silently fail on poll errors
      }
    }, 3000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [roomId, fetchMessages]);

  return { messages, loading, error, hasMore, sendMessage, loadMore, refresh: () => fetchMessages() };
}
