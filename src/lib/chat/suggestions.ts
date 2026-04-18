export function getSuggestedQuestions(phase: string, conditions: string[], daysUntilPeriod: number | null): string[] {
  let suggestions: string[] = [];

  switch (phase.toLowerCase()) {
    case 'menstrual':
      suggestions = ["What can help with period cramps?", "Is it normal to feel tired during my period?", "What foods are good during my period?"];
      break;
    case 'follicular':
      suggestions = ["What changes should I expect this week?", "How can I make the most of my energy right now?", "Is this a good time to exercise more?"];
      break;
    case 'ovulatory':
      suggestions = ["How can I tell if I'm ovulating?", "What does fertile discharge look like?", "Can I get pregnant right now?"];
      break;
    case 'luteal':
      suggestions = ["Why do I feel more anxious before my period?", "What helps with PMS symptoms?", "Why do I crave certain foods before my period?"];
      break;
    default:
      suggestions = ["How does my cycle work?", "What should I track each day?", "When will my next period start?"];
      break;
  }

  if (conditions.includes('pcos')) {
    suggestions[0] = "How does PCOS affect my cycle predictions?";
  } else if (conditions.includes('endometriosis')) {
    suggestions[0] = "How can I manage endometriosis pain today?";
  }

  if (daysUntilPeriod !== null) {
    if (daysUntilPeriod >= 0 && daysUntilPeriod <= 3) {
      suggestions[1] = "My period is due soon — what should I prepare?";
    } else if (daysUntilPeriod < 0) {
      suggestions[0] = "My period is late — what could cause this?";
    }
  }

  return suggestions;
}
