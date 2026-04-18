export function SuggestionChips({ suggestions, onSelect }: { suggestions: string[], onSelect: (text: string) => void }) {
  if (suggestions.length === 0) return null;
  
  return (
    <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide py-2 px-1">
      {suggestions.map((suggestion, idx) => (
        <button
          key={idx}
          onClick={() => onSelect(suggestion)}
          className="whitespace-nowrap px-4 py-2 bg-[#FDF8F9] hover:bg-[#E85D9A]/10 text-[#E85D9A] text-sm rounded-full border border-[#E85D9A]/20 transition-colors"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}
