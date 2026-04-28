import { Insight } from '@/types/cycle';

interface Props {
  insight: Insight;
}

const TYPE_THEMES: Record<string, { bg: string, accent: string, text: string, fill: string }> = {
  alert: { bg: 'bg-[#FFF0F4]', accent: 'bg-[#E85D9A]', text: 'text-[#72243E]', fill: '#E85D9A' },
  tip: { bg: 'bg-[#F0EDFE]', accent: 'bg-[#7F77DD]', text: 'text-[#3C3489]', fill: '#7F77DD' },
  milestone: { bg: 'bg-[#E8F8F2]', accent: 'bg-[#1D9E75]', text: 'text-[#085041]', fill: '#1D9E75' },
  pattern: { bg: 'bg-[#FEF6E7]', accent: 'bg-[#BA7517]', text: 'text-[#633806]', fill: '#BA7517' },
};

export function InsightCard({ insight }: Props) {
  const theme = TYPE_THEMES[insight.type] || TYPE_THEMES.tip;

  return (
    <div className={`relative min-w-[220px] w-[220px] h-[110px] p-[16px] rounded-[16px] ${theme.bg} snap-center flex-shrink-0 flex flex-col justify-between overflow-hidden shadow-sm transition-transform active:scale-[0.98]`}>
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${theme.accent}`} />
      
      <div>
        <div className="inline-block bg-white/50 px-[8px] py-[2px] rounded-[100px] mb-[8px]">
          <span className={`text-[10px] font-semibold uppercase tracking-wider ${theme.text}`}>
            {insight.type}
          </span>
        </div>
        <h4 className="font-semibold text-[#1A0A12] text-[13px] leading-tight line-clamp-2">
          {insight.title}
        </h4>
      </div>
      
      <p className="text-[#9E7A8A] text-[12px] truncate">
        {insight.body}
      </p>
    </div>
  );
}
