import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../lib/api-client';
import { API_ENDPOINTS } from '../constants/api';
import type { ChatRoom } from '../types';

export function useChatRooms() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRooms = useCallback(async () => {
    try {
      setError(null);
      const data = await apiFetch<ChatRoom[]>(API_ENDPOINTS.chatRooms);
      setRooms(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rooms');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  return { rooms, loading, error, refresh: fetchRooms };
}
