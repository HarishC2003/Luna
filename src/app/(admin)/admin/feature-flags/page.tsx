'use client';

import { useState, useEffect, useCallback } from 'react';
import type { FeatureFlag } from '@/types/admin';

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFlags = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/feature-flags');
    if (res.ok) setFlags(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    void fetchFlags();
  }, [fetchFlags]);

  const toggleFlag = async (key: string, current: boolean) => {
    if (key === 'maintenance_mode' && !current) {
      const confirm = window.confirm('WARNING: Activating Maintenance Mode will lock out all non-admin users immediately. Are you absolutely sure?');
      if (!confirm) return;
    }

    const res = await fetch(`/api/admin/feature-flags/${key}`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled: !current })
    });
    if (res.ok) {
      setFlags(flags.map(f => f.key === key ? { ...f, enabled: !current } : f));
    } else {
      alert((await res.json()).error);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-extrabold text-[#4A1B3C]">Feature Flags</h2>
      <p className="text-gray-500">Enable or disable core system features dynamically without a deployment.</p>
      
      {loading ? <div className="animate-pulse">Loading...</div> : (
        <div className="grid gap-4">
          {flags.map(flag => (
            <div key={flag.key} className={`bg-white p-6 rounded-3xl shadow-sm border ${flag.key === 'maintenance_mode' && flag.enabled ? 'border-red-500 bg-red-50' : 'border-[#E85D9A]/10'}`}>
              <div className="flex justify-between items-start">
                <div className="flex-1 pr-4">
                  <h3 className="text-lg font-bold text-[#4A1B3C] mb-1">{flag.key}</h3>
                  <p className="text-sm text-gray-600 mb-2">{flag.description}</p>
                  <p className="text-xs text-gray-400">
                    Last updated by <span className="font-semibold">{flag.updated_by_email || 'System'}</span> on {new Date(flag.updated_at).toLocaleString()}
                  </p>
                </div>
                <button 
                  onClick={() => toggleFlag(flag.key, flag.enabled)}
                  className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${flag.enabled ? 'bg-[#E85D9A]' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${flag.enabled ? 'translate-x-8' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
