export interface NotificationSettings {
  id: string;
  user_id: string;
  email_period_reminder: boolean;
  email_fertile_window: boolean;
  email_log_streak: boolean;
  email_weekly_insights: boolean;
  email_tips: boolean;
  push_period_reminder: boolean;
  push_fertile_window: boolean;
  push_log_reminder: boolean;
  notify_hour: number;
  notify_days_before: number;
  created_at: string;
  updated_at: string;
}

export interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth_key: string;
  user_agent: string | null;
  created_at: string;
}

export interface PrivacySummary {
  cycleLogs: number;
  dailyLogs: number;
  pushSubscriptions: number;
  chatFeedback: number;
  accountCreatedAt: string | null;
  lastActiveAt: string | null;
  storageLocations: Record<string, string>;
  pendingDeletion: boolean;
  pendingDeletionAt: string | null;
}

export interface DataExportRequest {
  id: string;
  user_id: string;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  download_url: string | null;
  expires_at: string | null;
  created_at: string;
}
