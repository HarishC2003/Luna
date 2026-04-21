'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export function NavBar() {
  const [compact, setCompact] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setCompact(!entry.isIntersecting);
      },
      { rootMargin: '0px 0px 0px 0px', threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinelRef} className="absolute top-0 w-full h-1" />
      <nav 
        className={`fixed top-0 w-full z-50 transition-all duration-300 bg-white ${
          compact ? 'py-3 shadow-sm border-b-[0.5px] border-gray-200' : 'py-5'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 md:px-6 flex items-center justify-between">
          <Link href="/" className="font-medium text-[20px] text-[#4A1B3C] flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12" stroke="#E85D9A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 2C14.5 5.5 14.5 18.5 12 22" stroke="#E85D9A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 2C9.5 5.5 9.5 18.5 12 22" stroke="#E85D9A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2.5 9H21.5" stroke="#E85D9A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2.5 15H21.5" stroke="#E85D9A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Luna
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/login" className="text-[#4A1B3C]/80 font-medium hover:text-[#4A1B3C] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D9A] rounded-md px-2 py-1">
              Sign in
            </Link>
            <Link href="/register" className="bg-[#E85D9A] text-white px-5 py-2.5 rounded-full font-medium hover:bg-[#d44d88] transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#E85D9A]">
              Get started free
            </Link>
          </div>

          {/* Mobile Nav Toggle */}
          <button 
            className="md:hidden p-2 text-[#4A1B3C]" 
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Nav Menu */}
        {menuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-gray-100 shadow-md py-4 px-4 flex flex-col gap-4 animate-fade-in">
             <Link href="/login" className="text-[#4A1B3C] font-medium p-2 block text-center" onClick={() => setMenuOpen(false)}>
              Sign in
            </Link>
            <Link href="/register" className="bg-[#E85D9A] text-white px-5 py-3 rounded-full font-medium text-center shadow-sm" onClick={() => setMenuOpen(false)}>
              Get started free
            </Link>
          </div>
        )}
      </nav>
    </>
  );
}
