import { getPhaseColor, getPhaseDescription } from '@/lib/cycle/predictor';

interface Props {
  phase: string;
  daysUntilNext: number;
  dayOfCycle: number;
}

export function PhaseStatusCard({ phase, daysUntilNext, dayOfCycle }: Props) {
  const getIcon = () => {
    switch (phase) {
      case 'menstrual': return '🩸';
      case 'follicular': return '🌱';
      case 'ovulatory': return '✨';
      case 'luteal': return '🌙';
      default: return '⏳';
    }
  };

  const progress = Math.min(100, Math.max(0, (dayOfCycle / 28) * 100)); // Default roughly 28

  return (
    <div className={`w-full p-6 sm:p-8 rounded-3xl border shadow-sm ${getPhaseColor(phase)} bg-opacity-30`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full flex items-center justify-center text-3xl shadow-sm border border-current">
            {getIcon()}
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold capitalize">{phase} Phase</h2>
            <p className="opacity-80 font-medium text-sm sm:text-base mt-1">{getPhaseDescription(phase)}</p>
          </div>
        </div>
        
        <div className="bg-white px-6 py-4 rounded-2xl shadow-sm border border-current text-center w-full md:w-auto">
          <div className="text-4xl font-extrabold text-current opacity-90 mb-1">
            {daysUntilNext < 0 ? 'Late' : daysUntilNext}
          </div>
          <div className="text-sm font-semibold opacity-70 uppercase tracking-wider">
            {daysUntilNext < 0 ? 'Days Overdue' : 'Days Until Period'}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex justify-between text-sm font-semibold opacity-70 mb-2 uppercase tracking-wide">
          <span>Day 1</span>
          <span>Day {dayOfCycle > 0 ? dayOfCycle : '?'}</span>
          <span>Next Period</span>
        </div>
        <div className="h-3 w-full bg-white/50 rounded-full overflow-hidden border border-current shadow-inner">
          <div 
            className="h-full bg-current opacity-80 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
