import { FlowIntensity } from '@/types/cycle';

interface Props {
  flow: FlowIntensity;
  className?: string;
}

export function FlowBadge({ flow, className = '' }: Props) {
  const getStyles = () => {
    switch (flow) {
      case 'none': return 'bg-gray-100 text-gray-500';
      case 'spotting': return 'bg-gray-200 text-gray-700';
      case 'light': return 'bg-pink-200 text-pink-800';
      case 'medium': return 'bg-rose-400 text-white';
      case 'heavy': return 'bg-rose-600 text-white';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStyles()} ${className}`}>
      {flow} flow
    </span>
  );
}
