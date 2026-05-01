export const affirmations: Record<string, string[]> = {
  menstrual: [
    "Your body is doing exactly what it needs to do. Rest is productive.",
    "You are allowed to take up space and ask for what you need.",
    "Your period is not a weakness — it's a sign your body is working beautifully.",
    "Honor your need for rest today. Give yourself permission to slow down.",
    "Your energy is inward right now. Listen to what your body is telling you."
  ],
  follicular: [
    "You are capable of amazing things. Your energy is rising.",
    "This is your time to start fresh. What will you create?",
    "Your confidence is growing with your energy. Trust yourself.",
    "Embrace this new cycle and the renewed creativity it brings.",
    "You are blossoming. Lean into your newfound motivation."
  ],
  ovulatory: [
    "You are radiant and powerful. This is your moment.",
    "Your intuition is sharp right now. Listen to it.",
    "You communicate with clarity and warmth. Use your voice.",
    "You are magnetic. Trust the energy you are putting out into the world.",
    "Everything you need to succeed is already within you."
  ],
  luteal: [
    "Slowing down is not giving up. It's taking care of yourself.",
    "Your feelings are valid, even when they're big.",
    "You don't have to be 'on' all the time. Rest is a form of self-love.",
    "It is okay to say no and protect your peace right now.",
    "Your body is working hard. Show it some grace."
  ],
  unknown: [
    "Take today one step at a time.",
    "You are doing your best, and that is enough.",
    "Listen to your body, it knows what it needs."
  ]
};

export function getDailyAffirmation(phase: string = 'unknown'): string {
  const phaseAffirmations = affirmations[phase] || affirmations.unknown;
  // Use current date string as seed to rotate daily
  const seed = new Date().toISOString().split('T')[0];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0; 
  }
  const index = Math.abs(hash) % phaseAffirmations.length;
  return phaseAffirmations[index];
}
