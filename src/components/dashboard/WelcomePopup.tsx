'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';

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
    <Modal isOpen={show} onClose={() => setShow(false)} title="Welcome back">
      <div className="text-center animate-fade-in">
        <div className="text-6xl mb-4 animate-float">{data.emoji}</div>
        <h2 className="text-2xl font-bold text-[#1A0A12] mb-2">
          {data.greeting}, {data.displayName}!
        </h2>
        <div className="inline-block px-4 py-2 rounded-full bg-purple-100 text-purple-800 text-sm font-medium mb-4 capitalize">
          {data.phase === 'unknown' ? 'Unknown Phase' : `Day ${data.dayOfCycle} • ${data.phase}`}
        </div>
        <p className="text-[#4A3040] mb-6 text-sm">
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
          className="w-full py-3 rounded-2xl font-semibold text-white shadow-md hover:shadow-lg transition-transform active:scale-95 duration-200 cursor-pointer"
          style={{ background: 'linear-gradient(135deg, #E85D9A, #7F77DD)' }}
        >
          Start your day
        </button>
      </div>
    </Modal>
  );
}
