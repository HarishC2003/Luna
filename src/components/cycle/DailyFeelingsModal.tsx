'use client';

import { useState, useEffect, useRef } from 'react';
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

export const ENERGY_LEVELS = [
  { val: 1, label: 'Very Low', icon: '⚡' },
  { val: 2, label: 'Low', icon: '⚡' },
  { val: 3, label: 'Moderate', icon: '⚡' },
  { val: 4, label: 'High', icon: '⚡' },
  { val: 5, label: 'Very High', icon: '⚡' },
] as const;

export const SLEEP_LEVELS = [
  { val: 1, label: 'Very Poor', icon: '🌙' },
  { val: 2, label: 'Poor', icon: '🌙' },
  { val: 3, label: 'Okay', icon: '🌙' },
  { val: 4, label: 'Good', icon: '🌙' },
  { val: 5, label: 'Excellent', icon: '🌙' },
] as const;

const SYMPTOMS: Symptom[] = ['cramps', 'headache', 'bloating', 'breast_tenderness', 'fatigue', 'acne', 'back_pain', 'nausea', 'mood_swings', 'insomnia'];

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
  const [customSymptom, setCustomSymptom] = useState('');

  const wasOpenRef = useRef(false);
  const prevInitialIdRef = useRef<string | undefined>(initialData?.id);
  const prevDateRef = useRef<string | undefined>(selectedDate);

  useEffect(() => {
    // Only re-initialize form state when modal transitions from closed to open,
    // or when the underlying record id changes, or when selectedDate changes.
    const justOpened = isOpen && !wasOpenRef.current;
    const recordChanged = isOpen && initialData?.id !== prevInitialIdRef.current;
    const dateChanged = isOpen && selectedDate !== prevDateRef.current;
    
    if (justOpened || recordChanged || dateChanged) {
      setDate(selectedDate || (initialData?.log_date ? initialData.log_date.split('T')[0] : todayStr));
      setMood(initialData?.mood || '');
      setEnergy(initialData?.energy || '');
      setSleepQuality(initialData?.sleep_quality || '');
      setStressLevel((initialData?.stress_level !== undefined && initialData?.stress_level !== null) ? initialData.stress_level : '');
      setExercise(!!initialData?.exercise);
      setExerciseType((initialData?.exercise_type && initialData.exercise_type !== 'none') ? initialData.exercise_type : 'walking');
      setSymptoms(initialData?.symptoms || []);
      setNotes(initialData?.notes || '');
      setCustomSymptom('');
      setError(null);
    }
    wasOpenRef.current = isOpen;
    prevInitialIdRef.current = initialData?.id;
    prevDateRef.current = selectedDate;
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
    <Modal isOpen={isOpen} onClose={onClose} title="Log your feelings" size="lg">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Energy */}
          <div className="p-4 rounded-2xl bg-[#FDF8F9] border border-[#E85D9A]/15 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-[#4A1B3C] uppercase tracking-wide flex items-center gap-1.5">
                <span>⚡</span> Energy
              </label>
              {energy ? (
                <span className="text-xs font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-300">
                  {ENERGY_LEVELS.find(l => l.val === energy)?.label}
                </span>
              ) : (
                <span className="text-[11px] text-[#9E7A8A]">Select level</span>
              )}
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              {ENERGY_LEVELS.map(level => {
                const isSelected = energy === level.val;
                return (
                  <button
                    key={level.val}
                    type="button"
                    onClick={() => setEnergy(level.val)}
                    title={`${level.label} (${level.val}/5)`}
                    className={`h-12 rounded-xl flex flex-col items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-amber-400 text-white shadow-md ring-2 ring-amber-400/50 scale-105 font-bold'
                        : 'bg-white text-gray-500 hover:bg-amber-50 hover:text-amber-600 border border-gray-200/80'
                    }`}
                  >
                    <span className="text-sm leading-none">⚡</span>
                    <span className="text-[10px] mt-0.5 font-medium">{level.val}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between items-center text-[10px] text-[#9E7A8A] font-medium mt-2 px-1">
              <span>Very Low</span>
              <span>Moderate</span>
              <span>Very High</span>
            </div>
          </div>

          {/* Sleep */}
          <div className="p-4 rounded-2xl bg-[#FDF8F9] border border-[#E85D9A]/15 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-[#4A1B3C] uppercase tracking-wide flex items-center gap-1.5">
                <span>🌙</span> Sleep
              </label>
              {sleepQuality ? (
                <span className="text-xs font-bold text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-full border border-indigo-300">
                  {SLEEP_LEVELS.find(l => l.val === sleepQuality)?.label}
                </span>
              ) : (
                <span className="text-[11px] text-[#9E7A8A]">Select quality</span>
              )}
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              {SLEEP_LEVELS.map(level => {
                const isSelected = sleepQuality === level.val;
                return (
                  <button
                    key={level.val}
                    type="button"
                    onClick={() => setSleepQuality(level.val)}
                    title={`${level.label} (${level.val}/5)`}
                    className={`h-12 rounded-xl flex flex-col items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-indigo-500 text-white shadow-md ring-2 ring-indigo-400/50 scale-105 font-bold'
                        : 'bg-white text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 border border-gray-200/80'
                    }`}
                  >
                    <span className="text-sm leading-none">🌙</span>
                    <span className="text-[10px] mt-0.5 font-medium">{level.val}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between items-center text-[10px] text-[#9E7A8A] font-medium mt-2 px-1">
              <span>Very Poor</span>
              <span>Okay</span>
              <span>Excellent</span>
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
