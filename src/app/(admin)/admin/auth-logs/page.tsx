'use client';

import { useState, useEffect } from 'react';
import type { AuthLogEntry } from '@/types/admin';

export default function AuthLogsPage() {
  const [logs, setLogs] = useState<AuthLogEntry[]>([]);
  const [suspiciousIps, setSuspiciousIps] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/auth-logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
        setSuspiciousIps(data.suspiciousIps || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const t = setInterval(fetchLogs, 60000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-extrabold text-[#4A1B3C]">Auth Logs</h2>

      {suspiciousIps.length > 0 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800 font-bold">
          Warning: Suspicious IPs detected (5+ failures in last hour): {suspiciousIps.join(', ')}
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-[#E85D9A]/10 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase">Timestamp</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase">Event</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase">User ID</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {logs.map(l => (
              <tr key={l.id} className={`hover:bg-gray-50/50 ${l.success ? '' : 'bg-red-50/30'}`}>
                <td className="p-4 text-sm font-mono text-gray-500">{new Date(l.created_at).toLocaleString()}</td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${l.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {l.event_type}
                  </span>
                </td>
                <td className="p-4 font-mono text-xs">{l.user_id.split('-')[0]}</td>
                <td className="p-4 text-sm">{l.ip_address}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
