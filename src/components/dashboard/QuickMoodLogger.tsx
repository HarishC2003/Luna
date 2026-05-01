'use client';

import { useState } from 'react';

export function QuickMoodLogger({ onLogged }: { onLogged?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [justLogged, setJustLogged] = useState(false);

  const logMood = async (mood: string) => {
    if (loading) return;
    setLoading(true);

    try {
      await fetch('/api/daily-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          log_date: new Date().toISOString().split('T')[0],
          mood
        }),
      });
      setJustLogged(true);
      if (onLogged) onLogged();
      
      setTimeout(() => {
        setJustLogged(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to log mood:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white border border-[#E85D9A]/10 p-5 rounded-3xl shadow-sm">
      <h3 className="text-sm font-bold text-[#1A0A12] uppercase tracking-wide mb-3">How do you feel right now?</h3>
      
      {justLogged ? (
        <div className="w-full py-2 bg-green-50 text-green-600 rounded-xl text-center text-sm font-medium animate-in fade-in zoom-in duration-300">
          Saved! Thanks for checking in.
        </div>
      ) : (
        <div className="flex gap-2">
          <button 
            onClick={() => logMood('good')}
            disabled={loading}
            className="flex-1 flex flex-col items-center justify-center py-3 bg-gray-50 rounded-xl hover:bg-pink-50 hover:text-pink-600 transition-colors border border-transparent hover:border-pink-100 disabled:opacity-50"
          >
            <span className="text-2xl mb-1">😊</span>
            <span className="text-xs font-medium text-gray-600">Good</span>
          </button>
          <button 
            onClick={() => logMood('okay')}
            disabled={loading}
            className="flex-1 flex flex-col items-center justify-center py-3 bg-gray-50 rounded-xl hover:bg-pink-50 hover:text-pink-600 transition-colors border border-transparent hover:border-pink-100 disabled:opacity-50"
          >
            <span className="text-2xl mb-1">😐</span>
            <span className="text-xs font-medium text-gray-600">Okay</span>
          </button>
          <button 
            onClick={() => logMood('low')}
            disabled={loading}
            className="flex-1 flex flex-col items-center justify-center py-3 bg-gray-50 rounded-xl hover:bg-pink-50 hover:text-pink-600 transition-colors border border-transparent hover:border-pink-100 disabled:opacity-50"
          >
            <span className="text-2xl mb-1">😔</span>
            <span className="text-xs font-medium text-gray-600">Low</span>
          </button>
        </div>
      )}
    </div>
  );
}
