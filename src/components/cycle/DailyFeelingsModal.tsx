'use client';

import { useState, useEffect } from 'react';
import { Mood, Symptom, DailyLog } from '@/types/cycle';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newBadges?: string[]) => void;
  selectedDate?: string;
  initialData?: Partial<DailyLog>;
}

const MOODS: { val: Mood, icon: string, label: string }[] = [
  { val: 'great', icon: '✨', label: 'Great' },
  { val: 'good', icon: '😊', label: 'Good' },
  { val: 'okay', icon: '😐', label: 'Okay' },
  { val: 'low', icon: '😔', label: 'Low' },
  { val: 'terrible', icon: '😫', label: 'Terrible' },
];

const SYMPTOMS: Symptom[] = ['cramps', 'headache', 'bloating', 'breast_tenderness', 'fatigue', 'acne', 'back_pain', 'nausea', 'mood_swings', 'insomnia'];
const EXERCISE_TYPES = ['walking', 'yoga', 'gym', 'none'] as const;

import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

export function DailyFeelingsModal({ isOpen, onClose, onSuccess, selectedDate, initialData }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [todayStr] = useState(() => new Date().toISOString().split('T')[0]);
  const [date, setDate] = useState(() => selectedDate || (initialData?.log_date ? initialData.log_date.split('T')[0] : todayStr));
  const [mood, setMood] = useState<Mood | ''>(() => initialData?.mood || '');
  const [energy, setEnergy] = useState<number | ''>(() => initialData?.energy || '');
  const [sleepQuality, setSleepQuality] = useState<number | ''>(() => initialData?.sleep_quality || '');
  const [stressLevel, setStressLevel] = useState<number | ''>(() => (initialData?.stress_level !== undefined && initialData?.stress_level !== null) ? initialData.stress_level : '');
  const [exercise, setExercise] = useState<boolean>(() => !!initialData?.exercise);
  const [exerciseType, setExerciseType] = useState<string>(() => (initialData?.exercise_type && initialData.exercise_type !== 'none') ? initialData.exercise_type : 'walking');
  const [symptoms, setSymptoms] = useState<Symptom[]>(() => initialData?.symptoms || []);
  const [notes, setNotes] = useState(() => initialData?.notes || '');
  const [waterGlasses, setWaterGlasses] = useState<number | ''>(() => (initialData as Record<string, unknown>)?.water_glasses as number ?? 0);
  const [customSymptom, setCustomSymptom] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDate(selectedDate || (initialData?.log_date ? initialData.log_date.split('T')[0] : todayStr));
      setMood(initialData?.mood || '');
      setEnergy(initialData?.energy || '');
      setSleepQuality(initialData?.sleep_quality || '');
      setStressLevel((initialData?.stress_level !== undefined && initialData?.stress_level !== null) ? initialData.stress_level : '');
      setExercise(!!initialData?.exercise);
      setExerciseType((initialData?.exercise_type && initialData.exercise_type !== 'none') ? initialData.exercise_type : 'walking');
      setSymptoms(initialData?.symptoms || []);
      setNotes(initialData?.notes || '');
      setWaterGlasses((initialData as Record<string, unknown>)?.water_glasses as number ?? 0);
      setCustomSymptom('');
      setError(null);
    }
  }, [isOpen, selectedDate, initialData, todayStr]);

  const toggleSymptom = (s: string) => {
    if (symptoms.includes(s as Symptom)) {
      setSymptoms(symptoms.filter(x => x !== s));
    } else {
      if (symptoms.length < 10) setSymptoms([...symptoms, s as Symptom]);
    }
  };

  const addCustomSymptom = () => {
    const trimmed = customSymptom.trim().toLowerCase();
    if (trimmed && !symptoms.includes(trimmed as Symptom)) {
      if (symptoms.length < 10) {
        setSymptoms([...symptoms, trimmed as Symptom]);
      }
      setCustomSymptom('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = { logDate: date, flow: 'none' };
      if (mood) payload.mood = mood;
      if (energy) payload.energy = energy;
      if (sleepQuality) payload.sleep_quality = sleepQuality;
      if (stressLevel !== '') payload.stress_level = stressLevel;
      if (waterGlasses !== '') payload.waterGlasses = Number(waterGlasses);
      payload.exercise = exercise;
      if (exercise) payload.exercise_type = exerciseType;
      if (symptoms.length) payload.symptoms = symptoms;
      if (notes) payload.notes = notes;

      const isEdit = !!initialData?.id;
      const url = isEdit ? `/api/history/${initialData.id}` : '/api/daily-log';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      
      onSuccess(data.newBadges);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log your feelings">
      <div className="mb-6 -mt-2">
        <p className="text-sm font-medium text-[#9E7A8A]">Track your mood, energy, sleep and symptoms.</p>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm animate-fade-in">{error}</div>}
      
      <form id="dailyForm" onSubmit={handleSubmit} className="space-y-8">
        <div>
          <label className="block text-sm font-semibold text-[#4A1B3C] mb-2 uppercase tracking-wide">Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} max={todayStr} required className="w-full px-4 py-3 rounded-xl border border-[#E85D9A]/20 focus:border-[#E85D9A] focus:ring-2 focus:ring-[#E85D9A]/20 outline-none text-[#4A1B3C] transition-colors" />
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#4A1B3C] mb-3 uppercase tracking-wide">Mood</label>
          <div className="flex justify-between sm:justify-start sm:gap-4">
            {MOODS.map(m => (
              <button key={m.val} type="button" onClick={() => setMood(mood === m.val ? '' : m.val)} className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all active:scale-95 ${mood === m.val ? 'bg-[#FDF8F9] ring-2 ring-[#E85D9A] shadow-sm transform scale-105 animate-scale-bounce' : 'hover:bg-gray-50 opacity-70 grayscale hover:grayscale-0 font-medium'}`}>
                <span className="text-3xl">{m.icon}</span>
                <span className={`text-xs ${mood === m.val ? 'text-[#E85D9A] font-bold' : 'text-[#4A1B3C]'}`}>{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-[#4A1B3C] mb-3 uppercase tracking-wide">Energy</label>
            <div className="flex gap-1 flex-wrap">
              {[1,2,3,4,5].map(num => (
                <button key={num} type="button" onClick={() => setEnergy(energy === num ? '' : num)} className={`w-10 h-10 rounded-xl flex items-center justify-center text-md transition-all active:scale-95 ${energy === num ? 'bg-amber-400 text-white shadow-md transform scale-110 animate-scale-bounce' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                  ⚡
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#4A1B3C] mb-3 uppercase tracking-wide">Sleep</label>
            <div className="flex gap-1 flex-wrap">
              {[1,2,3,4,5].map(num => (
                <button key={num} type="button" onClick={() => setSleepQuality(sleepQuality === num ? '' : num)} className={`w-10 h-10 rounded-xl flex items-center justify-center text-md transition-all active:scale-95 ${sleepQuality === num ? 'bg-indigo-500 text-white shadow-md transform scale-110 animate-scale-bounce' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                  🌙
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#4A1B3C] mb-3 uppercase tracking-wide">Stress Level</label>
          <div className="flex flex-col sm:flex-row gap-2 mb-2">
            <button 
              type="button" 
              onClick={() => setStressLevel(stressLevel === 0 ? '' : 0)} 
              className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 whitespace-nowrap ${stressLevel === 0 ? 'bg-green-500 text-white shadow-md animate-scale-bounce' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
              No Stress
            </button>
            <div className="flex flex-1 gap-1">
              {[1,2,3,4,5].map(num => (
                <button key={num} type="button" onClick={() => setStressLevel(stressLevel === num ? '' : num)} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${stressLevel === num ? 'bg-red-500 text-white shadow-md transform scale-105 animate-scale-bounce' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                  {num}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
            <span>None / Low</span>
            <span>High</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#4A1B3C] mb-3 uppercase tracking-wide">Symptoms</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {SYMPTOMS.map(s => (
              <button key={s} type="button" onClick={() => toggleSymptom(s)} className={`px-3 py-1.5 rounded-lg text-sm transition-all capitalize border active:scale-95 ${symptoms.includes(s) ? 'bg-[#4A1B3C] text-white border-[#4A1B3C] shadow-md animate-scale-bounce' : 'bg-white text-[#4A1B3C]/70 border-gray-200 hover:border-[#4A1B3C]/30'}`}>
                {s.replace('_', ' ')}
              </button>
            ))}
            {symptoms.filter(s => !SYMPTOMS.includes(s)).map(s => (
              <button key={s} type="button" onClick={() => toggleSymptom(s)} className="px-3 py-1.5 rounded-lg text-sm transition-all capitalize border active:scale-95 bg-[#E85D9A] text-white border-[#E85D9A] shadow-md animate-scale-bounce">
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>
          <div className="flex gap-2 max-w-md">
            <input 
              type="text" 
              placeholder="Add custom symptom..." 
              value={customSymptom} 
              onChange={e => setCustomSymptom(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomSymptom();
                }
              }}
              className="flex-1 px-4 py-2 rounded-xl border border-[#E85D9A]/20 focus:border-[#E85D9A] focus:ring-2 focus:ring-[#E85D9A]/20 outline-none text-[#4A1B3C] text-sm bg-white"
            />
            <button 
              type="button" 
              onClick={addCustomSymptom}
              className="px-4 py-2 bg-[#E85D9A] hover:bg-[#d44d88] text-white font-bold text-sm rounded-xl transition-all"
            >
              Add
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#4A1B3C] mb-3 uppercase tracking-wide">Exercise</label>
          <div className="flex items-center gap-4 mb-3">
            <button type="button" onClick={() => setExercise(!exercise)} className={`w-14 h-8 rounded-full transition-colors relative ${exercise ? 'bg-green-500' : 'bg-gray-200'}`}>
              <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-transform ${exercise ? 'left-7' : 'left-1'}`} />
            </button>
            <span className="text-sm font-medium text-gray-600">{exercise ? 'Yes, I exercised!' : 'Not today'}</span>
          </div>
          
          {exercise && (
            <div className="space-y-3 animate-in slide-in-from-top-2">
              <div className="flex flex-wrap gap-2">
                {['walking', 'yoga', 'gym'].map(type => (
                  <button key={type} type="button" onClick={() => setExerciseType(type)} className={`px-4 py-2 rounded-xl text-sm font-medium capitalize border transition-all active:scale-95 ${exerciseType === type ? 'bg-green-500 text-white border-green-500 shadow-md animate-scale-bounce' : 'bg-white text-[#4A1B3C] border-gray-200 hover:border-gray-300'}`}>
                    {type}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 max-w-md">
                <input 
                  type="text" 
                  placeholder="Or enter custom exercise..." 
                  value={['walking', 'yoga', 'gym'].includes(exerciseType) ? '' : exerciseType} 
                  onChange={e => setExerciseType(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-xl border border-[#E85D9A]/20 focus:border-[#E85D9A] focus:ring-2 focus:ring-[#E85D9A]/20 outline-none text-[#4A1B3C] text-sm bg-white"
                />
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#4A1B3C] mb-3 uppercase tracking-wide">Hydration</label>
          <div className="flex items-center gap-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
            <span className="text-2xl">💧</span>
            <div className="flex-1">
              <span className="text-sm font-medium text-[#4A1B3C] block mb-1">Glasses of Water</span>
              <div className="flex gap-2 items-center">
                <button type="button" onClick={() => setWaterGlasses(Math.max(0, (Number(waterGlasses) || 0) - 1))} className="w-8 h-8 rounded-full bg-white text-blue-500 font-bold shadow-sm active:scale-95 hover:bg-blue-50 transition-colors">-</button>
                <span className="w-8 text-center font-bold text-lg text-blue-600">{waterGlasses || 0}</span>
                <button type="button" onClick={() => setWaterGlasses((Number(waterGlasses) || 0) + 1)} className="w-8 h-8 rounded-full bg-white text-blue-500 font-bold shadow-sm active:scale-95 hover:bg-blue-50 transition-colors">+</button>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#4A1B3C] mb-2 uppercase tracking-wide">Journal Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} maxLength={300} rows={3} placeholder="How was your day?" className="w-full px-4 py-3 rounded-xl border border-[#E85D9A]/20 focus:border-[#E85D9A] focus:ring-2 focus:ring-[#E85D9A]/20 outline-none text-[#4A1B3C] resize-none transition-colors" />
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" loading={loading}>Save Log</Button>
        </div>
      </form>
    </Modal>
  );
}
