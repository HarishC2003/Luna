import { Insight, CycleLog, DailyLog } from '@/types/cycle';

export function generateInsights(cycles: CycleLog[], logs: DailyLog[]): Insight[] {
    const insights: Insight[] = [];
    const completedCycles = cycles.filter(c => c.cycle_length !== null).slice(0, 6);
    
    // 1. Cycle Regularity
    if (completedCycles.length >= 3) {
        const lengths = completedCycles.map(c => c.cycle_length!);
        const avg = lengths.reduce((a,b) => a+b, 0) / lengths.length;
        const squareDiffs = lengths.map(l => Math.pow(l - avg, 2));
        const variance = squareDiffs.reduce((a,b) => a+b, 0) / lengths.length;
        const stdDev = Math.sqrt(variance);
        
        if (stdDev > 7) {
            insights.push({
                id: 'pattern_irregular',
                type: 'alert',
                title: 'High cycle variation detected',
                body: `Your cycle lengths vary by an average of ${Math.round(stdDev)} days. Consistent high variation might be worth discussing with a doctor.`,
                priority: 1
            });
        }
    }

    // 2. Average Length 
    if (completedCycles.length > 0) {
        const avg = Math.round(completedCycles.reduce((a,b) => a+b.cycle_length!, 0) / completedCycles.length);
        const diff = avg - 28;
        let body = `Your average cycle is ${avg} days perfectly aligned with standard population averages.`;
        if (diff > 0) body = `Your ${avg} day cycle is slightly longer than the 28-day average, which is perfectly normal.`;
        if (diff < 0) body = `Your ${avg} day cycle is slightly shorter than the 28-day average, which is perfectly normal.`;
        
        insights.push({
            id: 'pattern_avg_length',
            type: 'pattern',
            title: 'Your Cycle Rhythm',
            body,
            priority: 2
        });
    }

    // 3. Common Symptoms
    if (logs.length > 0) {
        const symptomCounts: Record<string, number> = {};
        logs.forEach(log => {
            log.symptoms?.forEach(s => {
                symptomCounts[s] = (symptomCounts[s] || 0) + 1;
            });
        });
        
        const sorted = Object.entries(symptomCounts).sort((a,b) => b[1] - a[1]);
        if (sorted.length > 0) {
            const top3 = sorted.slice(0,3).map(s => s[0].replace('_', ' '));
            insights.push({
                id: 'pattern_symptoms',
                type: 'pattern',
                title: 'Most frequent symptoms',
                body: `You most commonly experience: ${top3.join(', ')}. Tracking these helps predict when they'll occur next.`,
                priority: 3
            });
        }
    }

    // 4. Streak
    if (logs.length > 0) {
        let streak = 0;
        const today = new Date();
        today.setHours(0,0,0,0);
        
        const sortedDates = [...logs].map(l => new Date(l.log_date).getTime()).sort((a,b) => b - a);
        
        let currentDate = today.getTime();
        for (let i = 0; i < sortedDates.length; i++) {
            const date = sortedDates[i];
            const diffDays = Math.floor((currentDate - date) / (1000 * 3600 * 24));
            if (diffDays === 0 || diffDays === 1) {
                streak++;
                currentDate = date; // shift window back
            } else if (diffDays > 1) {
                break;
            }
        }

        if (streak >= 7) {
            insights.push({
                id: `milestone_streak_${streak}`,
                type: 'milestone',
                title: `${streak} Day Streak! 🎉`,
                body: `Amazing consistency! You've logged your daily data for ${streak} days in a row.`,
                priority: 2
            });
        }
    }

    // 5. Cycle Count Milestone
    if (cycles.length === 3 || cycles.length === 6 || cycles.length === 12) {
        insights.push({
            id: `milestone_cycles_${cycles.length}`,
            type: 'milestone',
            title: 'Prediction Upgraded 📈',
            body: `You've logged ${cycles.length} cycles! Our algorithm's predictions for your next period are now significantly more accurate.`,
            priority: 2
        });
    }

    return insights.sort((a, b) => a.priority - b.priority);
}
