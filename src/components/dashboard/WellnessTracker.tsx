'use client';

import { useState } from 'react';

interface WellnessTrackerProps {
  initialData?: {
    hydration_goal?: boolean;
    slept_well?: boolean;
    moved_body?: boolean;
  };
  onUpdate?: () => void;
}

export function WellnessTracker({ initialData, onUpdate }: WellnessTrackerProps) {
  const [hydration, setHydration] = useState(initialData?.hydration_goal || false);
  const [sleep, setSleep] = useState(initialData?.slept_well || false);
  const [movement, setMovement] = useState(initialData?.moved_body || false);
  const [loading, setLoading] = useState(false);

  const toggleWellness = async (field: 'hydration_goal' | 'slept_well' | 'moved_body') => {
    if (loading) return;
    setLoading(true);

    const newState = field === 'hydration_goal' ? !hydration : field === 'slept_well' ? !sleep : !movement;
    
    if (field === 'hydration_goal') setHydration(newState);
    if (field === 'slept_well') setSleep(newState);
    if (field === 'moved_body') setMovement(newState);

    try {
      await fetch('/api/daily-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          log_date: new Date().toISOString().split('T')[0],
          [field]: newState
        }),
      });
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Failed to update wellness:', error);
      // Revert on error
      if (field === 'hydration_goal') setHydration(!newState);
      if (field === 'slept_well') setSleep(!newState);
      if (field === 'moved_body') setMovement(!newState);
    } finally {
      setLoading(false);
    }
  };

  const allDone = hydration && sleep && movement;

  return (
    <div className="w-full bg-white border border-[#E85D9A]/10 p-5 rounded-3xl shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-[#1A0A12] uppercase tracking-wide">Daily Wellness</h3>
        {allDone && <span className="text-xs font-semibold text-green-500 bg-green-50 px-2 py-1 rounded-full animate-pulse">Great job! 🎉</span>}
      </div>

      <div className="flex flex-col gap-3">
        <button 
          onClick={() => toggleWellness('hydration_goal')}
          className={`flex items-center justify-between p-3 rounded-xl transition-all ${hydration ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-100'} border`}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">💧</span>
            <span className={`text-sm font-medium ${hydration ? 'text-blue-700' : 'text-gray-600'}`}>Drank enough water</span>
          </div>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${hydration ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-300'}`}>
            {hydration && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
          </div>
        </button>

        <button 
          onClick={() => toggleWellness('slept_well')}
          className={`flex items-center justify-between p-3 rounded-xl transition-all ${sleep ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-gray-100'} border`}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">🌙</span>
            <span className={`text-sm font-medium ${sleep ? 'text-indigo-700' : 'text-gray-600'}`}>Slept 7+ hours</span>
          </div>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${sleep ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-gray-300'}`}>
            {sleep && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
          </div>
        </button>

        <button 
          onClick={() => toggleWellness('moved_body')}
          className={`flex items-center justify-between p-3 rounded-xl transition-all ${movement ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-100'} border`}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">🏃‍♀️</span>
            <span className={`text-sm font-medium ${movement ? 'text-orange-700' : 'text-gray-600'}`}>Moved my body</span>
          </div>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${movement ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-300'}`}>
            {movement && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
          </div>
        </button>
      </div>
    </div>
  );
}
