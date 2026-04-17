import { Prediction, Phase } from '@/types/cycle';

export interface CycleData {
  periodStart: Date;
  periodEnd?: Date;
  cycleLength?: number;
}

export interface OnboardingDataInput {
  avgCycleLength: number;
  avgPeriodLength: number;
  lastPeriodStart?: Date | null;
}

export function computePrediction(cycles: CycleData[], onboarding: OnboardingDataInput): Prediction {
  const completedCycles = cycles.filter(c => c.periodStart && c.cycleLength);
  const recentCycles = completedCycles.sort((a, b) => b.periodStart.getTime() - a.periodStart.getTime()).slice(0, 6);

  let predictedCycleLength = onboarding.avgCycleLength;
  let confidence = 0.2;

  if (recentCycles.length >= 3) {
    const weights = [0.4, 0.3, 0.2, 0.1];
    let totalWeight = 0;
    let weightedSum = 0;
    
    for (let i = 0; i < Math.min(recentCycles.length, 4); i++) {
        weightedSum += recentCycles[i].cycleLength! * weights[i];
        totalWeight += weights[i];
    }
    
    predictedCycleLength = Math.round(weightedSum / totalWeight);
    confidence = Math.min(0.95, 0.5 + (recentCycles.length * 0.1));
  } else if (recentCycles.length > 0) {
    const sum = recentCycles.reduce((acc, curr) => acc + curr.cycleLength!, 0);
    predictedCycleLength = Math.round(sum / recentCycles.length);
    confidence = 0.3 + (recentCycles.length * 0.05);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let lastStart = onboarding.lastPeriodStart;
  if (cycles.length > 0) {
      const sortedAll = [...cycles].sort((a, b) => b.periodStart.getTime() - a.periodStart.getTime());
      lastStart = sortedAll[0].periodStart;
  }

  let predictedStart = new Date(today);
  
  if (lastStart) {
      predictedStart = new Date(lastStart);
      predictedStart.setDate(predictedStart.getDate() + predictedCycleLength);
      
      // If predicted start is in the past, keep adding predictedCycleLength until it's in the future
      // Actually, if it's overdue, the prediction is exactly that it was due then.
      // We don't advance it until it's logged. The instructions say "daysUntilNextPeriod: days from today to predictedStart (negative if overdue)"
  } else {
      // No data at all, just pretend it starts today for fallback
      predictedStart.setDate(predictedStart.getDate() + 28);
  }

  const predictedEnd = new Date(predictedStart);
  predictedEnd.setDate(predictedEnd.getDate() + onboarding.avgPeriodLength);

  const ovulationDate = new Date(predictedStart);
  ovulationDate.setDate(predictedStart.getDate() + (predictedCycleLength - 14));

  const fertileStart = new Date(ovulationDate);
  fertileStart.setDate(ovulationDate.getDate() - 5);

  const fertileEnd = new Date(ovulationDate);
  fertileEnd.setDate(ovulationDate.getDate() + 1);

  const daysUntilNextPeriod = Math.floor((predictedStart.getTime() - today.getTime()) / (1000 * 3600 * 24));

  let currentPhase: Phase = 'unknown';
  let dayOfCycle = 0;

  if (lastStart) {
      const msSinceLast = today.getTime() - lastStart.getTime();
      dayOfCycle = Math.floor(msSinceLast / (1000 * 3600 * 24)) + 1;
      
      const daysToOvulation = predictedCycleLength - 14;
      
      if (today < lastStart) {
          currentPhase = 'unknown';
      } else if (dayOfCycle <= onboarding.avgPeriodLength) {
          currentPhase = 'menstrual';
      } else if (dayOfCycle < daysToOvulation - 1) {
          currentPhase = 'follicular';
      } else if (dayOfCycle >= daysToOvulation - 1 && dayOfCycle <= daysToOvulation + 1) {
          currentPhase = 'ovulatory';
      } else if (dayOfCycle <= predictedCycleLength) {
          currentPhase = 'luteal';
      } else {
           // overdue
          currentPhase = 'luteal';
      }
  }

  return {
    predictedStart,
    predictedEnd,
    fertileStart,
    fertileEnd,
    ovulationDate,
    confidence,
    basedOnCycles: recentCycles.length,
    currentPhase,
    daysUntilNextPeriod,
    dayOfCycle
  };
}

export function getPhaseDescription(phase: string): string {
    switch(phase) {
        case 'menstrual': return 'Your period. Energy might be lower as hormones drop.';
        case 'follicular': return 'Energy rises as estrogen goes up. Great time for new goals.';
        case 'ovulatory': return 'Fertile window. Peak energy and sociability.';
        case 'luteal': return 'Energy winds down. Body prepares for next cycle.';
        default: return 'Log your period to unlock cycle tracking.';
    }
}

export function getPhaseColor(phase: string): string {
    switch(phase) {
        case 'menstrual': return 'bg-rose-100 text-rose-700 border-rose-300';
        case 'follicular': return 'bg-purple-100 text-purple-700 border-purple-300';
        case 'ovulatory': return 'bg-teal-100 text-teal-700 border-teal-300';
        case 'luteal': return 'bg-amber-100 text-amber-700 border-amber-300';
        default: return 'bg-gray-100 text-gray-500 border-gray-300';
    }
}
