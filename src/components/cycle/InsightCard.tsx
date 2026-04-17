import { Insight } from '@/types/cycle';

interface Props {
  insight: Insight;
}

export function InsightCard({ insight }: Props) {
  const getIcon = () => {
    switch (insight.type) {
      case 'pattern': return <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
      case 'tip': return <svg className="w-5 h-5 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
      case 'alert': return <svg className="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
      case 'milestone': return <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>;
      default: return null;
    }
  };

  return (
    <div className="min-w-[280px] w-[280px] p-5 rounded-2xl bg-white border border-[#E85D9A]/20 shadow-[0_4px_12px_rgba(232,93,154,0.05)] snap-center flex-shrink-0 flex flex-col h-full transform transition-transform hover:scale-[1.02]">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-[#FDF8F9] rounded-xl border border-[#E85D9A]/10">
          {getIcon()}
        </div>
        <h4 className="font-semibold text-[#4A1B3C] text-sm leading-tight flex-1">{insight.title}</h4>
      </div>
      <p className="text-[#4A1B3C]/70 text-sm flex-1">{insight.body}</p>
    </div>
  );
}
