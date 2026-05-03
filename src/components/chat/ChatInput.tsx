import { useState, useRef, useEffect } from 'react';

export function ChatInput({ onSend, isLoading, disabled }: { onSend: (text: string) => void, isLoading: boolean, disabled?: boolean }) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (text.trim() && !isLoading) {
      onSend(text);
      setText('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  return (
    <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl border border-pink-100/50 shadow-[0_8px_30px_rgba(232,93,154,0.08)] overflow-hidden flex items-end focus-within:ring-2 focus-within:ring-[#E85D9A]/20 focus-within:border-[#E85D9A]/50 transition-all duration-300">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Message Luna..."
        disabled={disabled || isLoading}
        className="flex-1 max-h-[120px] p-4 px-5 bg-transparent resize-none focus:outline-none disabled:opacity-50 text-[15px] text-[#4A1B3C] placeholder:text-[#4A1B3C]/30 font-medium"
        rows={1}
      />
      <button
        onClick={handleSend}
        disabled={disabled || isLoading || !text.trim()}
        className="p-3 m-2 rounded-2xl bg-gradient-to-tr from-[#E85D9A] to-[#D93F7D] text-white disabled:opacity-50 disabled:from-gray-300 disabled:to-gray-400 transition-all shadow-md shadow-pink-500/20 transform active:scale-95 flex items-center justify-center"
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <svg className="w-5 h-5 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        )}
      </button>

      {text.length > 1800 && (
         <div className="absolute top-2 right-16 text-[10px] font-bold text-pink-400 bg-white/80 px-2 py-0.5 rounded-full backdrop-blur-sm">
           {text.length}/2000
         </div>
      )}
    </div>
  );
}
