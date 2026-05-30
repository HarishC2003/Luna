'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { InstallBanner } from '@/components/pwa/InstallBanner';
import { useState, useEffect, useRef } from 'react';
import { Home, Calendar, Clock, MessageCircle, User } from 'lucide-react';
import NotificationPermission from '@/components/notifications/NotificationPermission';

const tabs = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/cycles', icon: Calendar, label: 'Calendar' },
  { href: '/history', icon: Clock, label: 'History' },
  { href: '/chat', icon: MessageCircle, label: 'Chat' },
  { href: '/profile', icon: User, label: 'Profile' },
];

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

  const activeIndex = tabs.findIndex(t => pathname.startsWith(t.href));
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const navRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const updateIndicator = () => {
      if (navRef.current && activeIndex >= 0) {
        const navWidth = navRef.current.offsetWidth;
        const tabWidth = navWidth / tabs.length;
        setIndicatorStyle({
          left: activeIndex * tabWidth + tabWidth * 0.2,
          width: tabWidth * 0.6,
        });
      }
    };
    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [activeIndex]);

  const handleLogout = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : hour < 21 ? 'Good evening' : 'Good night';

  return (
    <div className="flex flex-col min-h-screen bg-[#FDF8FA]">
      <div className="flex-1 pt-4 px-4 pb-32 relative w-full max-w-[480px] md:max-w-5xl mx-auto flex flex-col">
        
        {/* Header Bar */}
        {!pathname.startsWith('/chat') && (
          <div className="flex justify-between w-full mb-6 items-center flex-shrink-0">
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

              {/* Insights Quick Button */}
              <Link
                href="/insights"
                className="flex items-center gap-1.5 text-xs font-bold text-[#E85D9A] hover:text-white transition-colors px-4 py-2 bg-white hover:bg-[#E85D9A] rounded-full shadow-md border border-[#E85D9A]/20 active:scale-95 group"
                title="Insights"
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" className="text-[#E85D9A] group-hover:text-white transition-colors"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                Insights
              </Link>

              {/* User Avatar Badge */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E85D9A] to-[#D93F7D] text-white font-bold text-sm flex items-center justify-center shadow-lg hover:shadow-xl transition-all ring-2 ring-white active:scale-95 cursor-pointer"
                  title="Account"
                >
                  {userInitials || '?'}
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-[#E85D9A]/10 py-2 z-50 animate-fade-in">
                    <button
                      onClick={() => { router.push('/profile'); setShowUserMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-[#4A1B3C] hover:bg-[#FDF8F9] transition-colors cursor-pointer"
                    >
                      <svg className="w-4 h-4 text-[#4A1B3C]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z" /><circle cx="12" cy="12" r="3" /></svg>
                      Settings
                    </button>
                    <div className="mx-3 border-t border-gray-100" />
                    <button
                      onClick={() => { handleLogout(); setShowUserMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                      Log Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <InstallBanner />
        <main className="flex-1 w-full flex flex-col">
          {children}
        </main>
        <NotificationPermission />
      </div>

      <nav
        ref={navRef}
        className="fixed bottom-0 md:bottom-6 left-0 right-0 bg-white md:bg-white/90 md:backdrop-blur-md border-t md:border border-gray-100 md:rounded-2xl z-40 transition-all duration-300 w-full max-w-[480px] md:max-w-xl mx-auto"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom)',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
        }}
      >
        {/* Sliding indicator */}
        <div
          className="absolute top-0 h-0.5 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full transition-all duration-300 ease-out"
          style={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
          }}
        />

        <div className="flex">
          {tabs.map((tab, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={tab.href}
                onClick={() => router.push(tab.href)}
                className="flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-all duration-200 active:scale-90 cursor-pointer"
              >
                <tab.icon
                  size={22}
                  className="transition-all duration-300"
                  style={{
                    color: isActive ? '#E85D9A' : '#9CA3AF',
                    transform: isActive ? 'scale(1.15)' : 'scale(1)',
                  }}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                <span
                  className="text-[10px] font-medium transition-all duration-300"
                  style={{ color: isActive ? '#E85D9A' : '#9CA3AF' }}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
