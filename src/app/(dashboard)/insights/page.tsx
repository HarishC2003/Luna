'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Pattern, Insight } from '@/types/cycle';

const TYPE_THEMES: Record<string, { bg: string; border: string; accent: string; text: string; icon: string }> = {
  correlation: { bg: 'bg-purple-50', border: 'border-purple-200', accent: 'bg-purple-500', text: 'text-purple-900', icon: '🔗' },
  trigger:     { bg: 'bg-amber-50',  border: 'border-amber-200',  accent: 'bg-amber-500',  text: 'text-amber-900',  icon: '⚡' },
  trend:       { bg: 'bg-emerald-50', border: 'border-emerald-200', accent: 'bg-emerald-500', text: 'text-emerald-900', icon: '📈' },
  cycle_phase: { bg: 'bg-rose-50',   border: 'border-rose-200',   accent: 'bg-rose-500',   text: 'text-rose-900',   icon: '🩸' },
  warning:     { bg: 'bg-red-50',    border: 'border-red-200',    accent: 'bg-red-500',    text: 'text-red-900',    icon: '⚠️' },
  alert:       { bg: 'bg-red-50',    border: 'border-red-200',    accent: 'bg-red-500',    text: 'text-red-900',    icon: '🚨' },
  pattern:     { bg: 'bg-orange-50', border: 'border-orange-200', accent: 'bg-orange-500', text: 'text-orange-900', icon: '🔍' },
  tip:         { bg: 'bg-blue-50',   border: 'border-blue-200',   accent: 'bg-blue-500',   text: 'text-blue-900',   icon: '💡' },
  milestone:   { bg: 'bg-teal-50',   border: 'border-teal-200',   accent: 'bg-teal-500',   text: 'text-teal-900',   icon: '🎉' },
};

function ConfidenceBar({ confidence }: { confidence: number }) {
  const pct = Math.min(100, Math.round(confidence * 100));
  return (
    <div className="mt-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] font-bold text-[#4A1B3C]/40 uppercase tracking-wider">Confidence</span>
        <span className="text-[10px] font-bold text-[#4A1B3C]/60">{pct}%</span>
      </div>
      <div className="w-full h-[6px] rounded-full bg-gray-200 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#E85D9A] to-[#7F77DD] transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function InsightsPage() {
  const router = useRouter();
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, iRes] = await Promise.all([
        fetch('/api/insights/patterns'),
        fetch('/api/insights'),
      ]);

      if (pRes.status === 401 || iRes.status === 401) {
        router.push('/login');
        return;
      }

      const pData = await pRes.json();
      const iData = await iRes.json();

      setPatterns(pData.patterns || []);
      setInsights(iData.insights || []);
    } catch (err) {
      console.error('[insights] Failed to fetch:', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    void fetchAll();
  }, [fetchAll]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto mt-8 px-4 space-y-4">
        <div className="h-10 bg-gray-200 rounded-xl animate-pulse" />
        <div className="h-32 bg-gray-200 rounded-2xl animate-pulse" />
        <div className="h-32 bg-gray-200 rounded-2xl animate-pulse" />
        <div className="h-32 bg-gray-200 rounded-2xl animate-pulse" />
      </div>
    );
  }

  const hasData = patterns.length > 0 || insights.length > 0;

  return (
    <div className="max-w-3xl mx-auto mt-4 px-2 sm:px-0 pb-10 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-[28px] font-extrabold text-[#4A1B3C] leading-tight">
          Insights &amp; Patterns
        </h1>
        <p className="text-[14px] text-[#9E7A8A] mt-2 leading-relaxed">
          Luna analyzes your data to find real patterns in your cycle, mood, symptoms, and energy.
        </p>
      </div>

      {!hasData && (
        <div className="p-10 rounded-3xl bg-white border border-[#E85D9A]/10 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-pink-50 flex items-center justify-center mx-auto mb-4 text-3xl">
            🔍
          </div>
          <h2 className="text-[18px] font-bold text-[#4A1B3C] mb-2">
            Not enough data yet
          </h2>
          <p className="text-[14px] text-[#9E7A8A] max-w-sm mx-auto leading-relaxed">
            Keep logging daily — Luna needs at least 10 days of data and 3 logged cycles to start detecting meaningful patterns.
          </p>
        </div>
      )}

      {/* PATTERN ANALYSIS SECTION */}
      {patterns.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#E85D9A] to-[#7F77DD] flex items-center justify-center text-white text-sm font-bold">
              🧬
            </div>
            <h2 className="text-[18px] font-bold text-[#4A1B3C]">
              Detected Patterns
            </h2>
            <span className="ml-auto text-[11px] font-bold text-[#E85D9A] bg-pink-50 px-2.5 py-1 rounded-full">
              {patterns.length} found
            </span>
          </div>

          <div className="space-y-4">
            {patterns.map((p) => {
              const theme = TYPE_THEMES[p.type] || TYPE_THEMES.pattern;
              return (
                <div
                  key={p.id}
                  className={`relative p-5 rounded-2xl border ${theme.border} ${theme.bg} shadow-sm overflow-hidden transition-transform active:scale-[0.99]`}
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${theme.accent}`} />

                  <div className="flex items-start gap-3">
                    <span className="text-xl mt-0.5">{theme.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${theme.text} opacity-70`}>
                          {p.type.replace('_', ' ')}
                        </span>
                        {p.actionable && (
                          <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                            Actionable
                          </span>
                        )}
                      </div>
                      <h3 className="text-[15px] font-bold text-[#1A0A12] leading-snug">
                        {p.title}
                      </h3>
                      <p className="text-[13px] text-[#4A3040] leading-relaxed mt-1">
                        {p.description}
                      </p>
                      {p.recommendation && (
                        <div className="mt-3 p-3 rounded-xl bg-white/60 border border-white/80">
                          <span className="text-[10px] font-bold text-[#E85D9A] uppercase tracking-wider block mb-1">
                            💡 Recommendation
                          </span>
                          <p className="text-[12px] text-[#4A1B3C] leading-relaxed">
                            {p.recommendation}
                          </p>
                        </div>
                      )}
                      <ConfidenceBar confidence={p.confidence} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* CYCLE INSIGHTS SECTION */}
      {insights.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold">
              📊
            </div>
            <h2 className="text-[18px] font-bold text-[#4A1B3C]">
              Cycle Insights
            </h2>
          </div>

          <div className="space-y-3">
            {insights.map((ins) => {
              const theme = TYPE_THEMES[ins.type] || TYPE_THEMES.tip;
              return (
                <div
                  key={ins.id}
                  className={`relative p-4 rounded-2xl border ${theme.border} ${theme.bg} shadow-sm overflow-hidden`}
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${theme.accent}`} />
                  <div className="pl-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{theme.icon}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${theme.text} opacity-70`}>
                        {ins.type}
                      </span>
                    </div>
                    <h3 className="text-[14px] font-bold text-[#1A0A12]">{ins.title}</h3>
                    <p className="text-[13px] text-[#4A3040] leading-relaxed mt-1">{ins.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
