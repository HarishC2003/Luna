'use client';

import { useState } from 'react';
import { FlowIntensity, CycleLog } from '@/types/cycle';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Partial<CycleLog>;
}

const FLOWS: FlowIntensity[] = ['spotting', 'light', 'medium', 'heavy'];

export function PeriodLogModal({ isOpen, onClose, onSuccess, initialData }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [todayStr] = useState(() => new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState(() => initialData?.period_start || todayStr);
  const [endDate, setEndDate] = useState(() => initialData?.period_end || '');
  const [flow, setFlow] = useState<FlowIntensity | ''>(() => initialData?.avg_flow || '');
  const [notes, setNotes] = useState(() => initialData?.notes || '');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = {
        periodStart: startDate,
      };
      if (endDate) payload.periodEnd = endDate;
      if (flow) payload.avgFlow = flow;
      if (notes) payload.notes = notes;

      const isEdit = !!initialData?.id;
      const url = isEdit ? `/api/cycles/log/${initialData.id}` : '/api/cycles/log';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save period log');
      
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#4A1B3C]/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-red-500/10 bg-red-50">
          <div className="flex justify-between items-center mb-1">
            <h2 className="text-xl font-bold text-red-900">Log Period</h2>
            <button onClick={onClose} className="p-2 hover:bg-red-200/50 rounded-full text-red-900 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <p className="text-sm font-medium text-red-700">Track your flow and period dates.</p>
        </div>

        <div className="p-6">
          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">{error}</div>}
          
          <form id="periodForm" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-red-900 mb-2 uppercase tracking-wide">Start Date</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} max={todayStr} required className="w-full px-4 py-3 rounded-xl border border-red-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none text-red-900" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-red-900 mb-2 uppercase tracking-wide">End Date</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} max={todayStr} className="w-full px-4 py-3 rounded-xl border border-red-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none text-red-900" />
                <p className="text-[10px] text-red-600 mt-1">Leave blank if still ongoing</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-red-900 mb-3 uppercase tracking-wide">Flow Intensity</label>
              <div className="flex flex-wrap gap-2">
                {FLOWS.map(f => (
                  <button key={f} type="button" onClick={() => setFlow(flow === f ? '' : f)} className={`px-4 py-2 rounded-xl text-sm font-medium capitalize border transition-all ${flow === f ? 'bg-red-500 text-white border-red-500 shadow-md' : 'bg-white text-red-900 border-red-200 hover:border-red-300'}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-red-900 mb-2 uppercase tracking-wide">Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} maxLength={500} rows={3} placeholder="Any specific period notes..." className="w-full px-4 py-3 rounded-xl border border-red-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none text-red-900 resize-none" />
            </div>
          </form>
        </div>
        
        <div className="px-6 py-4 border-t border-red-100 bg-gray-50 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-6 py-2 rounded-xl text-red-900 hover:bg-gray-200 font-medium transition-colors">Cancel</button>
          <button type="submit" form="periodForm" disabled={loading} className="px-8 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold shadow-md disabled:opacity-50 transition-all flex items-center justify-center">
            {loading ? 'Saving...' : 'Save Period'}
          </button>
        </div>
      </div>
    </div>
  );
}
