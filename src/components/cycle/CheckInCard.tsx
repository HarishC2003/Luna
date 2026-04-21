'use client';

import { useState, useEffect } from 'react';
import { CheckInQuestion } from '@/lib/checkin/question-generator';

export function CheckInCard({ onAnswered }: { onAnswered: () => void }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ checkin: CheckInQuestion; hasAnswered: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showLogged, setShowLogged] = useState(false);

  useEffect(() => {
    fetch('/api/checkin/today')
      .then(res => res.json())
      .then(json => {
        if (!json.error) setData(json);
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  const handleAnswer = async (answer: string) => {
    if (!data?.checkin) return;
    setSubmitting(true);
    
    try {
      await fetch('/api/checkin/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer, logField: data.checkin.logField })
      });
      setShowLogged(true);
      setTimeout(() => {
        setData(prev => prev ? { ...prev, hasAnswered: true } : null);
        onAnswered();
      }, 1500);
    } catch(e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !data || data.hasAnswered) {
    return null;
  }

  if (showLogged) {
    return (
      <div className="w-full bg-[#E85D9A]/10 border border-[#E85D9A]/20 p-6 rounded-3xl text-center shadow-sm animate-fade-in transition-all">
        <h3 className="text-[#4A1B3C] font-semibold text-lg flex items-center justify-center gap-2">
          <svg className="w-6 h-6 text-[#E85D9A]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
          Logged!
        </h3>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#E85D9A]/10 border border-[#E85D9A]/20 p-6 sm:p-8 rounded-3xl shadow-sm space-y-4 animate-slide-down">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">✨</span>
        <span className="text-xs font-bold text-[#E85D9A] uppercase tracking-wider">Daily Check-in</span>
      </div>
      <h3 className="text-2xl font-bold text-[#4A1B3C]">{data.checkin.question}</h3>
      <div className="flex flex-wrap gap-3 mt-4">
        {data.checkin.options.map(option => (
          <button
            key={option}
            onClick={() => handleAnswer(option)}
            disabled={submitting}
            className="px-5 py-2.5 bg-white border border-[#E85D9A]/30 text-[#4A1B3C] font-semibold rounded-full hover:bg-[#E85D9A] hover:text-white hover:border-[#E85D9A] transition-colors disabled:opacity-50"
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
