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

export function CycleLogModal({ isOpen, onClose, onSuccess, initialData }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [todayStr] = useState(() => new Date().toISOString().split('T')[0]);
  const [start, setStart] = useState(() => initialData?.period_start ? initialData.period_start.split('T')[0] : new Date().toISOString().split('T')[0]);
  const [end, setEnd] = useState(() => initialData?.period_end ? initialData.period_end.split('T')[0] : '');
  const [flow, setFlow] = useState<FlowIntensity | ''>(() => (initialData?.avg_flow || '') as FlowIntensity | '');
  const [notes, setNotes] = useState(() => initialData?.notes || '');



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

  const handleDelete = async () => {
    if (!initialData?.id) return;
    if (!confirm('Are you sure you want to delete this log? This will recalculate your predictions.')) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/cycles/log/${initialData.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Period' : 'Log Period'}>
      {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm animate-fade-in">{error}</div>}
      
      <form id="cycleForm" onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#4A1B3C] mb-2 uppercase tracking-wide">Started</label>
              <input type="date" value={start} onChange={e => setStart(e.target.value)} max={todayStr} required className="w-full px-4 py-3 rounded-xl border border-[#E85D9A]/20 focus:border-[#E85D9A] focus:ring-2 focus:ring-[#E85D9A]/20 outline-none text-[#4A1B3C] transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#4A1B3C] mb-2 uppercase tracking-wide">Ended (Optional)</label>
              <input type="date" value={end} onChange={e => setEnd(e.target.value)} min={start} max={todayStr} className="w-full px-4 py-3 rounded-xl border border-[#E85D9A]/20 focus:border-[#E85D9A] focus:ring-2 focus:ring-[#E85D9A]/20 outline-none text-[#4A1B3C] transition-colors" />
            </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#4A1B3C] mb-3 uppercase tracking-wide">Average Flow</label>
          <div className="flex flex-wrap gap-2">
            {FLOWS.map(f => (
              <button key={f} type="button" onClick={() => setFlow(flow === f ? '' : f)} className={`px-4 py-2 rounded-xl text-sm font-medium capitalize border transition-all active:scale-95 ${flow === f ? 'bg-gradient-to-r from-[#E85D9A] to-[#D93F7D] text-white border-transparent shadow-md animate-scale-bounce' : 'bg-white text-[#4A1B3C] border-[#E85D9A]/20 hover:border-[#E85D9A]'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#4A1B3C] mb-2 uppercase tracking-wide">Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} maxLength={500} rows={3} placeholder="Any irregular observations?" className="w-full px-4 py-3 rounded-xl border border-[#E85D9A]/20 focus:border-[#E85D9A] focus:ring-2 focus:ring-[#E85D9A]/20 outline-none text-[#4A1B3C] resize-none transition-colors" />
        </div>
      </form>
      
      <div className="pt-4 mt-6 border-t border-gray-100 flex justify-between items-center gap-3">
        {initialData?.id ? (
          <Button type="button" variant="danger" onClick={handleDelete} disabled={loading} icon={<svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}>
             Delete
          </Button>
        ) : <div></div>}
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="cycleForm" variant="primary" loading={loading}>
            {initialData?.id ? 'Update' : 'Save'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
