'use client';

import { useState, useEffect } from 'react';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';

export function InstallBanner() {
  const { canInstall, install, isInstalled } = useInstallPrompt();
  const [isIOS, setIsIOS] = useState(() => {
    if (typeof window !== 'undefined') {
      const ua = window.navigator.userAgent;
      return /iPad|iPhone|iPod/.test(ua) && !(window as Window & { MSStream?: unknown }).MSStream;
    }
    return false;
  });

  const [show, setShow] = useState(() => {
    if (typeof window !== 'undefined') {
      if (isInstalled) return false;
      const dismissed = sessionStorage.getItem('luna_install_dismissed');
      if (dismissed === 'true') return false;
      return false; // Can't reliably read canInstall synchronously here.
    }
    return false;
  });

  useEffect(() => {
    if (isInstalled) return;
    const dismissed = sessionStorage.getItem('luna_install_dismissed');
    if (dismissed === 'true') return;
    if (!show && (canInstall || isIOS)) {
      setShow(true);
    }
  }, [canInstall, isInstalled, show, isIOS]);

  if (!show) return null;

  const handleDismiss = () => {
    sessionStorage.setItem('luna_install_dismissed', 'true');
    setShow(false);
  };

  return (
    <div className="bg-[#E85D9A] text-white px-4 py-3 sm:px-6 flex items-center justify-between shadow-md mb-4 rounded-xl mx-4 sm:mx-0 mt-4 animate-fade-in relative z-50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#E85D9A] font-bold shadow-sm">
          L
        </div>
        <div>
          <p className="font-semibold text-sm">Get the Luna app</p>
          <p className="text-xs opacity-90">
            {isIOS 
              ? "Tap share, then 'Add to Home Screen'" 
              : "Install for the best experience"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {!isIOS && canInstall && (
          <button 
            onClick={install} 
            className="px-4 py-1.5 bg-white text-[#E85D9A] text-sm font-bold rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
          >
            Install
          </button>
        )}
        <button onClick={handleDismiss} className="p-2 -mr-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
    </div>
  );
}
