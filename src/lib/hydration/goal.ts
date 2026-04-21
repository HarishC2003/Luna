import type { CyclePhase } from '@/lib/cycle/predictor';

export interface HydrationGoal {
  glasses: number;
  reasoning: string;
}

export function getDailyWaterGoal(phase: CyclePhase): HydrationGoal {
  switch (phase) {
    case 'menstrual':
      return { glasses: 9, reasoning: 'Blood loss increases hydration needs' };
    case 'follicular':
      return { glasses: 8, reasoning: 'Standard daily goal' };
    case 'ovulatory':
      return { glasses: 8, reasoning: 'Stay hydrated at peak activity' };
    case 'luteal':
      return { glasses: 10, reasoning: 'Helps reduce bloating and mood swings' };
    default:
      return { glasses: 8, reasoning: 'Standard daily goal' };
  }
}

export function getEncouragementText(current: number, goal: number): string {
  if (current === 0) return 'Stay hydrated! 💧';
  const pct = current / goal;
  if (pct >= 1) return 'Hydration goal reached! 🎉';
  if (pct >= 0.75) return 'Almost there! Keep going! 💪';
  if (pct >= 0.5) return 'Halfway there! 🌊';
  if (pct >= 0.25) return 'Good start! Keep sipping! 💧';
  return 'Stay hydrated! 💧';
}
