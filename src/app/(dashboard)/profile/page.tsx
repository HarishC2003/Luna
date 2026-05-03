'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'profile'|'notifications'|'account'>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  interface UserProfile {
    displayName?: string;
    dateOfBirth?: string;
    conditions?: string[];
    goals?: string[];
    email?: string;
  }

  interface UserSettings {
    email_period_reminder?: boolean;
    email_fertile_window?: boolean;
    email_log_streak?: boolean;
    email_weekly_insights?: boolean;
    email_tips?: boolean;
    push_period_reminder?: boolean;
    push_fertile_window?: boolean;
    push_log_reminder?: boolean;
    notify_hour?: number | string;
    notify_days_before?: number | string;
  }

  interface PrivacySummary {
    pendingDeletion?: boolean;
    pendingDeletionAt?: string;
  }

  // Profile Data
  const [profile, setProfile] = useState<UserProfile>({});
  // Settings Data
  const [settings, setSettings] = useState<UserSettings>({});
  // Privacy Summary (only for account deletion status)
  const [privacy, setPrivacy] = useState<PrivacySummary>({});

  const { isSupported, isSubscribed, subscribe, unsubscribe, isLoading: pushLoading } = usePushNotifications();
  const [deletionPhrase, setDeletionPhrase] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [profRes, setRes, privRes] = await Promise.all([
        fetch('/api/profile'),
        fetch('/api/settings'),
        fetch('/api/privacy/summary')
      ]);
      if (profRes.ok) {
        const profileData = await profRes.json();
        setProfile(profileData);
      }
      if (setRes.ok) {
        const settingsData = await setRes.json();
        setSettings(settingsData);
      }
      if (privRes.ok) {
        const privacyData = await privRes.json();
        setPrivacy(privacyData);
      }
    } catch (_err) {
      console.error('Failed to load profile:', _err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    void fetchData();
  }, [fetchData]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: profile.displayName,
          dateOfBirth: profile.dateOfBirth,
          conditions: profile.conditions,
          goals: profile.goals
        })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save');
      }
      setSuccess('Profile updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save profile';
      setError(message);
      setTimeout(() => setError(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (!res.ok) throw new Error('Failed to save settings');
      setSuccess('Settings saved');
      setTimeout(() => setSuccess(''), 3000);
    } catch (_err) {
      setError('Failed to save settings');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deletionPhrase !== 'delete my account') return alert('Type exactly: delete my account');
    try {
      const res = await fetch('/api/privacy/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmPhrase: deletionPhrase })
      });
      if (!res.ok) throw new Error((await res.json()).error);
      alert('Account scheduled for deletion.');
      const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
      await supabase.auth.signOut();
      router.push('/login');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to schedule deletion.');
    }
  };

  const handleResetPassword = async () => {
    if (!profile.email) {
      setError('Email address not found.');
      setTimeout(() => setError(''), 3000);
      return;
    }
    setSaving(true);
    try {
      const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(profile.email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (resetErr) throw resetErr;
      setSuccess('Password reset email sent! Check your inbox.');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
      setTimeout(() => setError(''), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    } catch (_err: unknown) {
      setError('Failed to log out.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleTestPush = async () => {
    try {
      await fetch('/api/notifications/test', { method: 'POST' });
      alert('Test sent!');
    } catch (_err) {
      alert('Failed to send test push.');
    }
  };

  const toggleCondition = (c: string) => {
    setProfile(prev => ({
      ...prev,
      conditions: prev.conditions?.includes(c)
        ? prev.conditions.filter(item => item !== c)
        : [...(prev.conditions || []), c]
    }));
  };

  const toggleGoal = (g: string) => {
    setProfile(prev => ({
      ...prev,
      goals: prev.goals?.includes(g)
        ? prev.goals.filter(item => item !== g)
        : [...(prev.goals || []), g]
    }));
  };

  if (loading) return (
    <div className="max-w-3xl mx-auto pb-10 space-y-4 pt-8 px-6">
      <div className="h-12 bg-gray-200 rounded animate-pulse" />
      <div className="h-12 bg-gray-200 rounded animate-pulse" />
      <div className="h-12 bg-gray-200 rounded animate-pulse" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto pb-10 px-6 sm:px-0 mt-6 relative">
      {success && (
        <div className="fixed top-4 right-4 bg-green-100 text-green-800 px-4 py-3 rounded-lg shadow-lg z-50">
          {success}
        </div>
      )}
      {error && (
        <div className="fixed top-4 right-4 bg-red-100 text-red-800 px-4 py-3 rounded-lg shadow-lg z-50">
          {error}
        </div>
      )}

      <h1 className="text-3xl font-extrabold text-[#4A1B3C] mb-8">Settings</h1>
      
      {/* Tab Nav */}
      <div className="flex border-b border-[#E85D9A]/20 mb-8 overflow-x-auto hide-scrollbar">
        {['profile', 'notifications', 'account'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab as 'profile'|'notifications'|'account')} className={`px-6 py-3 font-semibold uppercase tracking-wider text-sm transition-colors whitespace-nowrap ${activeTab === tab ? 'text-[#E85D9A] border-b-2 border-[#E85D9A]' : 'text-[#4A1B3C]/50 hover:text-[#E85D9A]/70'}`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <form onSubmit={saveProfile} className="space-y-6 animate-fade-in bg-white p-6 rounded-3xl shadow-sm border border-[#E85D9A]/10">
          <div>
            <label className="block text-sm font-semibold text-[#4A1B3C] mb-2 uppercase tracking-wide">Display Name</label>
            <input type="text" value={profile.displayName || ''} onChange={e => setProfile({...profile, displayName: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-[#E85D9A]/20 focus:border-[#E85D9A] outline-none text-[#4A1B3C]" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#4A1B3C] mb-2 uppercase tracking-wide">Date of Birth</label>
            <input type="date" value={profile.dateOfBirth || ''} onChange={e => setProfile({...profile, dateOfBirth: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-[#E85D9A]/20 focus:border-[#E85D9A] outline-none text-[#4A1B3C]" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#4A1B3C] mb-2 uppercase tracking-wide">Health Conditions</label>
            <div className="flex flex-wrap gap-2">
              {['pcos', 'endometriosis', 'irregular', 'none'].map(c => (
                <button type="button" key={c} onClick={() => toggleCondition(c)} className={`px-4 py-2 rounded-full uppercase text-xs font-bold transition-colors ${profile.conditions?.includes(c) ? 'bg-[#E85D9A] text-white' : 'bg-gray-100 text-[#4A1B3C]'}`}>{c}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#4A1B3C] mb-2 uppercase tracking-wide">Goals</label>
            <div className="flex flex-wrap gap-2">
              {['track', 'conceive', 'avoid', 'health'].map(c => (
                <button type="button" key={c} onClick={() => toggleGoal(c)} className={`px-4 py-2 rounded-full uppercase text-xs font-bold transition-colors ${profile.goals?.includes(c) ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-[#4A1B3C]'}`}>{c}</button>
              ))}
            </div>
          </div>
          <button type="submit" disabled={saving} className="mt-4 px-8 py-3 bg-[#E85D9A] text-white font-bold rounded-xl shadow-md w-full sm:w-auto">Save Profile</button>
        </form>
      )}

      {activeTab === 'notifications' && (
        <form onSubmit={saveSettings} className="space-y-8 animate-fade-in bg-white p-6 rounded-3xl shadow-sm border border-[#E85D9A]/10">
          <div>
            <h3 className="text-xl font-bold text-[#4A1B3C] mb-4">Email Notifications</h3>
            <div className="space-y-3">
              {['email_period_reminder', 'email_fertile_window', 'email_weekly_insights'].map(key => (
                <label key={key} className="flex items-center justify-between p-3 border border-[#E85D9A]/10 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                  <span className="text-[#4A1B3C] font-medium capitalize">{key.replace('email_', '').replace('_', ' ')}</span>
                  <input type="checkbox" checked={!!settings[key as keyof UserSettings]} onChange={e => setSettings({...settings, [key]: e.target.checked})} className="w-5 h-5 accent-[#E85D9A]" />
                </label>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold text-[#4A1B3C] mb-4 flex items-center justify-between">
              Push Notifications
              {!isSupported ? (
                <span className="text-xs text-red-500 font-normal">Not Supported</span>
              ) : isSubscribed ? (
                <button type="button" onClick={unsubscribe} disabled={pushLoading} className="text-xs px-3 py-1 bg-gray-200 rounded-full text-[#4A1B3C] font-bold">Disable</button>
              ) : (
                <button type="button" onClick={subscribe} disabled={pushLoading} className="text-xs px-3 py-1 bg-[#E85D9A] text-white rounded-full font-bold">Enable Now</button>
              )}
            </h3>
            {isSubscribed && (
              <div className="space-y-3 mb-4">
                <button type="button" onClick={handleTestPush} className="w-full p-2 border border-dashed border-[#E85D9A] text-[#E85D9A] font-bold rounded-xl text-center text-sm">Send Test Notification</button>
                {['push_period_reminder', 'push_fertile_window', 'push_log_reminder'].map(key => (
                  <label key={key} className="flex items-center justify-between p-3 border border-[#E85D9A]/10 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                    <span className="text-[#4A1B3C] font-medium capitalize">{key.replace('push_', '').replace('_', ' ')}</span>
                    <input type="checkbox" checked={!!settings[key as keyof UserSettings]} onChange={e => setSettings({...settings, [key]: e.target.checked})} className="w-5 h-5 accent-[#E85D9A]" />
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
               <label className="block text-sm font-semibold text-[#4A1B3C] mb-2 uppercase tracking-wide">Days Before</label>
               <select value={settings.notify_days_before || 2} onChange={e => setSettings({...settings, notify_days_before: e.target.value})} className="w-full p-3 rounded-xl border border-[#E85D9A]/20 bg-white text-[#4A1B3C]">
                  {[1,2,3,4,5].map(d => <option key={d} value={d}>{d} days</option>)}
               </select>
            </div>
            <div>
               <label className="block text-sm font-semibold text-[#4A1B3C] mb-2 uppercase tracking-wide">Time of day</label>
               <select value={settings.notify_hour || 8} onChange={e => setSettings({...settings, notify_hour: e.target.value})} className="w-full p-3 rounded-xl border border-[#E85D9A]/20 bg-white text-[#4A1B3C]">
                  <option value={8}>8:00 AM</option>
                  <option value={12}>12:00 PM</option>
                  <option value={18}>6:00 PM</option>
                  <option value={20}>8:00 PM</option>
               </select>
            </div>
          </div>

          <button type="submit" disabled={saving} className="mt-4 px-8 py-3 bg-[#E85D9A] text-white font-bold rounded-xl shadow-md w-full sm:w-auto">Save Settings</button>
        </form>
      )}

      {activeTab === 'account' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#E85D9A]/10">
            <h3 className="text-xl font-bold text-[#4A1B3C] mb-2">Reset Password</h3>
            <p className="text-[#4A1B3C]/70 text-sm mb-4">You will receive an email instruction at {profile.email} to securely reset your credentials.</p>
            <button disabled={saving} className="px-6 py-2 bg-gray-100 hover:bg-gray-200 transition-colors font-bold text-[#4A1B3C] rounded-lg disabled:opacity-50" onClick={handleResetPassword}>Send Reset Email</button>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#E85D9A]/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-xl font-bold text-[#4A1B3C] mb-1">Sign Out</h3>
              <p className="text-[#4A1B3C]/70 text-sm">Log out of your account securely.</p>
            </div>
            <button onClick={handleLogout} className="px-8 py-3 bg-[#4A1B3C] hover:bg-[#321228] transition-colors text-white font-bold rounded-xl shadow-sm w-full sm:w-auto">Log Out</button>
          </div>
          {privacy.pendingDeletion ? (
            <div className="p-6 rounded-3xl border-2 border-red-500 bg-red-50 text-red-700 font-bold">Your account is scheduled for total deletion at {new Date(privacy.pendingDeletionAt || '').toLocaleString()}. Check your email to cancel.</div>
          ) : (
            <div className="p-6 rounded-3xl border-2 border-red-100 bg-red-50">
              <h3 className="text-xl font-black text-red-600 mb-2">Danger Zone</h3>
              <p className="text-red-600/70 text-sm mb-4">Deleting your account is permanent. All cycle records, daily logs, and predictions will be immediately wiped from Supabase infrastructure. Chat history is never stored, so it remains ephemeral.</p>
              <div className="mb-4">
                <input type="text" placeholder="Type: delete my account" value={deletionPhrase} onChange={e => setDeletionPhrase(e.target.value)} className="w-full px-4 py-3 border border-red-200 rounded-xl focus:border-red-500 outline-none" />
              </div>
              <button disabled={deletionPhrase !== 'delete my account'} onClick={handleDeleteAccount} className="px-8 py-3 bg-red-600 text-white font-bold rounded-xl disabled:bg-red-300 w-full">Delete Everything</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
