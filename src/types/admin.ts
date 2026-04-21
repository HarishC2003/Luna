export interface AdminStats {
  totalUsers: number;
  newUsersToday: number;
  activeThisWeek: number;
  totalCycleLogs: number;
  totalDailyLogs: number;
  notificationsSentToday: number;
  chatFeedbackCount: number;
  crisisDetectedTotal: number;
  pendingDeletions: number;
  suspendedUsers: number;
}

export interface AdminUser {
  id: string;
  email: string;
  display_name: string | null;
  role: string;
  email_verified_at: string | null;
  created_at: string;
  onboarding_completed: boolean;
  cycle_log_count: number;
  last_active: string | null;
  is_suspended: boolean;
}

export interface AuthLogEntry {
  id: string;
  user_id: string;
  event_type: string;
  ip_address: string;
  user_agent: string | null;
  success: boolean;
  created_at: string;
}

export interface AbuseLogEntry {
  id: string;
  user_id: string;
  session_id: string;
  reason: string;
  severity: 'low' | 'medium' | 'high';
  payload: unknown;
  created_at: string;
  metadata: Record<string, unknown>;
}

export interface AnalyticsData {
  period: number;
  newUsersPerDay: { date: string; count: number }[];
  cycleLogsPerDay: { date: string; count: number }[];
  notificationsPerDay: { date: string; count: number }[];
  conditionsBreakdown: { label: string; value: number; percentage: number }[];
  goalsBreakdown: { label: string; value: number; percentage: number }[];
  retention7d: number;
  retention30d: number;
  cycleDistribution: { label: string; value: number }[];
}

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  description: string;
  updated_at: string;
  updated_by_email?: string;
}

export interface UserSuspension {
  id: string;
  user_id: string;
  suspended_by: string;
  reason: string;
  suspended_at: string;
  lifted_at: string | null;
  lifted_by: string | null;
}

export interface NotificationLogEntry {
  id: string;
  user_id: string;
  notification_type: string;
  channel: string;
  success: boolean;
  sent_at: string;
}

export interface AdminUserDetail {
  id: string;
  email: string;
  display_name: string | null;
  role: string;
  created_at: string;
  cycleStats: { count: number; avgCycleLength: number | null };
  recentAuthLogs: AuthLogEntry[];
  suspensionHistory: UserSuspension[];
  notificationSettings: unknown;
}
