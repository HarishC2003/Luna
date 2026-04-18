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
    <div className="relative bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex items-end">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Message Luna..."
        disabled={disabled || isLoading}
        className="flex-1 max-h-[120px] p-4 bg-transparent resize-none focus:outline-none disabled:opacity-50 text-[15px]"
        rows={1}
      />
      <button
        onClick={handleSend}
        disabled={disabled || isLoading || !text.trim()}
        className="p-3 m-1 rounded-xl bg-[#E85D9A] text-white disabled:opacity-50 disabled:bg-gray-300 transition-colors"
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        )}
      </button>

      {text.length > 1800 && (
         <div className="absolute top-1 right-14 text-xs text-gray-400">
           {text.length}/2000
         </div>
      )}
    </div>
  );
}
