'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [lastPeriodStart, setLastPeriodStart] = useState('');
  const [avgCycleLength, setAvgCycleLength] = useState(28);
  const [avgPeriodLength, setAvgPeriodLength] = useState(5);
  const [conditions, setConditions] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);

  const toggleCondition = (c: string) => {
    if (c === 'none') {
      setConditions(['none']);
      return;
    }
    const newConds = conditions.filter(x => x !== 'none');
    if (newConds.includes(c)) setConditions(newConds.filter(x => x !== c));
    else if (newConds.length < 4) setConditions([...newConds, c]);
  };

  const toggleGoal = (g: string) => {
    if (goals.includes(g)) setGoals(goals.filter(x => x !== g));
    else if (goals.length < 4) setGoals([...goals, g]);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        avgCycleLength,
        avgPeriodLength,
        lastPeriodStart: lastPeriodStart || undefined,
        conditions,
        goals
      };

      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Onboarding failed');
      
      router.push('/dashboard');
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDF8F9] flex flex-col pt-12 pb-24 px-6 md:justify-center">
      <div className="w-full max-w-lg mx-auto bg-white rounded-3xl shadow-xl p-8 border border-[#E85D9A]/10 relative overflow-hidden">
        
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-[#FDF8F9]">
          <div className="h-full bg-[#E85D9A] transition-all duration-500 ease-out" style={{ width: `${(step / 4) * 100}%` }} />
        </div>

        {step === 1 && (
          <div className="animate-slide-in">
            <h2 className="text-3xl font-extrabold text-[#4A1B3C] mb-4">When was your last period?</h2>
            <p className="text-[#4A1B3C]/70 mb-8">Don't worry if you're not sure — an estimate works fine.</p>
            
            <input 
              type="date" 
              value={lastPeriodStart} 
              onChange={e => setLastPeriodStart(e.target.value)}
              className="w-full px-4 py-4 rounded-xl border border-[#E85D9A]/30 focus:border-[#E85D9A] focus:ring-2 focus:ring-[#E85D9A]/20 outline-none text-[#4A1B3C] text-lg font-medium shadow-sm mb-8"
            />
            
            <div className="flex gap-4 mt-8">
              <button onClick={() => setStep(2)} className="flex-1 bg-[#E85D9A] hover:bg-[#d44d88] text-white py-4 rounded-xl font-bold shadow-md transition-all uppercase tracking-wide">Next</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-slide-in">
            <h2 className="text-3xl font-extrabold text-[#4A1B3C] mb-4">How long is your typical cycle?</h2>
            <p className="text-[#4A1B3C]/70 mb-8">From the first day of your period to the day before your next period starts.</p>
            
            <div className="mb-10">
              <div className="flex justify-between items-end mb-4">
                <label className="font-semibold text-[#4A1B3C] uppercase tracking-wide">Cycle Length</label>
                <span className="text-2xl font-bold text-[#E85D9A]">{avgCycleLength} <span className="text-sm text-[#4A1B3C]/50 font-medium">days</span></span>
              </div>
              <input type="range" min="21" max="40" value={avgCycleLength} onChange={e => setAvgCycleLength(parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#E85D9A]" />
            </div>

            <div className="mb-8">
              <div className="flex justify-between items-end mb-4">
                <label className="font-semibold text-[#4A1B3C] uppercase tracking-wide">Period Length</label>
                <span className="text-2xl font-bold text-[#E85D9A]">{avgPeriodLength} <span className="text-sm text-[#4A1B3C]/50 font-medium">days</span></span>
              </div>
              <input type="range" min="2" max="10" value={avgPeriodLength} onChange={e => setAvgPeriodLength(parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#E85D9A]" />
            </div>
            
            <div className="flex gap-4 mt-8">
              <button onClick={() => setStep(1)} className="px-6 py-4 rounded-xl text-[#4A1B3C] bg-gray-100 hover:bg-gray-200 font-bold uppercase tracking-wide transition-colors">Back</button>
              <button onClick={() => setStep(3)} className="flex-1 bg-[#E85D9A] hover:bg-[#d44d88] text-white py-4 rounded-xl font-bold shadow-md transition-all uppercase tracking-wide">Next</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-slide-in">
            <h2 className="text-3xl font-extrabold text-[#4A1B3C] mb-4">Personalize your Luna</h2>
            <p className="text-[#4A1B3C]/70 mb-6">Do any of these apply to you? (Optional)</p>
            
            <div className="flex flex-wrap gap-3 mb-8">
              {['pcos', 'endometriosis', 'irregular', 'none'].map(c => (
                <button key={c} onClick={() => toggleCondition(c)} className={`px-5 py-3 rounded-xl border-2 font-medium capitalize transition-all ${conditions.includes(c) ? 'bg-rose-50 border-[#E85D9A] text-[#E85D9A]' : 'bg-white border-gray-200 text-[#4A1B3C] hover:border-[#E85D9A]/50'}`}>
                  {c}
                </button>
              ))}
            </div>

            <p className="text-[#4A1B3C]/70 mb-4">What brings you to Luna?</p>
            <div className="flex flex-col gap-3 mb-8">
              {[
                  {val: 'track', label: 'Track my cycle'},
                  {val: 'conceive', label: 'Plan a pregnancy'},
                  {val: 'avoid', label: 'Avoid pregnancy'},
                  {val: 'health', label: 'Understand my health'}
              ].map(g => (
                <button key={g.val} onClick={() => toggleGoal(g.val)} className={`text-left px-5 py-4 rounded-xl border-2 font-medium transition-all flex justify-between items-center ${goals.includes(g.val) ? 'bg-rose-50 border-[#E85D9A] text-[#E85D9A]' : 'bg-white border-gray-200 text-[#4A1B3C] hover:border-[#E85D9A]/50'}`}>
                  {g.label}
                  {goals.includes(g.val) && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                </button>
              ))}
            </div>
            
            <div className="flex gap-4 mt-8">
              <button onClick={() => setStep(2)} className="px-6 py-4 rounded-xl text-[#4A1B3C] bg-gray-100 hover:bg-gray-200 font-bold uppercase tracking-wide transition-colors">Back</button>
              <button onClick={() => setStep(4)} className="flex-1 bg-[#E85D9A] hover:bg-[#d44d88] text-white py-4 rounded-xl font-bold shadow-md transition-all uppercase tracking-wide">Complete</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="animate-slide-in text-center py-8">
            <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-inner border border-rose-100">
              ✨
            </div>
            <h2 className="text-3xl font-extrabold text-[#4A1B3C] mb-4">You're all set!</h2>
            <p className="text-[#4A1B3C]/70 mb-8 max-w-sm mx-auto leading-relaxed">
              Luna is completely personalized to your cycle. Remember to log daily to improve prediction accuracy.
            </p>
            
            <button onClick={handleSubmit} disabled={loading} className="w-full bg-[#E85D9A] hover:bg-[#d44d88] text-white py-4 rounded-xl font-bold shadow-md transition-all flex justify-center items-center uppercase tracking-wide mt-8">
              {loading ? <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : 'Start Tracking'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
