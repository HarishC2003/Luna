export function SuggestionChips({ suggestions, onSelect }: { suggestions: string[], onSelect: (text: string) => void }) {
  if (suggestions.length === 0) return null;
  
  return (
    <div className="flex gap-2.5 overflow-x-auto pb-2 hide-scrollbar py-2 px-1">
      {suggestions.map((suggestion, idx) => (
        <button
          key={idx}
          onClick={() => onSelect(suggestion)}
          className="whitespace-nowrap px-4 py-2 bg-white/80 backdrop-blur-md hover:bg-pink-50/80 text-[#E85D9A] text-[13px] font-bold rounded-2xl border border-pink-100 hover:border-[#E85D9A]/50 transition-all shadow-[0_2px_10px_rgba(232,93,154,0.05)] hover:shadow-[0_4px_15px_rgba(232,93,154,0.1)] transform hover:-translate-y-0.5 active:translate-y-0"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}
