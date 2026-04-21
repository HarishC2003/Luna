import { UserHealthContext } from './context-builder';

export function getSuggestedQuestions(ctx: UserHealthContext): string[] {
  const suggestions: string[] = [];

  const loggedBloating = ctx.recentSymptoms.some(s => s.symptom === 'bloating' && s.daysAgo <= 1);
  const loggedLowEnergy = ctx.recentMoods.some(m => (m.energy !== null && m.energy <= 2) && new Date(m.date).getTime() > Date.now() - 2 * 24 * 60 * 60 * 1000);
  const loggedCramps = ctx.recentSymptoms.some(s => s.symptom === 'cramps' && s.daysAgo <= 2);
  const loggedLowMood = ctx.recentMoods.some(m => (m.mood === 'sad' || m.mood === 'anxious' || m.mood === 'low') && new Date(m.date).getTime() > Date.now() - 2 * 24 * 60 * 60 * 1000);

  const daysUntilPeriod = ctx.today.daysUntilNextPeriod;
  const phase = ctx.today.phase.toLowerCase();
  const dayOfCycle = ctx.today.dayOfCycle;

  // Add highly personalized suggestions based on very recent logs
  if (loggedBloating) {
    suggestions.push("Why am I still bloated today?");
  }
  if (loggedLowEnergy && dayOfCycle) {
    suggestions.push(`How can I boost my energy on day ${dayOfCycle}?`);
  }
  if (loggedCramps && dayOfCycle) {
    suggestions.push(`What helps with cramps on day ${dayOfCycle}?`);
  }
  if (loggedLowMood) {
    suggestions.push("Why do I feel low before my period?");
  }
  if (daysUntilPeriod !== null && daysUntilPeriod >= 1 && daysUntilPeriod <= 3) {
    suggestions.push("What should I prepare for my period?");
  }
  if (phase === 'ovulatory') {
    suggestions.push("What does fertile discharge look like?");
  }

  // Fallbacks if we don't have enough personalized ones
  if (suggestions.length < 3) {
    switch (phase) {
      case 'menstrual':
        if (!suggestions.includes("What foods are good during my period?")) suggestions.push("What foods are good during my period?");
        if (!suggestions.includes("Is it normal to feel tired during my period?")) suggestions.push("Is it normal to feel tired during my period?");
        break;
      case 'follicular':
        if (!suggestions.includes("What changes should I expect this week?")) suggestions.push("What changes should I expect this week?");
        if (!suggestions.includes("Is this a good time to exercise more?")) suggestions.push("Is this a good time to exercise more?");
        break;
      case 'ovulatory':
        if (!suggestions.includes("Can I get pregnant right now?")) suggestions.push("Can I get pregnant right now?");
        if (!suggestions.includes("How can I tell if I'm ovulating?")) suggestions.push("How can I tell if I'm ovulating?");
        break;
      case 'luteal':
        if (!suggestions.includes("What helps with PMS symptoms?")) suggestions.push("What helps with PMS symptoms?");
        if (!suggestions.includes("Why do I crave certain foods before my period?")) suggestions.push("Why do I crave certain foods before my period?");
        break;
      default:
        suggestions.push("How does my cycle work?", "What should I track each day?", "When will my next period start?");
        break;
    }
  }

  // Ensure we return exactly 3, unique
  return Array.from(new Set(suggestions)).slice(0, 3);
}
