'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { InstallBanner } from '@/components/pwa/InstallBanner';
import { useState, useEffect, useRef } from 'react';
import Dock from '@/components/ui/Dock';

function partsToName(email: string) {
  return email.split('@')[0];
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [userInitials, setUserInitials] = useState('');
  const [userName, setUserName] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data?.user?.role === 'admin') {
          setIsAdmin(true);
        }
        const name = data?.user?.displayName || data?.user?.email || '';
        if (name) {
          setUserName(data?.user?.displayName || partsToName(name));
          const parts = name.split(/[\s@]+/);
          const initials = parts.length >= 2
            ? (parts[0][0] + parts[1][0]).toUpperCase()
            : name.slice(0, 2).toUpperCase();
          setUserInitials(initials);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const navItems = [
    { name: 'Home', href: '/dashboard', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><path d="M12 16.5l-2.5-2.5a1.5 1.5 0 0 1 2.12-2.12l.38.38.38-.38a1.5 1.5 0 0 1 2.12 2.12L12 16.5z" fill="currentColor" stroke="none"></path></svg> },
    { name: 'Calendar', href: '/cycles', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><circle cx="12" cy="15" r="1.5" fill="currentColor" stroke="none"></circle></svg> },
    { name: 'History', href: '/history', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> },
    { name: 'Chat', href: '/chat', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path><circle cx="15" cy="9" r="1.5" fill="currentColor" stroke="none"></circle></svg> },
    { name: 'Privacy', href: '/privacy', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg> },
  ];

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : hour < 21 ? 'Good evening' : 'Good night';

  return (
    <div className="min-h-screen font-sans" style={{ background: '#FDF8FA' }}>
      <div className="mx-auto pt-4 px-4 md:px-8 pb-[100px] relative w-full max-w-[480px] md:max-w-5xl">
        
        {/* Header Bar */}
        <div className="flex justify-between w-full mb-6 items-center">
          <div className="flex flex-col">
            {pathname === '/dashboard' && (
              <>
                <h1 className="text-[16px] font-bold text-[#1A0A12] leading-tight">
                  {greeting}, {userName || 'User'}
                </h1>
                <p className="text-[11px] text-[#9E7A8A] font-semibold mt-0.5">{dateStr}</p>
              </>
            )}
          </div>

          <div className="flex gap-2 items-center">
            {isAdmin && (
              <Link href="/admin" className="flex items-center gap-1.5 text-xs font-bold text-white hover:text-white transition-colors px-3 py-1.5 bg-[#4A1B3C] hover:bg-[#3A142F] rounded-full shadow-sm">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>
                Admin Panel
              </Link>
            )}

            {/* User Avatar Badge */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E85D9A] to-[#D93F7D] text-white font-bold text-sm flex items-center justify-center shadow-lg hover:shadow-xl transition-all ring-2 ring-white active:scale-95"
                title="Account"
              >
                {userInitials || '?'}
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-[#E85D9A]/10 py-2 z-50 animate-fade-in">
                  <button
                    onClick={() => { router.push('/profile'); setShowUserMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-[#4A1B3C] hover:bg-[#FDF8F9] transition-colors"
                  >
                    <svg className="w-4 h-4 text-[#4A1B3C]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z" /><circle cx="12" cy="12" r="3" /></svg>
                    Settings
                  </button>
                  <div className="mx-3 border-t border-gray-100" />
                  <button
                    onClick={() => { handleLogout(); setShowUserMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                    Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <InstallBanner />
        {children}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 pointer-events-none mx-auto z-40 w-full max-w-[480px] md:max-w-5xl" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="pointer-events-auto">
          <Dock 
            items={navItems.map(item => ({
              icon: item.icon,
              label: item.name,
              onClick: () => router.push(item.href),
              className: pathname === item.href ? 'text-[#E85D9A]' : 'text-[#9E7A8A]'
            }))}
            panelHeight={68}
            baseItemSize={50}
            magnification={70}
          />
        </div>
      </nav>
    </div>
  );
}
