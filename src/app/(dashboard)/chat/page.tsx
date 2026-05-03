'use client';

import { useEffect, useRef, useState } from 'react';
import { useChat } from '@/hooks/useChat';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { SuggestionChips } from '@/components/chat/SuggestionChips';
import { DailyFeelingsModal } from '@/components/cycle/DailyFeelingsModal';

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function ChatPage() {
  const {
    messages, isLoading, error, suggestions, sendMessage, clearHistory,
    thumbsUp, thumbsDown, contextPill, loggedToday, refreshContext,
    sessions, sessionsLoading, loadSession, newChat, deleteSession, retryMessage, sessionId
  } = useChat();

  const bottomRef = useRef<HTMLDivElement>(null);
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const showFeedback = messages.length >= 3 && !isLoading && !feedbackGiven;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, feedbackGiven]);

  const handleFeedback = (isUp: boolean) => {
    if (isUp) { thumbsUp(); } else { thumbsDown(); }
    setFeedbackGiven(true);
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to delete this conversation?')) {
      clearHistory();
      setFeedbackGiven(false);
    }
  };

  const handleSelectSession = (id: string) => {
    loadSession(id);
    setSidebarOpen(false);
    setFeedbackGiven(false);
  };

  const handleNewChat = () => {
    newChat();
    setSidebarOpen(false);
    setFeedbackGiven(false);
  };

  const handleDeleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteSession(id);
  };

  return (
    <div className="flex h-[calc(100vh-80px-5rem)] max-h-screen -mx-4 sm:-mx-6 -mt-2 relative">

      {/* ─── Sidebar Overlay (Mobile) ─── */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ─── Sidebar ─── */}
      <div className={`
        fixed md:relative z-40 md:z-0 top-0 left-0 h-full
        w-72 bg-white border-r border-[#E85D9A]/10 flex flex-col
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        md:w-64 md:flex-shrink-0
      `}>
        {/* New Chat Button */}
        <div className="p-3 border-b border-[#E85D9A]/10">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#E85D9A] to-[#D93F7D] text-white font-bold rounded-xl shadow-sm hover:shadow-md transition-all text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            New Chat
          </button>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessionsLoading ? (
            <div className="space-y-2 p-2">
              {[1,2,3].map(i => <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />)}
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-xs text-gray-400 text-center mt-8 px-4">No conversations yet. Start chatting!</p>
          ) : (
            sessions.map(s => (
              <div
                key={s.id}
                onClick={() => handleSelectSession(s.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl group flex items-center justify-between transition-colors text-sm cursor-pointer ${
                  sessionId === s.id
                    ? 'bg-[#E85D9A]/10 text-[#4A1B3C] font-semibold'
                    : 'hover:bg-gray-50 text-[#4A1B3C]/70'
                }`}
              >
                <div className="min-w-0 flex-1 mr-2">
                  <p className="truncate text-[13px]">{s.title}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(s.updated_at)}</p>
                </div>
                <button
                  onClick={(e) => handleDeleteSession(e, s.id)}
                  className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 text-gray-300 transition-all flex-shrink-0"
                  title="Delete"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Sidebar footer */}
        <div className="p-3 border-t border-[#E85D9A]/10 text-[10px] text-gray-400 text-center">
          Conversations saved securely
        </div>
      </div>

      {/* ─── Main Chat Area ─── */}
      <div className="flex flex-col flex-1 bg-gradient-to-br from-pink-50/50 via-[#FDF8F9] to-purple-50/50 min-w-0 relative">
        {/* Subtle decorative background blur */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-pink-300/10 blur-[80px]" />
          <div className="absolute top-[60%] -right-[10%] w-[40%] h-[40%] rounded-full bg-purple-300/10 blur-[80px]" />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white/60 backdrop-blur-xl border-b border-[#E85D9A]/10 shadow-[0_4px_30px_rgba(0,0,0,0.02)] z-10 sticky top-0">
          <div className="flex items-center space-x-4">
            {/* Hamburger for mobile */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-[#4A1B3C]/70 hover:text-[#E85D9A] rounded-xl hover:bg-white/50 transition-colors md:hidden"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="relative">
              <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#E85D9A] via-[#D93F7D] to-[#FF8FA3] text-white flex items-center justify-center font-black shadow-lg shadow-pink-500/30 text-lg ring-2 ring-white">
                L
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
            </div>
            <div>
              <h1 className="font-extrabold text-[#4A1B3C] text-lg leading-tight tracking-tight">Luna AI</h1>
              <p className="text-[11px] text-[#E85D9A] font-bold uppercase tracking-wider">Your Health Companion</p>
            </div>
          </div>
          <button
            onClick={handleClearHistory}
            className="p-2.5 text-[#4A1B3C]/40 hover:text-red-500 rounded-full hover:bg-red-50 transition-all duration-300"
            title="Delete conversation"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>

        {contextPill && (
          <div className="bg-white/40 backdrop-blur-sm border-b border-pink-100/50 px-4 py-2 text-center text-[11px] uppercase tracking-widest font-black text-[#E85D9A] shadow-[0_2px_10px_rgba(232,93,154,0.05)] relative z-0">
            ✨ {contextPill}
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-2 text-sm flex justify-between items-center border-b border-red-100">
            <span>{error}</span>
          </div>
        )}

        {!loggedToday && messages.length <= 1 && (
          <div className="bg-[#4A1B3C]/5 px-4 py-2.5 text-sm shadow-inner flex flex-wrap items-center justify-between gap-2 border-b border-[#4A1B3C]/10">
            <span className="text-[#4A1B3C] font-medium flex items-center">
              <svg className="w-4 h-4 mr-2 text-[#E85D9A]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              You haven&apos;t logged today.
            </span>
            <button
              onClick={() => setShowLogModal(true)}
              className="text-[#E85D9A] hover:underline font-bold text-sm whitespace-nowrap"
            >
              Log now →
            </button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scroll-smooth z-0 relative hide-scrollbar">
          {messages.map((msg) => (
            <div key={msg.id}>
              <ChatBubble message={msg} isOwn={msg.role === 'user'} />
              {/* Retry button for failed messages */}
              {msg.failed && msg.role === 'assistant' && (
                <div className="flex justify-start ml-10 mt-1">
                  <button
                    onClick={() => retryMessage(msg.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#E85D9A] bg-[#E85D9A]/10 rounded-full hover:bg-[#E85D9A]/20 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    Retry
                  </button>
                </div>
              )}
            </div>
          ))}

          {showFeedback && (
            <div className="flex justify-center my-4 animate-fade-in pb-4">
              <div className="bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100 flex items-center space-x-3 text-sm">
                <span className="text-gray-500">Was this helpful?</span>
                <button onClick={() => handleFeedback(true)} className="p-1 text-gray-400 hover:text-green-500 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
                </button>
                <button onClick={() => handleFeedback(false)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" /></svg>
                </button>
              </div>
            </div>
          )}

          <div ref={bottomRef} className="h-1" />
        </div>

        {/* Input area */}
        <div className="p-4 sm:p-6 bg-gradient-to-t from-[#FDF8F9] via-[#FDF8F9]/90 to-transparent z-10 relative mt-auto">
          {messages.length === 1 && suggestions.length > 0 && (
            <div className="mb-3 animate-fade-in-up">
              <SuggestionChips suggestions={suggestions} onSelect={sendMessage} />
            </div>
          )}
          {messages.length === 1 && (
            <div className="flex gap-2.5 overflow-x-auto hide-scrollbar mb-4 pb-2 animate-fade-in-up">
              {["What should I eat today?", "Why do I feel this way?", "When is my period?"].map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="whitespace-nowrap px-4 py-2 rounded-2xl text-[13px] font-bold bg-white/80 backdrop-blur-md border border-pink-100 text-[#4A1B3C]/80 shadow-[0_2px_10px_rgba(232,93,154,0.05)] hover:border-[#E85D9A]/50 hover:text-[#E85D9A] hover:bg-pink-50/50 hover:shadow-[0_4px_15px_rgba(232,93,154,0.1)] transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
          <div className="max-w-4xl mx-auto drop-shadow-xl">
            <ChatInput onSend={sendMessage} isLoading={isLoading} />
            <p className="text-[10px] text-center text-[#4A1B3C]/40 mt-3 font-medium uppercase tracking-wider">
              Luna uses your cycle data to personalise responses.
            </p>
          </div>
        </div>

        <DailyFeelingsModal 
          isOpen={showLogModal}
          onClose={() => setShowLogModal(false)}
          onSuccess={() => {
            setShowLogModal(false);
            refreshContext();
          }}
          initialData={{}}
        />
      </div>
    </div>
  );
}
