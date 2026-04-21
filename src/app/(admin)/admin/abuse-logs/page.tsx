'use client';

import { useState, useEffect } from 'react';
import type { AbuseLogEntry } from '@/types/admin';

export default function AbuseLogsPage() {
  const [logs, setLogs] = useState<AbuseLogEntry[]>([]);
  const [reviewedFilter, setReviewedFilter] = useState('false');

  const fetchLogs = async () => {
    const res = await fetch(`/api/admin/abuse-logs?reviewed=${reviewedFilter}`);
    if (res.ok) setLogs((await res.json()).logs);
  };

  useEffect(() => {
    fetchLogs();
  }, [reviewedFilter]);

  const review = async (id: string, action: string) => {
    const notes = prompt('Any notes? (Max 300 chars)');
    if (notes !== null) {
      await fetch(`/api/admin/abuse-logs/${id}/review`, { method: 'PATCH', body: JSON.stringify({ action, notes }) });
      fetchLogs();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-extrabold text-[#4A1B3C] mb-2">Abuse & Crisis Logs</h2>
          <p className="text-sm text-gray-500">User IDs are partially anonymized. Message content is never stored.</p>
        </div>
        <select value={reviewedFilter} onChange={e => setReviewedFilter(e.target.value)} className="p-2 border rounded-xl">
          <option value="false">Unreviewed</option>
          <option value="true">Reviewed</option>
          <option value="">All</option>
        </select>
      </div>

      <div className="grid gap-4">
        {logs.map(l => (
          <div key={l.id} className="bg-white p-6 rounded-3xl shadow-sm border border-[#E85D9A]/10">
            <div className="flex justify-between mb-4">
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${l.severity === 'high' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>{l.severity.toUpperCase()} / {l.reason}</span>
              <span className="text-xs text-gray-500">{new Date(l.created_at).toLocaleString()}</span>
            </div>
            <div className="text-sm border-l-2 border-[#E85D9A]/30 pl-3 py-1 mb-4 text-[#4A1B3C]">
              User Session: <span className="font-mono">{l.user_id}</span>
            </div>
            
            {!l.metadata?.reviewed ? (
              <div className="flex gap-2">
                <button onClick={() => review(l.id, 'reviewed')} className="px-4 py-1.5 bg-gray-100 text-[#4A1B3C] font-bold rounded-lg text-sm hover:bg-gray-200">Mark Reviewed</button>
                <button onClick={() => review(l.id, 'escalated')} className="px-4 py-1.5 bg-red-100 text-red-700 font-bold rounded-lg text-sm hover:bg-red-200">Escalate</button>
              </div>
            ) : (
              <div className="text-sm text-green-700 bg-green-50 p-2 rounded-lg inline-block font-bold">
                Reviewed via {String(l.metadata.action)}
                {(l.metadata.notes && typeof l.metadata.notes === 'string') ? (
                  <span className="block mt-1 font-normal text-green-600 text-xs">Note: {l.metadata.notes}</span>
                ) : null}
              </div>
            )}
          </div>
        ))}
        {logs.length === 0 && <p className="text-gray-500">No logs match the criteria.</p>}
      </div>
    </div>
  );
}
