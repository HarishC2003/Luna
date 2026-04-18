'use client';

import { useEffect, useState } from 'react';

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<any>(null);
  const [authLogs, setAuthLogs] = useState<any[]>([]);

  const fetchOverview = async () => {
    try {
      const statsRes = await fetch('/api/admin/stats');
      if (statsRes.ok) setStats(await statsRes.json());

      const logsRes = await fetch('/api/admin/auth-logs?limit=10');
      if (logsRes.ok) setAuthLogs((await logsRes.json()).logs);
    } catch {}
  };

  useEffect(() => {
    fetchOverview();
    const interval = setInterval(fetchOverview, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!stats) return <div className="animate-pulse">Loading dashboard...</div>;

  return (
    <div className="space-y-8 animate-fade-in">
      <h2 className="text-3xl font-extrabold text-[#4A1B3C]">Overview</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: stats.totalUsers },
          { label: 'New Today', value: stats.newUsersToday },
          { label: 'Active this Week', value: stats.activeThisWeek },
          { label: 'Cycle Logs', value: stats.totalCycleLogs },
          { label: 'Notifications Sent', value: stats.notificationsSentToday },
          { label: 'Pending Deletions', value: stats.pendingDeletions },
          { label: 'Suspended Users', value: stats.suspendedUsers },
          { label: 'Crisis Events (All Time)', value: stats.crisisDetectedTotal, danger: true }
        ].map((s, i) => (
          <div key={i} className={`bg-white p-6 rounded-3xl shadow-sm border ${s.danger ? 'border-red-500' : 'border-[#E85D9A]/10'}`}>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{s.label}</p>
            <p className={`text-4xl font-black mt-2 ${s.danger ? 'text-red-500' : 'text-[#E85D9A]'}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#E85D9A]/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-[#4A1B3C]">Live Auth Feed</h3>
          <span className="flex items-center text-xs text-green-500 font-bold bg-green-50 px-2 py-1 rounded-full">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
            LIVE
          </span>
        </div>
        <div className="space-y-3">
          {authLogs.map(log => (
            <div key={log.id} className="flex justify-between items-center text-sm p-3 bg-gray-50 rounded-xl">
              <div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold mr-2 ${log.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {log.event_type}
                </span>
                <span className="text-gray-600 font-mono text-xs">{log.user_id.split('-')[0]}</span>
              </div>
              <span className="text-xs text-gray-400">{new Date(log.created_at).toLocaleTimeString()}</span>
            </div>
          ))}
          {authLogs.length === 0 && <p className="text-gray-400 text-sm">No activity</p>}
        </div>
      </div>
    </div>
  );
}
