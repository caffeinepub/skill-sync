import { useState, useEffect } from 'react';
import { useInternetIdentity } from './useInternetIdentity';

export interface LocalSession {
  id: string;
  skill: string;
  partnerName: string;
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

const STORAGE_KEY = 'skillsync_sessions';

export function useLocalSessions() {
  const { identity } = useInternetIdentity();
  const [sessions, setSessions] = useState<LocalSession[]>([]);

  const getStorageKey = () => {
    if (!identity) return null;
    return `${STORAGE_KEY}_${identity.getPrincipal().toString()}`;
  };

  useEffect(() => {
    const key = getStorageKey();
    if (!key) {
      setSessions([]);
      return;
    }

    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        setSessions(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  }, [identity]);

  const addSession = (session: LocalSession) => {
    const key = getStorageKey();
    if (!key) return;

    const updated = [...sessions, session];
    setSessions(updated);
    try {
      localStorage.setItem(key, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  };

  const removeSession = (sessionId: string) => {
    const key = getStorageKey();
    if (!key) return;

    const updated = sessions.filter((s) => s.id !== sessionId);
    setSessions(updated);
    try {
      localStorage.setItem(key, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to remove session:', error);
    }
  };

  return {
    sessions,
    addSession,
    removeSession,
  };
}
