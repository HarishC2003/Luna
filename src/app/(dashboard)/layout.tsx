'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Home', href: '/dashboard', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
    { name: 'Calendar', href: '/cycles', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
    { name: 'History', href: '/history', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
    { name: 'Profile', href: '#', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
  ];

  return (
    <div className="min-h-screen bg-[#FDF8F9] flex flex-col">
      <nav className="bg-white border-b border-[#E85D9A]/20 px-6 py-4 fixed top-0 w-full z-10">
        <div className="flex items-center space-x-2">
          <span className="text-2xl font-bold text-[#E85D9A]">Luna</span>
        </div>
      </nav>
      
      <main className="flex-1 w-full max-w-7xl mx-auto pt-20 pb-24 px-4 sm:px-6 relative">
        {children}
      </main>

      <div className="fixed bottom-0 w-full bg-white border-t border-[#E85D9A]/20 pb-safe z-40">
        <div className="max-w-md mx-auto flex justify-between items-center px-6 py-3">
          {navItems.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href} className={`flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-[#E85D9A]' : 'text-[#4A1B3C]/50 hover:text-[#4A1B3C]'}`}>
                <div className={`${isActive ? 'transform scale-110' : ''} transition-transform`}>{item.icon}</div>
                <span className="text-[10px] font-semibold uppercase tracking-wider">{item.name}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  );
}
