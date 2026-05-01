import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';


interface SharedPageProps {
  params: { token: string };
}

export default async function SharedDashboardPage({ params }: SharedPageProps) {
  const supabase = await createClient();
  const { token } = params;

  // Verify token
  const { data: linkData, error: linkError } = await supabase
    .from('partner_links')
    .select('user_id')
    .eq('token', token)
    .single();

  if (linkError || !linkData) {
    return notFound();
  }

  const userId = linkData.user_id;

  // Fetch only non-sensitive data
  const [{ data: profile }, { data: prediction }] = await Promise.all([
    supabase.from('profiles').select('display_name').eq('id', userId).single(),
    supabase.from('cycle_predictions').select('*').eq('user_id', userId).single(),
  ]);

  if (!profile || !prediction) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDF8F9]">
        <p className="text-gray-500">User data is not ready yet.</p>
      </div>
    );
  }

  // Derive phase safely
  let currentPhase = 'unknown';
  if (prediction.predicted_start) {
    const predictedStart = new Date(prediction.predicted_start);
    const today = new Date();
    const dayOfCycle = Math.ceil((today.getTime() - predictedStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    if (dayOfCycle >= 1 && dayOfCycle <= 5) currentPhase = 'menstrual';
    else if (dayOfCycle > 5 && dayOfCycle <= 13) currentPhase = 'follicular';
    else if (dayOfCycle > 13 && dayOfCycle <= 15) currentPhase = 'ovulatory';
    else if (dayOfCycle > 15) currentPhase = 'luteal';
  }

  const phaseTips: Record<string, { title: string, desc: string, tip: string }> = {
    menstrual: {
      title: 'Menstrual Phase',
      desc: 'Energy might be low. Comfort is key.',
      tip: 'How to help: Be patient, offer a heating pad, prepare her favorite comfort food, and give her space to rest.'
    },
    follicular: {
      title: 'Follicular Phase',
      desc: 'Energy and mood are typically rising.',
      tip: 'How to help: Suggest fun activities, encourage new projects, and match her growing energy.'
    },
    ovulatory: {
      title: 'Ovulatory Phase',
      desc: 'Peak energy, highly social and communicative.',
      tip: 'How to help: Great time for dates, deep conversations, and socializing together.'
    },
    luteal: {
      title: 'Luteal Phase',
      desc: 'Energy winding down, potential for PMS.',
      tip: 'How to help: Don\'t take mood shifts personally. Be extra supportive, handle some chores, and keep snacks handy.'
    },
    unknown: {
      title: 'Cycle tracking in progress',
      desc: 'Gathering data...',
      tip: 'Just be your supportive self!'
    }
  };

  const phaseData = phaseTips[currentPhase] || phaseTips.unknown;

  return (
    <div className="min-h-screen bg-[#FDF8F9] p-6 flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl border border-pink-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-400 to-purple-500" />
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-pink-100 text-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            💝
          </div>
          <h1 className="text-2xl font-bold text-[#1A0A12]">
            {profile.display_name}&apos;s Luna Update
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            Here&apos;s a quick, private look at how you can best support her right now.
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100">
            <h3 className="text-sm font-bold text-purple-900 uppercase tracking-wide mb-1">Current Phase</h3>
            <p className="text-xl font-bold text-purple-700">{phaseData.title}</p>
            <p className="text-purple-600 mt-2">{phaseData.desc}</p>
          </div>

          <div className="bg-pink-50 p-6 rounded-2xl border border-pink-100">
            <h3 className="text-sm font-bold text-pink-900 uppercase tracking-wide mb-2 flex items-center gap-2">
              <span>💡</span> How to Support Her
            </h3>
            <p className="text-pink-800 leading-relaxed">
              {phaseData.tip}
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            Powered by Luna • Shared securely
          </p>
        </div>
      </div>
    </div>
  );
}
