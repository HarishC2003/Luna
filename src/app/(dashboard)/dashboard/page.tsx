'use client';

import { useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
  displayName: string;
  role: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
        } else {
          window.location.href = '/login';
        }
      })
      .catch(() => {
        window.location.href = '/login';
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20 min-h-[60vh]">
        <div className="relative flex h-14 w-14">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E85D9A] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-14 w-14 bg-[#E85D9A] items-center justify-center text-white">
            <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v2m0 12v2m8-8h-2M6 12H4m15.364-6.364l-1.414 1.414M7.05 16.95l-1.414 1.414M16.95 16.95l1.414 1.414M7.05 7.05L5.636 5.636" /></svg>
          </span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto animate-fade-in space-y-8">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#E85D9A]/10">
        <div>
          <h1 className="text-4xl font-extrabold text-[#4A1B3C]">
            Welcome home, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E85D9A] to-[#4A1B3C]">{user.displayName}</span>
          </h1>
          <p className="text-[#4A1B3C]/70 mt-2 text-lg">We're glad to see you taking charge of your rhythm today.</p>
        </div>
        
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-white hover:bg-[#FDF8F9] text-[#4A1B3C] py-2 px-6 rounded-xl font-semibold shadow-[0_4px_12px_rgba(232,93,154,0.1)] border border-[#E85D9A]/20 transition-all duration-300 hover:shadow-[0_6px_16px_rgba(232,93,154,0.15)] hover:-translate-y-0.5"
        >
          <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          Sign Out
        </button>
      </div>

      {/* Cards Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Cycle Overview Card */}
        <div className="col-span-1 md:col-span-2 bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgba(232,93,154,0.06)] border border-[#E85D9A]/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#E85D9A]/10 to-transparent rounded-bl-full transition-transform duration-500 group-hover:scale-110" />
          <h2 className="text-2xl font-bold text-[#4A1B3C] mb-2">Cycle Overview</h2>
          <p className="text-[#4A1B3C]/60 mb-8">Your modules will activate your tracker data right here.</p>
          
          <div className="flex items-center justify-center p-12 border-2 border-dashed border-[#E85D9A]/20 rounded-2xl bg-[#FDF8F9]/50">
            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-[#E85D9A]">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <p className="text-[#4A1B3C] font-semibold">Start Tracking</p>
              <p className="text-sm text-[#4A1B3C]/60 mt-1">Log your first day to unlock predictions</p>
            </div>
          </div>
        </div>

        {/* Daily Insights Card */}
        <div className="bg-gradient-to-br from-[#E85D9A] to-[#4A1B3C] p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djI2aDItMjZWMzZoLTJWMEgwaDJWMzRoMzR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20 pointer-events-none" />
          <h2 className="text-2xl font-bold mb-2">Daily Hint</h2>
          <p className="text-white/80 text-sm mb-6">Personalized for you</p>
          
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <svg className="w-8 h-8 mb-4 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            <p className="leading-relaxed font-medium">Hydration helps reduce cramps. Try to hit your 2L target today, {user.displayName}!</p>
          </div>
        </div>

      </div>

    </div>
  );
}
