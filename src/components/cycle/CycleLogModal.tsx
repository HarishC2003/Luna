'use client';

import { useState } from 'react';
import { FlowIntensity } from '@/types/cycle';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Record<string, unknown>;
}

const FLOWS: FlowIntensity[] = ['spotting', 'light', 'medium', 'heavy'];

export function CycleLogModal({ isOpen, onClose, onSuccess, initialData }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const [start, setStart] = useState(initialData?.period_start || todayStr);
  const [end, setEnd] = useState(initialData?.period_end || '');
  const [flow, setFlow] = useState<FlowIntensity | ''>(initialData?.avg_flow || '');
  const [notes, setNotes] = useState(initialData?.notes || '');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = { periodStart: start };
      if (end) payload.periodEnd = end;
      if (flow) payload.avgFlow = flow;
      if (notes) payload.notes = notes;

      const url = initialData?.id ? `/api/cycles/log/${initialData.id}` : '/api/cycles/log';
      const method = initialData?.id ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#4A1B3C]/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-[#E85D9A]/10 flex justify-between items-center bg-[#FDF8F9]">
          <h2 className="text-xl font-bold text-[#4A1B3C]">
            {initialData ? 'Edit Period' : 'Log Period'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-[#E85D9A]/10 rounded-full text-[#4A1B3C] transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="p-6">
          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">{error}</div>}
          
          <form id="cycleForm" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#4A1B3C] mb-2 uppercase tracking-wide">Started</label>
                  <input type="date" value={start} onChange={e => setStart(e.target.value)} max={todayStr} required className="w-full px-4 py-3 rounded-xl border border-[#E85D9A]/20 focus:border-[#E85D9A] focus:ring-2 focus:ring-[#E85D9A]/20 outline-none text-[#4A1B3C]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#4A1B3C] mb-2 uppercase tracking-wide">Ended (Optional)</label>
                  <input type="date" value={end} onChange={e => setEnd(e.target.value)} min={start} max={todayStr} className="w-full px-4 py-3 rounded-xl border border-[#E85D9A]/20 focus:border-[#E85D9A] focus:ring-2 focus:ring-[#E85D9A]/20 outline-none text-[#4A1B3C]" />
                </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#4A1B3C] mb-3 uppercase tracking-wide">Average Flow</label>
              <div className="flex flex-wrap gap-2">
                {FLOWS.map(f => (
                  <button key={f} type="button" onClick={() => setFlow(flow === f ? '' : f)} className={`px-4 py-2 rounded-xl text-sm font-medium capitalize border transition-all ${flow === f ? 'bg-[#E85D9A] text-white border-[#E85D9A] shadow-md' : 'bg-white text-[#4A1B3C] border-[#E85D9A]/20 hover:border-[#E85D9A]'}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#4A1B3C] mb-2 uppercase tracking-wide">Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} maxLength={500} rows={3} placeholder="Any irregular observations?" className="w-full px-4 py-3 rounded-xl border border-[#E85D9A]/20 focus:border-[#E85D9A] focus:ring-2 focus:ring-[#E85D9A]/20 outline-none text-[#4A1B3C] resize-none" />
            </div>
          </form>
        </div>
        
        <div className="px-6 py-4 border-t border-[#E85D9A]/10 bg-gray-50 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-6 py-2 rounded-xl text-[#4A1B3C] hover:bg-gray-200 font-medium transition-colors">Cancel</button>
          <button type="submit" form="cycleForm" disabled={loading} className="px-8 py-2 rounded-xl bg-[#E85D9A] hover:bg-[#d44d88] text-white font-semibold shadow-md disabled:opacity-50 transition-all">
            {loading ? 'Saving...' : 'Save Period'}
          </button>
        </div>
      </div>
    </div>
  );
}
