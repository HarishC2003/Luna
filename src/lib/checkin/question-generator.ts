import { UserHealthContext } from '../chat/context-builder';

export interface CheckInQuestion {
  question: string;
  logField: 'mood' | 'flow' | 'symptoms' | 'energy';
  options: string[];
}

export function generateCheckinQuestion(context: UserHealthContext): CheckInQuestion {
  const { phase, dayOfCycle, daysUntilNextPeriod, isLate } = context.today;
  const yesterdayMood = context.recentMoods.find(m => m.date === new Date(Date.now() - 86400000).toISOString().split('T')[0]);

  if (yesterdayMood && yesterdayMood.energy && yesterdayMood.energy <= 2) {
    return {
      question: "Was your energy better today?",
      logField: 'energy',
      options: ['Much better', 'Same', 'Worse']
    };
  }

  if (!isLate && daysUntilNextPeriod !== null && daysUntilNextPeriod <= 1) {
    return {
      question: "Did your period start today?",
      logField: 'flow',
      options: ['Yes, spotting', 'Yes, light', 'Not yet']
    };
  }

  if (phase === 'menstrual') {
    if (dayOfCycle === 1 || dayOfCycle === 2) {
      return {
        question: "How were your cramps today?",
        logField: 'symptoms',
        options: ['None', 'Mild', 'Moderate', 'Severe']
      };
    }
    return {
      question: "How was your flow today?",
      logField: 'flow',
      options: ['Spotting', 'Light', 'Medium', 'Heavy']
    };
  }

  if (phase === 'follicular') {
    return {
      question: "How was your energy overall today?",
      logField: 'energy',
      options: ['Low', 'Medium', 'High', 'Very high']
    };
  }

  if (phase === 'ovulatory') {
    return {
      question: "How did you feel socially today?",
      logField: 'mood',
      options: ['Withdrawn', 'Okay', 'Social', 'Great']
    };
  }

  if (phase === 'luteal') {
    if (dayOfCycle && dayOfCycle >= 22) {
      return {
        question: "Notice any PMS symptoms today?",
        logField: 'symptoms',
        options: ['None', 'Bloating', 'Cramps', 'Mood swings']
      };
    }
    return {
      question: "How was your mood today?",
      logField: 'mood',
      options: ['Terrible', 'Low', 'Okay', 'Good', 'Great']
    };
  }

  return {
    question: "How did you feel overall today?",
    logField: 'mood',
    options: ['Terrible', 'Low', 'Okay', 'Good', 'Great']
  };
}
