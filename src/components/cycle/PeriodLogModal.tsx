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

import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

export function PeriodLogModal({ isOpen, onClose, onSuccess, initialData }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [todayStr] = useState(() => new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState(() => initialData?.period_start || todayStr);
  const [endDate, setEndDate] = useState(() => initialData?.period_end || '');
  const [flow, setFlow] = useState<FlowIntensity | ''>(() => initialData?.avg_flow || '');
  const [notes, setNotes] = useState(() => initialData?.notes || '');

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
    <Modal isOpen={isOpen} onClose={onClose} title="Log Period">
      <div className="mb-6 -mt-2">
        <p className="text-sm font-medium text-gray-500">Track your flow and period dates.</p>
      </div>
      
      {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm animate-fade-in">{error}</div>}
      
      <form id="periodForm" onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Start Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} max={todayStr} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#E85D9A] focus:ring-2 focus:ring-pink-100 outline-none text-gray-900 transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">End Date</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} max={todayStr} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#E85D9A] focus:ring-2 focus:ring-pink-100 outline-none text-gray-900 transition-colors" />
            <p className="text-[10px] text-gray-500 mt-1">Leave blank if still ongoing</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Flow Intensity</label>
          <div className="flex flex-wrap gap-2">
            {FLOWS.map(f => (
              <button key={f} type="button" onClick={() => setFlow(flow === f ? '' : f)} className={`px-4 py-2 rounded-xl text-sm font-medium capitalize border transition-all active:scale-95 ${flow === f ? 'bg-gradient-to-r from-[#E85D9A] to-[#D93F7D] text-white border-transparent shadow-md animate-scale-bounce' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} maxLength={500} rows={3} placeholder="Any specific period notes..." className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#E85D9A] focus:ring-2 focus:ring-pink-100 outline-none text-gray-900 resize-none transition-colors" />
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" loading={loading}>Save Period</Button>
        </div>
      </form>
    </Modal>
  );
}
