'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Pattern, Insight } from '@/types/cycle';
import { motion } from 'framer-motion';

const TYPE_THEMES: Record<string, { bg: string; border: string; accent: string; text: string; icon: string }> = {
  correlation: { bg: 'bg-purple-50/80', border: 'border-purple-200/50', accent: 'bg-purple-500', text: 'text-purple-900', icon: '🔗' },
  trigger:     { bg: 'bg-amber-50/80',  border: 'border-amber-200/50',  accent: 'bg-amber-500',  text: 'text-amber-900',  icon: '⚡' },
  trend:       { bg: 'bg-emerald-50/80', border: 'border-emerald-200/50', accent: 'bg-emerald-500', text: 'text-emerald-900', icon: '📈' },
  cycle_phase: { bg: 'bg-rose-50/80',   border: 'border-rose-200/50',   accent: 'bg-rose-500',   text: 'text-rose-900',   icon: '🩸' },
  warning:     { bg: 'bg-red-50/80',    border: 'border-red-200/50',    accent: 'bg-red-500',    text: 'text-red-900',    icon: '⚠️' },
  alert:       { bg: 'bg-red-50/80',    border: 'border-red-200/50',    accent: 'bg-red-500',    text: 'text-red-900',    icon: '🚨' },
  pattern:     { bg: 'bg-orange-50/80', border: 'border-orange-200/50', accent: 'bg-orange-500', text: 'text-orange-900', icon: '🔍' },
  tip:         { bg: 'bg-blue-50/80',   border: 'border-blue-200/50',   accent: 'bg-blue-500',   text: 'text-blue-900',   icon: '💡' },
  milestone:   { bg: 'bg-teal-50/80',   border: 'border-teal-200/50',   accent: 'bg-teal-500',   text: 'text-teal-900',   icon: '🎉' },
};

function ConfidenceBar({ confidence }: { confidence: number }) {
  const pct = Math.min(100, Math.round(confidence * 100));
  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] font-bold text-[#4A1B3C]/50 uppercase tracking-widest">Confidence</span>
        <span className="text-[10px] font-bold text-[#4A1B3C]/80">{pct}%</span>
      </div>
      <div className="w-full h-[8px] rounded-full bg-gray-200/50 overflow-hidden shadow-inner backdrop-blur-sm">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.5, ease: 'easeOut', delay: 0.2 }}
          className="h-full rounded-full bg-gradient-to-r from-[#E85D9A] via-[#C026D3] to-[#7F77DD] shadow-[0_0_10px_rgba(232,93,154,0.5)]"
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchAll();
  }, [fetchAll]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto mt-8 px-4 space-y-6">
        <div className="h-12 w-64 bg-gray-200 rounded-xl animate-pulse" />
        <div className="h-40 bg-gray-200 rounded-3xl animate-pulse" />
        <div className="h-40 bg-gray-200 rounded-3xl animate-pulse" />
        <div className="h-40 bg-gray-200 rounded-3xl animate-pulse" />
      </div>
    );
  }

  const hasData = patterns.length > 0 || insights.length > 0;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  };

  return (
    <div className="max-w-3xl mx-auto mt-6 px-4 sm:px-0 pb-12">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 text-center sm:text-left"
      >
        <h1 className="text-[32px] md:text-[40px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#4A1B3C] via-[#E85D9A] to-[#7F77DD] leading-tight drop-shadow-sm mb-3">
          Your Personal Insights
        </h1>
        <p className="text-[15px] text-[#9E7A8A] leading-relaxed max-w-xl mx-auto sm:mx-0 font-medium">
          Luna actively analyzes your data to find beautiful hidden patterns connecting your cycle, mood, symptoms, and energy levels.
        </p>
      </motion.div>

      {!hasData && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-12 rounded-[2rem] bg-white/60 backdrop-blur-md border border-[#E85D9A]/20 text-center shadow-xl shadow-[#E85D9A]/5"
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center mx-auto mb-6 text-4xl shadow-inner">
            ✨
          </div>
          <h2 className="text-[22px] font-extrabold text-[#4A1B3C] mb-3">
            Gathering Stardust
          </h2>
          <p className="text-[15px] text-[#9E7A8A] max-w-sm mx-auto leading-relaxed font-medium">
            Keep logging your daily feelings! Luna needs a bit more data (at least 10 days and 3 cycles) to start painting a picture of your unique rhythm.
          </p>
        </motion.div>
      )}

      {/* PATTERN ANALYSIS SECTION */}
      {patterns.length > 0 && (
        <motion.section 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E85D9A] to-[#7F77DD] flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-pink-500/20">
              🧬
            </div>
            <h2 className="text-[22px] font-extrabold text-[#4A1B3C]">
              Detected Patterns
            </h2>
            <span className="ml-auto text-[12px] font-bold text-white bg-[#E85D9A] px-3 py-1.5 rounded-full shadow-md">
              {patterns.length} found
            </span>
          </div>

          <div className="space-y-5">
            {patterns.map((p) => {
              const theme = TYPE_THEMES[p.type] || TYPE_THEMES.pattern;
              return (
                <motion.div
                  variants={itemVariants}
                  whileHover={{ scale: 1.02, translateY: -2 }}
                  key={p.id}
                  className={`relative p-6 rounded-[1.5rem] border ${theme.border} ${theme.bg} backdrop-blur-sm shadow-lg shadow-[#4A1B3C]/5 overflow-hidden transition-all`}
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${theme.accent} shadow-[0_0_10px_currentColor] opacity-80`} />

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-2xl shrink-0 border border-[#4A1B3C]/5">
                      {theme.icon}
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className={`text-[11px] font-black uppercase tracking-widest ${theme.text} opacity-80 bg-white/50 px-2 py-0.5 rounded-md`}>
                          {p.type.replace('_', ' ')}
                        </span>
                        {p.actionable && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-200/60 px-2 py-0.5 rounded-md">
                            Actionable
                          </span>
                        )}
                      </div>
                      <h3 className="text-[17px] font-extrabold text-[#1A0A12] leading-snug mb-1">
                        {p.title}
                      </h3>
                      <p className="text-[14px] text-[#4A3040] leading-relaxed font-medium">
                        {p.description}
                      </p>
                      {p.recommendation && (
                         <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 }}
                          className="mt-4 p-4 rounded-2xl bg-white/80 border border-white/50 shadow-sm backdrop-blur-md relative overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-pink-200/40 to-transparent rounded-bl-full" />
                          <span className="text-[11px] font-black text-[#E85D9A] uppercase tracking-widest block mb-1.5">
                            💡 Recommendation
                          </span>
                          <p className="text-[13px] text-[#4A1B3C] leading-relaxed font-semibold relative z-10">
                            {p.recommendation}
                          </p>
                        </motion.div>
                      )}
                      <ConfidenceBar confidence={p.confidence} />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.section>
      )}

      {/* CYCLE INSIGHTS SECTION */}
      {insights.length > 0 && (
        <motion.section
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-orange-500/20">
              📊
            </div>
            <h2 className="text-[22px] font-extrabold text-[#4A1B3C]">
              Cycle Insights
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((ins) => {
              const theme = TYPE_THEMES[ins.type] || TYPE_THEMES.tip;
              return (
                <motion.div
                  variants={itemVariants}
                  whileHover={{ scale: 1.03 }}
                  key={ins.id}
                  className={`relative p-5 rounded-[1.5rem] border ${theme.border} ${theme.bg} shadow-md shadow-[#4A1B3C]/5 overflow-hidden backdrop-blur-sm`}
                >
                  <div className={`absolute left-0 top-0 right-0 h-1 ${theme.accent} opacity-70`} />
                  <div className="pt-2">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl bg-white p-1.5 rounded-lg shadow-sm border border-[#4A1B3C]/5">{theme.icon}</span>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${theme.text} opacity-80 bg-white/50 px-2 py-0.5 rounded-md`}>
                        {ins.type}
                      </span>
                    </div>
                    <h3 className="text-[15px] font-extrabold text-[#1A0A12] mb-1.5 leading-snug">{ins.title}</h3>
                    <p className="text-[13px] text-[#4A3040] leading-relaxed font-medium">{ins.body}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.section>
      )}
    </div>
  );
}
