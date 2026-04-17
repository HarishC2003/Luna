import { Symptom } from '@/types/cycle';

interface Props {
  symptoms: Symptom[];
}

export function SymptomChips({ symptoms }: Props) {
  if (!symptoms || symptoms.length === 0) return <span className="text-sm text-gray-400 italic">No symptoms</span>;

  return (
    <div className="flex flex-wrap gap-2">
      {symptoms.map(s => (
        <span 
          key={s} 
          className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-[#FDF8F9] text-[#4A1B3C] border border-[#E85D9A]/20 capitalize"
        >
          {s.replace('_', ' ')}
        </span>
      ))}
    </div>
  );
}
