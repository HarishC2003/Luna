import { Mood } from '@/types/cycle';

interface Props {
  mood: Mood;
  className?: string;
}

export function MoodBar({ mood, className = '' }: Props) {
  const getProps = () => {
    switch (mood) {
      case 'great': return { icon: '✨', color: 'bg-teal-500', label: 'Great' };
      case 'good': return { icon: '😊', color: 'bg-green-500', label: 'Good' };
      case 'okay': return { icon: '😐', color: 'bg-gray-400', label: 'Okay' };
      case 'low': return { icon: '😔', color: 'bg-amber-500', label: 'Low' };
      case 'terrible': return { icon: '😫', color: 'bg-red-500', label: 'Terrible' };
      default: return { icon: '❓', color: 'bg-gray-200', label: 'Unknown' };
    }
  };

  const { icon, color, label } = getProps();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${color} shadow-sm`}>
        {icon}
      </div>
      <span className="text-sm font-medium text-[#4A1B3C]">{label}</span>
    </div>
  );
}
