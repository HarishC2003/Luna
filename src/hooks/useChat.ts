import { useState, useEffect } from 'react';
import { ChatMessage } from '@/types/chat';

export function useChat() {
  const [sessionId, setSessionId] = useState<string>(() => crypto.randomUUID());
  const [messages, setMessages] = useState<ChatMessage[]>(() => [{
    id: crypto.randomUUID(),
    role: 'assistant',
    content: "Hi, I'm Luna. I'm here to help you understand your cycle and feel supported. What's on your mind today?",
    timestamp: new Date()
  }]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [contextPill, setContextPill] = useState<string>('');
  const [loggedToday, setLoggedToday] = useState<boolean>(true);

  useEffect(() => {
    const fetchContext = async () => {
      try {
        const res = await fetch('/api/chat/suggestions');
        const data = await res.json();
        if (data.suggestions) setSuggestions(data.suggestions);
        if (data.contextPill) setContextPill(data.contextPill);
        if (typeof data.loggedToday === 'boolean') setLoggedToday(data.loggedToday);
      } catch (err) {
        console.error("Failed to fetch context", err);
      }
    };
    fetchContext();
  }, []);

  const refreshContext = async () => {
    try {
      const res = await fetch('/api/chat/suggestions');
      const data = await res.json();
      if (data.suggestions) setSuggestions(data.suggestions);
      if (data.contextPill) setContextPill(data.contextPill);
      if (typeof data.loggedToday === 'boolean') setLoggedToday(data.loggedToday);
    } catch (err) {
      console.error("Failed to refresh context", err);
    }
  };

  const clearHistory = () => {
    setSessionId(crypto.randomUUID());
    setMessages([
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "Hi, I'm Luna. I'm here to help you understand your cycle and feel supported. What's on your mind today?",
        timestamp: new Date()
      }
    ]);
  };

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMsgId = crypto.randomUUID();
    const assistantMsgId = crypto.randomUUID();

    const newMessages = [...messages, {
      id: userMsgId,
      role: 'user' as const,
      content,
      timestamp: new Date()
    }];

    setMessages([...newMessages, {
      id: assistantMsgId,
      role: 'assistant' as const,
      content: '',
      timestamp: new Date(),
      isStreaming: true
    }]);

    setIsLoading(true);
    setError(null);

    try {
      const historyToSend = messages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .slice(-10)
        .map(m => ({ role: m.role, content: m.content }));

      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          history: historyToSend,
          sessionId
        })
      });

      if (!response.ok) {
        if (response.status === 429) {
          const resData = await response.json();
          throw new Error(resData.error || "You've had a lot of conversations today. Take a little break and come back soon.");
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
                if (data.isCrisis) {
                  isCrisisResponse = true;
                }
                setMessages(prev => prev.map(m =>
                  m.id === assistantMsgId ? { ...m, content: currentAssistantContent, isCrisis: isCrisisResponse } : m
                ));
              } else if (data.type === 'done') {
                setMessages(prev => prev.map(m =>
                  m.id === assistantMsgId ? { ...m, isStreaming: false } : m
                ));
              } else if (data.type === 'error') {
                setError(data.message);
                setMessages(prev => prev.map(m =>
                  m.id === assistantMsgId ? { ...m, isStreaming: false, content: m.content || 'Something went wrong. Please try again.' } : m
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
      let msg = err instanceof Error ? err.message : "Connection lost. Please try again.";
      if (msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('rate limit')) {
        msg = 'Chat is busy right now. Please try again in a minute.';
      }
      setError(msg);
      setMessages(prev => prev.filter(m => m.id !== assistantMsgId));
    } finally {
      setIsLoading(false);
    }
  };

  const thumbsUp = async () => {
    try {
      await fetch('/api/chat/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, rating: 1 })
      });
    } catch {
      // ignore
    }
  };

  const thumbsDown = async () => {
    try {
      await fetch('/api/chat/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, rating: -1 })
      });
    } catch {
      // ignore
    }
  };

  return {
    messages,
    isLoading,
    error,
    suggestions,
    sendMessage,
    clearHistory,
    sessionId,
    thumbsUp,
    thumbsDown,
    contextPill,
    loggedToday,
    refreshContext
  };
}
