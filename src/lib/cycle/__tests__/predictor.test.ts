import { computePrediction, daysBetween, addDays, CycleInput } from '../predictor';

describe('daysBetween', () => {
  it('handles standard dates', () => {
    expect(daysBetween(new Date(2025, 0, 1), new Date(2025, 0, 8))).toBe(7);
  });
  it('handles reverse dates', () => {
    expect(daysBetween(new Date(2025, 0, 8), new Date(2025, 0, 1))).toBe(-7);
  });
  it('handles month boundary', () => {
    expect(daysBetween(new Date(2025, 0, 31), new Date(2025, 1, 1))).toBe(1);
  });
  it('handles year boundary', () => {
    expect(daysBetween(new Date(2025, 11, 31), new Date(2026, 0, 1))).toBe(1);
  });
});

describe('Case A (no cycles)', () => {
  it('computes correctly without any cycles', () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tenDaysAgo = addDays(today, -10);

    const onboarding = { avgCycleLength: 28, avgPeriodLength: 5, lastPeriodStart: tenDaysAgo };
    const prediction = computePrediction([], onboarding);

    expect(prediction.avgCycleLength).toBe(28);
    expect(prediction.confidence).toBe(0.20);
    expect(prediction.dayOfCycle).toBe(11);
    expect(prediction.currentPhase).toBe('follicular');
    expect(prediction.daysUntilNextPeriod).toBe(18);
  });
});

describe('Case E (6 cycles, regular)', () => {
  it('computes accurately for 6 regular 28-day cycles', () => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const lastStart = addDays(today, -10);
    
    const cycles: CycleInput[] = [
      { periodStart: lastStart },
      { periodStart: addDays(lastStart, -28) },
      { periodStart: addDays(lastStart, -56) },
      { periodStart: addDays(lastStart, -84) },
      { periodStart: addDays(lastStart, -112) },
      { periodStart: addDays(lastStart, -140) },
      { periodStart: addDays(lastStart, -168) } // Provides an extra to ensure 6 length periods
    ];

    const onboarding = { avgCycleLength: 28, avgPeriodLength: 5 };
    const prediction = computePrediction(cycles, onboarding);

    expect(prediction.avgCycleLength).toBe(28);
    expect(prediction.confidence).toBeGreaterThan(0.80);
    expect(prediction.dayOfCycle).toBe(11);
    expect(prediction.currentPhase).toBe('follicular');
    expect(prediction.daysUntilNextPeriod).toBe(18);
    
    // Ovulation is exactly predictedStart - 14 days
    const daysToOvulation = daysBetween(today, prediction.ovulationDate);
    expect(daysToOvulation).toBe(4);
  });
});

describe('PCOS mode (irregular cycles)', () => {
  it('caps confidence and flags as PCOS mode for irregular cycle lengths', () => {
    const today = new Date();
    today.setHours(0,0,0,0);
    
    // 35, 21, 42, 28
    const cycles: CycleInput[] = [
      { periodStart: today }, // length 35
      { periodStart: addDays(today, -35) }, // length 21
      { periodStart: addDays(today, -56) }, // length 42
      { periodStart: addDays(today, -98) }, // length 28
      { periodStart: addDays(today, -126) }
    ];
    
    const onboarding = { avgCycleLength: 28, avgPeriodLength: 5 };
    const prediction = computePrediction(cycles, onboarding);

    expect(prediction.isPCOSMode).toBe(true);
    expect(prediction.confidence).toBeLessThanOrEqual(0.60);
    expect(prediction.avgCycleLength).toBe(32); // median of 21, 28, 35, 42 is 31.5 (rounded to 32)
  });
});

describe('Phase boundary correctness', () => {
  const checkPhase = (daysAgo: number, expectedPhase: string, expectedDay: number, expectedLate: boolean = false) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const lastStart = addDays(today, -daysAgo);
    const cycles: CycleInput[] = [
      { periodStart: lastStart },
      { periodStart: addDays(lastStart, -28) } // lock 28 days
    ];
    const p = computePrediction(cycles, { avgCycleLength: 28, avgPeriodLength: 5 });
    expect(p.dayOfCycle).toBe(expectedDay);
    expect(p.currentPhase).toBe(expectedPhase);
    expect(p.isLate).toBe(expectedLate);
  };

  it('evaluates periods properly', () => {
    checkPhase(1, 'menstrual', 2);
    checkPhase(5, 'follicular', 6);
    checkPhase(13, 'ovulatory', 14);
    checkPhase(20, 'luteal', 21);
    checkPhase(28, 'luteal', 29, true); 
  });
});

describe('Ovulation timing', () => {
  const getP = (len: number) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const cycles = [
      { periodStart: addDays(today, -10) },
      { periodStart: addDays(today, -10 - len) },
      { periodStart: addDays(today, -10 - 2*len) }
    ];
    return computePrediction(cycles, { avgCycleLength: 28, avgPeriodLength: 5 });
  };

  it('computes correct ovulation for 28', () => {
    const p = getP(28);
    expect(daysBetween(p.ovulationDate, p.predictedStart)).toBe(14);
  });
  
  it('computes correct ovulation for 32', () => {
    const p = getP(32);
    expect(daysBetween(p.ovulationDate, p.predictedStart)).toBe(14);
  });
  
  it('computes correct ovulation for 21', () => {
    const p = getP(21);
    expect(daysBetween(p.ovulationDate, p.predictedStart)).toBe(14);
  });
});

describe('Late period', () => {
  it('calculates negative daysUntilNextPeriod', () => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const cycles: CycleInput[] = [
      { periodStart: addDays(today, -32) },
      { periodStart: addDays(today, -60) } // 28 len
    ];
    
    const p = computePrediction(cycles, { avgCycleLength: 28, avgPeriodLength: 5 });
    expect(p.isLate).toBe(true);
    expect(p.daysUntilNextPeriod).toBe(-4);
  });
});

describe('Fertile window', () => {
  it('is correct width', () => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const cycles: CycleInput[] = [
      { periodStart: addDays(today, -10) },
      { periodStart: addDays(today, -38) }
    ];
    const p = computePrediction(cycles, { avgCycleLength: 28, avgPeriodLength: 5 });
    
    expect(daysBetween(p.ovulationDate, p.fertileStart)).toBe(-5);
    expect(daysBetween(p.ovulationDate, p.fertileEnd)).toBe(1);
  });
});
