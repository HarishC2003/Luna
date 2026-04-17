'use client';

import { useState } from 'react';
import { Mood, FlowIntensity, Symptom } from '@/types/cycle';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedDate?: string;
  initialData?: Record<string, unknown>;
}

const MOODS: { val: Mood, icon: string, label: string }[] = [
  { val: 'great', icon: '✨', label: 'Great' },
  { val: 'good', icon: '😊', label: 'Good' },
  { val: 'okay', icon: '😐', label: 'Okay' },
  { val: 'low', icon: '😔', label: 'Low' },
  { val: 'terrible', icon: '😫', label: 'Terrible' },
];

const FLOWS: FlowIntensity[] = ['none', 'spotting', 'light', 'medium', 'heavy'];
const SYMPTOMS: Symptom[] = ['cramps', 'headache', 'bloating', 'breast_tenderness', 'fatigue', 'acne', 'back_pain', 'nausea', 'mood_swings', 'insomnia'];

export function DailyLogModal({ isOpen, onClose, onSuccess, selectedDate, initialData }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(selectedDate || todayStr);
  const [mood, setMood] = useState<Mood | ''>(initialData?.mood || '');
  const [energy, setEnergy] = useState<number | ''>(initialData?.energy || '');
  const [flow, setFlow] = useState<FlowIntensity | ''>(initialData?.flow || '');
  const [symptoms, setSymptoms] = useState<Symptom[]>(initialData?.symptoms || []);
  const [notes, setNotes] = useState(initialData?.notes || '');

  if (!isOpen) return null;

  const toggleSymptom = (s: Symptom) => {
    if (symptoms.includes(s)) {
      setSymptoms(symptoms.filter(x => x !== s));
    } else {
      if (symptoms.length < 10) setSymptoms([...symptoms, s]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = { logDate: date };
      if (mood) payload.mood = mood;
      if (energy) payload.energy = energy;
      if (flow) payload.flow = flow;
      if (symptoms.length) payload.symptoms = symptoms;
      if (notes) payload.notes = notes;

      const res = await fetch('/api/daily-log', {
        method: 'POST',
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
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-[#E85D9A]/10 flex justify-between items-center bg-[#FDF8F9]">
          <h2 className="text-xl font-bold text-[#4A1B3C]">Log your day</h2>
          <button onClick={onClose} className="p-2 hover:bg-[#E85D9A]/10 rounded-full text-[#4A1B3C] transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">{error}</div>}
          
          <form id="dailyForm" onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="block text-sm font-semibold text-[#4A1B3C] mb-2 uppercase tracking-wide">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} max={todayStr} required className="w-full px-4 py-3 rounded-xl border border-[#E85D9A]/20 focus:border-[#E85D9A] focus:ring-2 focus:ring-[#E85D9A]/20 outline-none text-[#4A1B3C]" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#4A1B3C] mb-3 uppercase tracking-wide">Flow</label>
              <div className="flex flex-wrap gap-2">
                {FLOWS.map(f => (
                  <button key={f} type="button" onClick={() => setFlow(flow === f ? '' : f)} className={`px-4 py-2 rounded-xl text-sm font-medium capitalize border transition-all ${flow === f ? 'bg-[#E85D9A] text-white border-[#E85D9A] shadow-md' : 'bg-white text-[#4A1B3C] border-[#E85D9A]/20 hover:border-[#E85D9A]'}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#4A1B3C] mb-3 uppercase tracking-wide">Mood</label>
              <div className="flex justify-between sm:justify-start sm:gap-4">
                {MOODS.map(m => (
                  <button key={m.val} type="button" onClick={() => setMood(mood === m.val ? '' : m.val)} className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${mood === m.val ? 'bg-[#FDF8F9] ring-2 ring-[#E85D9A] shadow-sm transform scale-105' : 'hover:bg-gray-50 opacity-70 grayscale hover:grayscale-0 font-medium'}`}>
                    <span className="text-3xl">{m.icon}</span>
                    <span className={`text-xs ${mood === m.val ? 'text-[#E85D9A] font-bold' : 'text-[#4A1B3C]'}`}>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#4A1B3C] mb-3 uppercase tracking-wide">Energy Level</label>
              <div className="flex gap-2">
                {[1,2,3,4,5].map(num => (
                  <button key={num} type="button" onClick={() => setEnergy(energy === num ? '' : num)} className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg transition-all ${energy === num ? 'bg-amber-400 text-white shadow-lg transform scale-110' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                    ⚡
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#4A1B3C] mb-3 uppercase tracking-wide">Symptoms</label>
              <div className="flex flex-wrap gap-2">
                {SYMPTOMS.map(s => (
                  <button key={s} type="button" onClick={() => toggleSymptom(s)} className={`px-3 py-1.5 rounded-lg text-sm transition-all capitalize border ${symptoms.includes(s) ? 'bg-[#4A1B3C] text-white border-[#4A1B3C]' : 'bg-white text-[#4A1B3C]/70 border-gray-200 hover:border-[#4A1B3C]/30'}`}>
                    {s.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#4A1B3C] mb-2 uppercase tracking-wide">Journal Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} maxLength={300} rows={3} placeholder="How was your day?" className="w-full px-4 py-3 rounded-xl border border-[#E85D9A]/20 focus:border-[#E85D9A] focus:ring-2 focus:ring-[#E85D9A]/20 outline-none text-[#4A1B3C] resize-none" />
            </div>
          </form>
        </div>
        
        <div className="px-6 py-4 border-t border-[#E85D9A]/10 bg-gray-50 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-6 py-2 rounded-xl text-[#4A1B3C] hover:bg-gray-200 font-medium transition-colors">Cancel</button>
          <button type="submit" form="dailyForm" disabled={loading} className="px-8 py-2 rounded-xl bg-[#E85D9A] hover:bg-[#d44d88] text-white font-semibold shadow-md disabled:opacity-50 transition-all flex items-center justify-center">
            {loading ? <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : 'Save Log'}
          </button>
        </div>
      </div>
    </div>
  );
}
