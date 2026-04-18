export function TypingIndicator() {
  return (
    <div className="flex space-x-1 items-center px-1 py-1">
      <div className="w-1.5 h-1.5 bg-[#E85D9A]/60 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="w-1.5 h-1.5 bg-[#E85D9A]/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="w-1.5 h-1.5 bg-[#E85D9A]/60 rounded-full animate-bounce"></div>
    </div>
  );
}
