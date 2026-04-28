import { useState, useEffect, useCallback } from 'react';
import { ChatMessage, ChatSessionSummary } from '@/types/chat';

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: "Hi, I'm Luna. I'm here to help you understand your cycle and feel supported. What's on your mind today?",
  timestamp: new Date()
};

export function useChat() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [contextPill, setContextPill] = useState<string>('');
  const [loggedToday, setLoggedToday] = useState<boolean>(true);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  // ─── Fetch sessions list ───
  const fetchSessions = useCallback(async () => {
    try {
      setSessionsLoading(true);
      const res = await fetch('/api/chat/sessions');
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (err) {
      console.error('Failed to fetch sessions', err);
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  // ─── Fetch suggestions/context pill ───
  useEffect(() => {
    const fetchContext = async () => {
      try {
        const res = await fetch('/api/chat/suggestions');
        const data = await res.json();
        if (data.suggestions) setSuggestions(data.suggestions);
        if (data.contextPill) setContextPill(data.contextPill);
        if (typeof data.loggedToday === 'boolean') setLoggedToday(data.loggedToday);
      } catch (err) {
        console.error('Failed to fetch context', err);
      }
    };
    fetchContext();
  }, []);

  // ─── Load sessions on mount ───
  useEffect(() => {
    queueMicrotask(() => fetchSessions());
  }, [fetchSessions]);

  const refreshContext = async () => {
    try {
      const res = await fetch('/api/chat/suggestions');
      const data = await res.json();
      if (data.suggestions) setSuggestions(data.suggestions);
      if (data.contextPill) setContextPill(data.contextPill);
      if (typeof data.loggedToday === 'boolean') setLoggedToday(data.loggedToday);
    } catch (err) {
      console.error('Failed to refresh context', err);
    }
  };

  // ─── Load a past session ───
  const loadSession = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch(`/api/chat/sessions/${id}/messages`);
      if (!res.ok) throw new Error('Failed to load session');
      const data = await res.json();

      const loaded: ChatMessage[] = (data.messages || []).map((m: { id: string; role: string; content: string; is_crisis: boolean; created_at: string }) => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: new Date(m.created_at),
        isCrisis: m.is_crisis
      }));

      setSessionId(id);
      setMessages(loaded.length > 0 ? loaded : [WELCOME_MESSAGE]);
    } catch (err) {
      console.error('Failed to load session', err);
      setError('Could not load this conversation.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Start a brand new chat ───
  const newChat = () => {
    setSessionId(null);
    setMessages([WELCOME_MESSAGE]);
    setError(null);
  };

  // ─── Clear/delete the current session ───
  const clearHistory = async () => {
    if (sessionId) {
      try {
        await fetch(`/api/chat/sessions?id=${sessionId}`, { method: 'DELETE' });
        fetchSessions();
      } catch (err) {
        console.error('Failed to delete session', err);
      }
    }
    newChat();
  };

  // ─── Delete a specific session from sidebar ───
  const deleteSession = async (id: string) => {
    try {
      await fetch(`/api/chat/sessions?id=${id}`, { method: 'DELETE' });
      setSessions(prev => prev.filter(s => s.id !== id));
      if (sessionId === id) newChat();
    } catch (err) {
      console.error('Failed to delete session', err);
    }
  };

  // ─── Send a message ───
  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMsgId = crypto.randomUUID();
    const assistantMsgId = crypto.randomUUID();

    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content,
      timestamp: new Date()
    };

    const assistantPlaceholder: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    };

    setMessages(prev => [...prev, userMsg, assistantPlaceholder]);
    setIsLoading(true);
    setError(null);

    try {
      const historyToSend = messages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .filter(m => m.id !== 'welcome')
        .slice(-10)
        .map(m => ({ role: m.role, content: m.content }));

      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          history: historyToSend,
          ...(sessionId ? { sessionId } : {})
        })
      });

      if (!response.ok) {
        if (response.status === 429) {
          const resData = await response.json();
          throw new Error(resData.error || "You've had a lot of conversations today. Take a little break and come back soon.");
        }
        if (response.status === 503) {
          throw new Error('Luna is resting for a moment. Please try again shortly.');
        }
        throw new Error('Failed to send message');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('No readable stream returned by the server');

      let currentAssistantContent = '';
      let isCrisisResponse = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (!dataStr) continue;

            try {
              const data = JSON.parse(dataStr);
              if (data.type === 'delta') {
                currentAssistantContent += data.text;
                if (data.isCrisis) isCrisisResponse = true;
                setMessages(prev => prev.map(m =>
                  m.id === assistantMsgId ? { ...m, content: currentAssistantContent, isCrisis: isCrisisResponse } : m
                ));
              } else if (data.type === 'done') {
                setMessages(prev => prev.map(m =>
                  m.id === assistantMsgId ? { ...m, isStreaming: false } : m
                ));
              } else if (data.type === 'session_id') {
                // Server created/confirmed a session — save the ID
                setSessionId(data.sessionId);
                fetchSessions(); // Refresh sidebar
              } else if (data.type === 'error') {
                setMessages(prev => prev.map(m =>
                  m.id === assistantMsgId ? { ...m, isStreaming: false, content: m.content || 'I couldn\'t respond right now. Please try again.', failed: true } : m
                ));
                return;
              }
            } catch (_err) {
              // Ignore malformed JSON chunks from split boundaries
            }
          }
        }
      }
    } catch (err: unknown) {
      let msg = err instanceof Error ? err.message : 'Connection lost. Please try again.';
      if (msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('rate limit')) {
        msg = 'Chat is busy right now. Please try again in a minute.';
      }
      // Mark the assistant message as failed with a retry prompt — DON'T remove the user message
      setMessages(prev => prev.map(m =>
        m.id === assistantMsgId ? { ...m, isStreaming: false, content: '', failed: true } : m
      ));
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Retry a failed message ───
  const retryMessage = (failedAssistantId: string) => {
    // Find the user message right before the failed assistant message
    const idx = messages.findIndex(m => m.id === failedAssistantId);
    if (idx <= 0) return;
    const userMsg = messages[idx - 1];
    if (userMsg.role !== 'user') return;

    // Remove the failed assistant message
    setMessages(prev => prev.filter(m => m.id !== failedAssistantId));
    setError(null);
    // Re-send the original user message
    // We need to remove the user message too since sendMessage will re-add it
    setMessages(prev => prev.filter(m => m.id !== userMsg.id));
    sendMessage(userMsg.content);
  };

  const thumbsUp = async () => {
    try {
      await fetch('/api/chat/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sessionId || 'anonymous', rating: 1 })
      });
    } catch { /* ignore */ }
  };

  const thumbsDown = async () => {
    try {
      await fetch('/api/chat/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sessionId || 'anonymous', rating: -1 })
      });
    } catch { /* ignore */ }
  };

  return {
    messages,
    isLoading,
    error,
    suggestions,
    sendMessage,
    clearHistory,
    sessionId,
    sessions,
    sessionsLoading,
    loadSession,
    newChat,
    deleteSession,
    retryMessage,
    thumbsUp,
    thumbsDown,
    contextPill,
    loggedToday,
    refreshContext
  };
}
