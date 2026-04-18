'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data && data.profile && data.profile.role === 'admin') {
          setIsAdmin(true);
        } else {
          window.location.href = '/dashboard';
        }
      })
      .catch(() => window.location.href = '/dashboard')
      .finally(() => setLoading(false));
  }, []);

  const links = [
    { name: 'Overview', href: '/admin' },
    { name: 'Users', href: '/admin/users' },
    { name: 'Auth Logs', href: '/admin/auth-logs' },
    { name: 'Abuse Logs', href: '/admin/abuse-logs' },
    { name: 'Analytics', href: '/admin/analytics' },
    { name: 'Feature Flags', href: '/admin/feature-flags' },
    { name: 'Audit Log', href: '/admin/audit-log' }
  ];

  if (loading) return <div className="text-center p-10">Loading admin...</div>;
  if (!isAdmin) return null;

  return (
    <div className="flex min-h-screen bg-gray-50 flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-[#4A1B3C] text-white flex flex-col items-center py-6 md:sticky top-0 md:h-screen">
        <h1 className="text-2xl font-black mb-10 text-[#E85D9A] tracking-wider uppercase">Luna Admin</h1>
        <nav className="flex flex-col w-full px-4 space-y-2 flex-1">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link key={link.name} href={link.href} className={`px-4 py-3 rounded-xl transition-colors font-semibold ${isActive ? 'bg-[#E85D9A] text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
                {link.name}
              </Link>
            )
          })}
        </nav>
        <div className="w-full px-4 mt-auto">
          <Link href="/dashboard" className="block text-center px-4 py-3 border border-white/20 rounded-xl text-white/50 hover:bg-white/10 transition-colors">
            Back to app
          </Link>
        </div>
      </aside>
      
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 relative">
        {children}
      </main>
    </div>
  );
}
