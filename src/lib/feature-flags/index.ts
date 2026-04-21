import { createAdminClient } from '../supabase/admin';
import { logAdminAction } from '../admin/audit-logger';

export type FeatureFlagKey = 'ai_chat_enabled' | 'new_registrations_open' | 'push_notifications_active' | 'maintenance_mode' | 'data_export_enabled' | 'cycle_predictions_enabled';

interface CacheEntry {
  value: boolean;
  timestamp: number;
}

const flagCache = new Map<FeatureFlagKey, CacheEntry>();
const CACHE_TTL = 60 * 1000; // 60 seconds

export async function getFeatureFlag(key: FeatureFlagKey): Promise<boolean> {
  const now = Date.now();
  const cached = flagCache.get(key);
  if (cached && (now - cached.timestamp < CACHE_TTL)) {
    return cached.value;
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.from('feature_flags').select('enabled').eq('key', key).maybeSingle();
    
    if (error) throw error;
    
    if (data) {
      flagCache.set(key, { value: data.enabled, timestamp: now });
      return data.enabled;
    }
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err) {
      const gerr = err as { code: string };
      if (gerr.code !== 'PGRST205' && gerr.code !== '42P01') {
        console.error(`Error fetching feature flag ${key}:`, err);
      }
    }
  }
  
  // Fail-open for most, fail-safe (false) for maintenance_mode
  return key !== 'maintenance_mode';
}

export async function getAllFeatureFlags(): Promise<Record<FeatureFlagKey, boolean>> {
  const admin = createAdminClient();
  const { data } = await admin.from('feature_flags').select('key, enabled');
  const result = {} as Record<FeatureFlagKey, boolean>;
  if (data) {
    data.forEach(row => {
      result[row.key as FeatureFlagKey] = row.enabled;
    });
  }
  return result;
}

export async function setFeatureFlag(key: FeatureFlagKey, enabled: boolean, adminId: string): Promise<void> {
  const admin = createAdminClient();
  
  const { data: previousData } = await admin.from('feature_flags').select('enabled').eq('key', key).maybeSingle();
  const previous_value = previousData ? previousData.enabled : null;

  await admin.from('feature_flags').update({ enabled, updated_by: adminId, updated_at: new Date().toISOString() }).eq('key', key);
  
  flagCache.delete(key);
  
  await logAdminAction({
    adminId,
    action: 'feature_flag_update',
    targetType: 'feature_flag',
    targetId: key,
    metadata: { enabled, previous_value }
  });
}
