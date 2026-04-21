import { createAdminClient } from '@/lib/supabase/admin';

export interface BadgeDefinition {
  key: string;
  name: string;
  description: string;
  emoji: string;
  color: string;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  { key: 'first_log',    name: 'First Step',      description: 'Logged your first daily entry',       emoji: '🌱', color: '#22c55e' },
  { key: 'first_chat',   name: 'Conversation',    description: 'Had your first chat with Luna AI',    emoji: '💬', color: '#8b5cf6' },
  { key: 'first_export', name: 'Data Owner',       description: 'Exported your health data',           emoji: '📦', color: '#6366f1' },
  { key: 'streak_3',     name: '3-Day Streak',     description: 'Logged 3 days in a row',              emoji: '🔥', color: '#f59e0b' },
  { key: 'streak_7',     name: 'Week Warrior',     description: 'Logged 7 days in a row',              emoji: '⚡', color: '#f97316' },
  { key: 'streak_14',    name: 'Fortnight Force',  description: 'Logged 14 days in a row',             emoji: '💪', color: '#ef4444' },
  { key: 'streak_30',    name: 'Monthly Maven',    description: 'Logged 30 days in a row',             emoji: '🏆', color: '#eab308' },
  { key: 'streak_60',    name: 'Cycle Master',     description: 'Logged 60 days in a row',             emoji: '👑', color: '#a855f7' },
  { key: 'streak_90',    name: 'Legendary',        description: 'Logged 90 days in a row — incredible', emoji: '🌟', color: '#E85D9A' },
  { key: 'cycles_3',     name: 'Pattern Finder',   description: 'Tracked 3 complete cycles',           emoji: '🔄', color: '#06b6d4' },
  { key: 'cycles_6',     name: 'Cycle Scholar',    description: 'Tracked 6 complete cycles',           emoji: '📊', color: '#0ea5e9' },
  { key: 'cycles_12',    name: 'Year of Insight',  description: 'Tracked 12 complete cycles',          emoji: '🎓', color: '#4A1B3C' },
];

export function getBadgeDefinition(key: string): BadgeDefinition | undefined {
  return BADGE_DEFINITIONS.find(b => b.key === key);
}

export async function calculateCurrentStreak(userId: string): Promise<number> {
  const admin = createAdminClient();
  
  const { data: logs } = await admin
    .from('daily_logs')
    .select('log_date')
    .eq('user_id', userId)
    .order('log_date', { ascending: false })
    .limit(120);

  if (!logs || logs.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.getFullYear() + '-' + String(yesterday.getMonth() + 1).padStart(2, '0') + '-' + String(yesterday.getDate()).padStart(2, '0');

  const dates = new Set(logs.map(l => l.log_date));

  // Streak starts from today or yesterday
  let startDate: Date;
  if (dates.has(todayStr)) {
    startDate = today;
  } else if (dates.has(yesterdayStr)) {
    startDate = yesterday;
  } else {
    return 0; // streak is broken
  }

  let streak = 0;
  const cursor = new Date(startDate);
  
  while (true) {
    const cursorStr = cursor.getFullYear() + '-' + String(cursor.getMonth() + 1).padStart(2, '0') + '-' + String(cursor.getDate()).padStart(2, '0');
    if (dates.has(cursorStr)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export async function calculateLongestStreak(userId: string): Promise<number> {
  const admin = createAdminClient();
  
  const { data: logs } = await admin
    .from('daily_logs')
    .select('log_date')
    .eq('user_id', userId)
    .order('log_date', { ascending: true });

  if (!logs || logs.length === 0) return 0;

  let longest = 1;
  let current = 1;

  for (let i = 1; i < logs.length; i++) {
    const prev = new Date(logs[i - 1].log_date);
    const curr = new Date(logs[i].log_date);
    const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000);
    
    if (diff === 1) {
      current++;
      longest = Math.max(longest, current);
    } else if (diff > 1) {
      current = 1;
    }
    // diff === 0 means duplicate date, skip
  }

  return longest;
}

export async function checkAndAwardBadges(userId: string): Promise<string[]> {
  const admin = createAdminClient();
  const newBadges: string[] = [];

  // Get existing badges
  const { data: existing } = await admin.from('user_badges').select('badge_key').eq('user_id', userId);
  const earnedKeys = new Set((existing || []).map(b => b.badge_key));

  // Calculate streak
  const streak = await calculateCurrentStreak(userId);

  // Check streak badges
  const streakMilestones = [
    { threshold: 3, key: 'streak_3' },
    { threshold: 7, key: 'streak_7' },
    { threshold: 14, key: 'streak_14' },
    { threshold: 30, key: 'streak_30' },
    { threshold: 60, key: 'streak_60' },
    { threshold: 90, key: 'streak_90' },
  ];

  for (const m of streakMilestones) {
    if (streak >= m.threshold && !earnedKeys.has(m.key)) {
      const { error } = await admin.from('user_badges').insert({ user_id: userId, badge_key: m.key });
      if (!error) newBadges.push(m.key);
    }
  }

  // Check first_log
  if (!earnedKeys.has('first_log')) {
    const { count } = await admin.from('daily_logs').select('id', { count: 'exact', head: true }).eq('user_id', userId);
    if (count && count >= 1) {
      const { error } = await admin.from('user_badges').insert({ user_id: userId, badge_key: 'first_log' });
      if (!error) newBadges.push('first_log');
    }
  }

  // Check cycle milestones
  const { count: cycleCount } = await admin.from('cycle_logs').select('id', { count: 'exact', head: true }).eq('user_id', userId);
  const cycleMilestones = [
    { threshold: 3, key: 'cycles_3' },
    { threshold: 6, key: 'cycles_6' },
    { threshold: 12, key: 'cycles_12' },
  ];
  for (const m of cycleMilestones) {
    if (cycleCount && cycleCount >= m.threshold && !earnedKeys.has(m.key)) {
      const { error } = await admin.from('user_badges').insert({ user_id: userId, badge_key: m.key });
      if (!error) newBadges.push(m.key);
    }
  }

  // Check first_chat
  if (!earnedKeys.has('first_chat')) {
    const { count: chatCount } = await admin.from('chat_messages').select('id', { count: 'exact', head: true }).eq('user_id', userId);
    if (chatCount && chatCount >= 1) {
      const { error } = await admin.from('user_badges').insert({ user_id: userId, badge_key: 'first_chat' });
      if (!error) newBadges.push('first_chat');
    }
  }

  return newBadges;
}
