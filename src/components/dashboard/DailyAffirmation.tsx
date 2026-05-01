'use client';

import { useMemo } from 'react';
import { getDailyAffirmation } from '@/lib/content/affirmations';

export function DailyAffirmation({ phase }: { phase: string }) {
  const affirmation = useMemo(() => getDailyAffirmation(phase), [phase]);

  if (!affirmation) return null;

  return (
    <div className="w-full bg-gradient-to-r from-pink-50 to-purple-50 rounded-[20px] p-[16px] shadow-sm border border-pink-100">
      <div className="flex gap-3 items-center">
        <div className="text-2xl opacity-80">✨</div>
        <p className="text-sm font-medium text-[#4A1B3C] italic leading-relaxed">&ldquo;{affirmation}&rdquo;</p>
      </div>
    </div>
  );
}
