export type FlowIntensity = 'none' | 'spotting' | 'light' | 'medium' | 'heavy';
export type Mood = 'great' | 'good' | 'okay' | 'low' | 'terrible';
export type Symptom = 'cramps' | 'headache' | 'bloating' | 'breast_tenderness' | 'fatigue' | 'acne' | 'back_pain' | 'nausea' | 'mood_swings' | 'insomnia';
export type Phase = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal' | 'unknown';

export interface OnboardingData {
  id: string;
  user_id: string;
  avg_cycle_length: number;
  avg_period_length: number;
  last_period_start: string | null;
  conditions: string[];
  goals: string[];
  created_at: string;
  updated_at: string;
}

export interface CycleLog {
  id: string;
  user_id: string;
  period_start: string;
  period_end: string | null;
  cycle_length: number | null;
  avg_flow: FlowIntensity | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DailyLog {
  id: string;
  user_id: string;
  log_date: string;
  mood: Mood | null;
  energy: number | null;
  flow: FlowIntensity | null;
  symptoms: Symptom[];
  notes: string | null;
  water_glasses: number;
  created_at: string;
  updated_at: string;
}

export interface CyclePrediction {
  id: string;
  user_id: string;
  predicted_start: string | null;
  predicted_end: string | null;
  fertile_start: string | null;
  fertile_end: string | null;
  ovulation_date: string | null;
  confidence: number | null;
  based_on_cycles: number;
  computed_at: string;
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
  currentPhase: Phase;
  dayOfCycle: number;
  daysUntilNextPeriod: number;
  isLate: boolean;
  isPCOSMode: boolean;
}

export interface Insight {
  id: string;
  type: 'pattern' | 'tip' | 'alert' | 'milestone';
  title: string;
  body: string;
  phase?: string;
  priority: number;
}
