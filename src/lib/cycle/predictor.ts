export type CyclePhase = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal' | 'unknown';

export interface CycleInput {
  periodStart: Date;
  periodEnd?: Date;
}

export interface OnboardingDefaults {
  avgCycleLength: number;
  avgPeriodLength: number;
  lastPeriodStart?: Date;
  conditions?: string[];
}

export interface Prediction {
  predictedStart: Date;
  predictedEnd: Date;
  fertileStart: Date;
  fertileEnd: Date;
  ovulationDate: Date;
  confidence: number;
  basedOnCycles: number;
  avgCycleLength: number;
  avgPeriodLength: number;
  currentPhase: CyclePhase;
  dayOfCycle: number;
  daysUntilNextPeriod: number;
  isLate: boolean;
  isPCOSMode: boolean;
}

// Helpers
export function daysBetween(a: Date, b: Date): number {
  const d1 = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const d2 = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((d2.getTime() - d1.getTime()) / 86400000);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function standardDeviation(values: number[]): number {
  if (values.length <= 1) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) return (sorted[mid - 1] + sorted[mid]) / 2;
  return sorted[mid];
}

export function getPhaseDescription(phase: CyclePhase): string {
  switch (phase) {
    case 'menstrual': return "Your period is here. Rest and be gentle with yourself.";
    case 'follicular': return "Energy is building. A good time to start new things.";
    case 'ovulatory': return "You're at your peak energy and social mood.";
    case 'luteal': return "Winding down. Cravings and mood shifts are normal now.";
    default: return "Log your period to see your cycle phase.";
  }
}

export function getPhaseColor(phase: CyclePhase): string {
  switch (phase) {
    case 'menstrual': return 'bg-rose-100 text-rose-700 border-rose-300';
    case 'follicular': return 'bg-purple-100 text-purple-700 border-purple-300';
    case 'ovulatory': return 'bg-teal-100 text-teal-700 border-teal-300';
    case 'luteal': return 'bg-amber-100 text-amber-700 border-amber-300';
    default: return 'bg-gray-100 text-gray-500 border-gray-300';
  }
}

export function computePrediction(cyclesInput: CycleInput[], onboarding: OnboardingDefaults): Prediction {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Phase 1: Sort desc and extract raw cycle lengths
  const sortedCycles = [...cyclesInput].sort((a, b) => b.periodStart.getTime() - a.periodStart.getTime());
  
  const rawLengths: number[] = [];
  const rawPeriodLengths: number[] = [];

  for (let i = 0; i < sortedCycles.length - 1; i++) {
    const len = daysBetween(sortedCycles[i + 1].periodStart, sortedCycles[i].periodStart);
    if (len >= 15 && len <= 60) {
      rawLengths.push(len);
    }
  }

  sortedCycles.forEach(c => {
    if (c.periodEnd) {
      const plen = daysBetween(c.periodStart, c.periodEnd) + 1;
      rawPeriodLengths.push(plen);
    }
  });

  const numCycles = rawLengths.length;

  let avgCycleLength = onboarding.avgCycleLength;
  let avgPeriodLength = onboarding.avgPeriodLength;
  let confidence = 0.20;
  
  const isPCOS = onboarding.conditions?.includes('pcos') || false;
  const isIrregular = standardDeviation(rawLengths) > 7;
  const isPCOSMode = isPCOS || isIrregular;

  // Phase 2: Averaging Strategy
  if (numCycles === 0) {
    // Case A
    avgCycleLength = onboarding.avgCycleLength || 28;
    avgPeriodLength = onboarding.avgPeriodLength || 5;
    confidence = 0.20;
  } else if (isPCOSMode && numCycles > 0) {
    // PCOS Mode
    avgCycleLength = Math.round(median(rawLengths));
    const meanPeriod = rawPeriodLengths.length > 0 ? Math.round(rawPeriodLengths.reduce((a, b) => a + b) / rawPeriodLengths.length) : onboarding.avgPeriodLength;
    avgPeriodLength = meanPeriod;
    confidence = Math.min(0.60, 0.20 + numCycles * 0.1);
  } else if (numCycles === 1) {
    // Case B
    avgCycleLength = rawLengths[0];
    avgPeriodLength = rawPeriodLengths.length > 0 ? Math.round(rawPeriodLengths.reduce((a, b) => a + b) / rawPeriodLengths.length) : onboarding.avgPeriodLength;
    confidence = 0.35;
  } else if (numCycles === 2) {
    // Case C
    avgCycleLength = Math.round((rawLengths[0] + rawLengths[1]) / 2);
    avgPeriodLength = rawPeriodLengths.length > 0 ? Math.round(rawPeriodLengths.reduce((a, b) => a + b) / rawPeriodLengths.length) : onboarding.avgPeriodLength;
    confidence = 0.50;
  } else if (numCycles >= 3 && numCycles <= 5) {
    // Case D
    let weights = [0.4, 0.3, 0.2, 0.1].slice(0, numCycles);
    const sumW = weights.reduce((a, b) => a + b, 0);
    weights = weights.map(w => w / sumW);
    let weightedSum = 0;
    for (let i = 0; i < numCycles; i++) {
        weightedSum += rawLengths[i] * weights[i];
    }
    avgCycleLength = Math.round(weightedSum);
    avgPeriodLength = rawPeriodLengths.length > 0 ? Math.round(rawPeriodLengths.reduce((a, b) => a + b) / rawPeriodLengths.length) : onboarding.avgPeriodLength;
    confidence = Math.min(0.78, 0.50 + (numCycles * 0.08));
  } else {
    // Case E: 6+
    const weights = [0.30, 0.25, 0.20, 0.12, 0.08, 0.05];
    let weightedSum = 0;
    for (let i = 0; i < 6; i++) {
        weightedSum += rawLengths[i] * weights[i];
    }
    avgCycleLength = Math.round(weightedSum);
    avgPeriodLength = rawPeriodLengths.length > 0 ? Math.round(rawPeriodLengths.reduce((a, b) => a + b) / rawPeriodLengths.length) : onboarding.avgPeriodLength;
    confidence = 0.85;
  }

  // Phase 3: Next period start
  const lastPeriodStartRaw = sortedCycles[0]?.periodStart ?? onboarding.lastPeriodStart;
  let lastPeriodStart: Date;
  
  if (lastPeriodStartRaw) {
    lastPeriodStart = new Date(lastPeriodStartRaw.getFullYear(), lastPeriodStartRaw.getMonth(), lastPeriodStartRaw.getDate());
  } else {
    lastPeriodStart = today; // fallback
  }

  const predictedStart = addDays(lastPeriodStart, avgCycleLength);
  
  // Phase 4: Compute ovulation and fertile window
  // "ovulationDate = addDays(predictedStart, -14)"
  const ovulationDate = addDays(predictedStart, -14);
  const fertileStart = addDays(ovulationDate, -5);
  const fertileEnd = addDays(ovulationDate, 1);
  const predictedEnd = addDays(predictedStart, avgPeriodLength - 1);

  // Phase 5: Determine current phase
  let isLate = false;
  const daysUntilNextPeriod = daysBetween(today, predictedStart);
  if (daysUntilNextPeriod <= 0) {
    isLate = true;
  }


  let currentPhase: CyclePhase = 'unknown';
  let dayOfCycle = 0;

  if (lastPeriodStartRaw) {
    dayOfCycle = daysBetween(lastPeriodStart, today) + 1;
    if (dayOfCycle < 1) {
       currentPhase = 'unknown';
    } else {
      const menstrualEnd = avgPeriodLength;
      const follicularEnd = (avgCycleLength - 14) - 2;
      const ovulatoryEnd = (avgCycleLength - 14) + 2;

      if (dayOfCycle <= menstrualEnd) {
        currentPhase = 'menstrual';
      } else if (dayOfCycle <= follicularEnd) {
        currentPhase = 'follicular';
      } else if (dayOfCycle <= ovulatoryEnd) {
        currentPhase = 'ovulatory';
      } else {
        currentPhase = 'luteal';
      }
      
      if (dayOfCycle > avgCycleLength + 14) {
        currentPhase = 'luteal';
        isLate = true;
      }
    }
  }

  return {
    predictedStart,
    predictedEnd,
    fertileStart,
    fertileEnd,
    ovulationDate,
    confidence,
    basedOnCycles: numCycles,
    avgCycleLength,
    avgPeriodLength,
    currentPhase,
    dayOfCycle,
    daysUntilNextPeriod,
    isLate,
    isPCOSMode
  };
}
