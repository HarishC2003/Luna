'use client';

import { useState, useEffect } from 'react';

interface WelcomeData {
  displayName: string;
  dayOfCycle: number;
  phase: string;
  phaseDescription: string;
  quickTip: string;
  emoji: string;
  greeting: string;
}

export default function WelcomePopup() {
  const [show, setShow] = useState(false);
  const [data, setData] = useState<WelcomeData | null>(null);

  useEffect(() => {
    // Check if already shown today
    const lastShown = localStorage.getItem('luna_welcome_last_shown');
    const today = new Date().toISOString().split('T')[0];
    
    if (lastShown === today) return;

    // Fetch welcome data
    fetch('/api/dashboard/welcome')
      .then(res => res.json())
      .then(welcomeData => {
        if (!welcomeData.error) {
          setData(welcomeData);
          setShow(true);
          localStorage.setItem('luna_welcome_last_shown', today);
        }
      })
      .catch(() => {});
  }, []);

  if (!show || !data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-300">
        <button 
          onClick={() => setShow(false)}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center">
          <div className="text-6xl mb-4">{data.emoji}</div>
          <h2 className="text-2xl font-bold text-[#1A0A12] mb-2">
            {data.greeting}, {data.displayName}!
          </h2>
          <div className="inline-block px-4 py-2 rounded-full bg-purple-100 text-purple-800 text-sm font-medium mb-4 capitalize">
            Day {data.dayOfCycle} • {data.phase}
          </div>
          <p className="text-[#4A3040] mb-6">
            {data.phaseDescription}
          </p>
          
          <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-4 mb-6 text-left">
            <div className="text-xs font-semibold text-purple-900 uppercase tracking-wide mb-2">
              💡 Today&apos;s tip
            </div>
            <p className="text-sm text-purple-800 leading-relaxed">
              {data.quickTip}
            </p>
          </div>

          <button
            onClick={() => setShow(false)}
            className="w-full py-3 rounded-xl font-medium text-white shadow-md hover:bg-[#d44d88] transition-colors"
            style={{ background: '#E85D9A' }}
          >
            Start your day
          </button>
        </div>
      </div>
    </div>
  );
}
