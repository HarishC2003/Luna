'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { InstallBanner } from '@/components/pwa/InstallBanner';
import { useState, useEffect } from 'react';
import Dock from '@/components/ui/Dock';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data?.user?.role === 'admin') {
          setIsAdmin(true);
        }
      })
      .catch(() => {});
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
    { name: 'Profile', href: '/profile', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> },
  ];

  return (
    <div className="min-h-screen font-sans" style={{ background: '#FDF8FA' }}>
      <div className="mx-auto pt-4 px-4 md:px-8 pb-[100px] relative w-full max-w-[480px] md:max-w-5xl">
        <div className="flex justify-end w-full mb-2 gap-2">
          {isAdmin && (
            <Link href="/admin" className="flex items-center gap-1.5 text-xs font-bold text-white hover:text-white transition-colors px-3 py-1.5 bg-[#4A1B3C] hover:bg-[#3A142F] rounded-full shadow-sm">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>
              Admin Panel
            </Link>
          )}
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs font-bold text-[#4A1B3C]/60 hover:text-[#E85D9A] transition-colors px-3 py-1.5 bg-white/60 hover:bg-white rounded-full shadow-sm backdrop-blur-sm">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            Log Out
          </button>
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
