'use client';

import { useState, useEffect } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'profile'|'notifications'|'privacy'|'account'>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Profile Data
  const [profile, setProfile] = useState<Record<string, any>>({});
  // Settings Data
  const [settings, setSettings] = useState<Record<string, any>>({});
  // Privacy Summary
  const [privacy, setPrivacy] = useState<Record<string, any>>({});

  const { isSupported, isSubscribed, subscribe, unsubscribe, isLoading: pushLoading } = usePushNotifications();
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [deletionPhrase, setDeletionPhrase] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [reportGenerating, setReportGenerating] = useState(false);
  const [reportUrl, setReportUrl] = useState<string | null>(null);
  const [recentReports, setRecentReports] = useState<Record<string, any>[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profRes, setRes, privRes] = await Promise.all([
        fetch('/api/profile'),
        fetch('/api/settings'),
        fetch('/api/privacy/summary')
      ]);
      setProfile(await profRes.json());
      setSettings(await setRes.json());
      setPrivacy(await privRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/privacy/reports'); // I need to create this simple list API or fetch from elsewhere
      const data = await res.json();
      setRecentReports(data.reports || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    if (activeTab === 'privacy') fetchReports();
  }, [activeTab]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: profile.displayName,
          dateOfBirth: profile.dateOfBirth,
          conditions: profile.conditions,
          goals: profile.goals
        })
      });
      alert('Profile saved!');
    } catch (err) {
      alert('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailPeriodReminder: settings.email_period_reminder,
          emailFertileWindow: settings.email_fertile_window,
          emailLogStreak: settings.email_log_streak,
          emailWeeklyInsights: settings.email_weekly_insights,
          emailTips: settings.email_tips,
          pushPeriodReminder: settings.push_period_reminder,
          pushFertileWindow: settings.push_fertile_window,
          pushLogReminder: settings.push_log_reminder,
          notifyHour: parseInt(settings.notify_hour),
          notifyDaysBefore: parseInt(settings.notify_days_before)
        })
      });
      alert('Settings saved!');
    } catch (err) {
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/privacy/export', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setExportUrl(data.downloadUrl);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleGenerateReport = async () => {
    setReportGenerating(true);
    setReportUrl(null);
    try {
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: reportMonth, year: reportYear })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setReportUrl(data.downloadUrl);
      fetchReports();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Report generation failed');
    } finally {
      setReportGenerating(false);
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

  const handleTestPush = async () => {
    try {
      await fetch('/api/notifications/test', { method: 'POST' });
      alert('Test sent!');
    } catch (err) {
      alert('Failed to send test push.');
    }
  };

  // Add conditions/goals toggle logic here, basic map for snippet
  const toggleArrayItem = (arr: string[] = [], item: string) => arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item].slice(0, 4);

  if (loading) return <div className="p-8 text-center text-[#E85D9A] animate-pulse">Loading settings...</div>;

  return (
    <div className="max-w-3xl mx-auto pb-10">
      <h1 className="text-3xl font-extrabold text-[#4A1B3C] mb-8">Settings</h1>
      
      {/* Tab Nav */}
      <div className="flex border-b border-[#E85D9A]/20 mb-8 overflow-x-auto hide-scrollbar">
        {['profile', 'notifications', 'privacy', 'account'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab as 'profile'|'notifications'|'privacy'|'account')} className={`px-6 py-3 font-semibold uppercase tracking-wider text-sm transition-colors whitespace-nowrap ${activeTab === tab ? 'text-[#E85D9A] border-b-2 border-[#E85D9A]' : 'text-[#4A1B3C]/50 hover:text-[#E85D9A]/70'}`}>
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
                <button type="button" key={c} onClick={() => setProfile({...profile, conditions: toggleArrayItem(profile.conditions, c)})} className={`px-4 py-2 rounded-full uppercase text-xs font-bold transition-colors ${profile.conditions?.includes(c) ? 'bg-[#E85D9A] text-white' : 'bg-gray-100 text-[#4A1B3C]'}`}>{c}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#4A1B3C] mb-2 uppercase tracking-wide">Goals</label>
            <div className="flex flex-wrap gap-2">
              {['track', 'conceive', 'avoid', 'health'].map(c => (
                <button type="button" key={c} onClick={() => setProfile({...profile, goals: toggleArrayItem(profile.goals, c)})} className={`px-4 py-2 rounded-full uppercase text-xs font-bold transition-colors ${profile.goals?.includes(c) ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-[#4A1B3C]'}`}>{c}</button>
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
                  <input type="checkbox" checked={!!settings[key]} onChange={e => setSettings({...settings, [key]: e.target.checked})} className="w-5 h-5 accent-[#E85D9A]" />
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
                    <input type="checkbox" checked={!!settings[key]} onChange={e => setSettings({...settings, [key]: e.target.checked})} className="w-5 h-5 accent-[#E85D9A]" />
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

      {activeTab === 'privacy' && (
        <div className="space-y-6 animate-fade-in bg-white p-6 rounded-3xl shadow-sm border border-[#E85D9A]/10">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-xl text-center"><div className="text-2xl font-black text-[#E85D9A]">{privacy.cycleLogs || 0}</div><div className="text-xs font-bold text-[#4A1B3C] uppercase text-opacity-50 mt-1">Cycles</div></div>
            <div className="bg-gray-50 p-4 rounded-xl text-center"><div className="text-2xl font-black text-[#E85D9A]">{privacy.dailyLogs || 0}</div><div className="text-xs font-bold text-[#4A1B3C] uppercase text-opacity-50 mt-1">Logs</div></div>
            <div className="bg-gray-50 p-4 rounded-xl text-center"><div className="text-2xl font-black text-[#E85D9A]">{privacy.chatFeedback || 0}</div><div className="text-xs font-bold text-[#4A1B3C] uppercase text-opacity-50 mt-1">Feedback</div></div>
          </div>

          <div className="pt-8 border-t border-[#E85D9A]/10">
            <h3 className="text-xl font-bold text-[#4A1B3C] mb-2">Monthly Cycle Report</h3>
            <p className="text-[#4A1B3C]/70 text-sm mb-6">Generate a detailed, doctor-ready PDF summary of your health data for any month.</p>
            
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex-1 min-w-[140px]">
                <label className="block text-[10px] font-bold text-[#4A1B3C]/50 uppercase mb-1.5 ml-1">Month</label>
                <select 
                  value={reportMonth} 
                  onChange={e => setReportMonth(parseInt(e.target.value))}
                  className="w-full p-3 rounded-xl border border-[#E85D9A]/20 bg-white text-[#4A1B3C] font-semibold focus:border-[#E85D9A] outline-none"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>{new Date(2025, i).toLocaleString('default', { month: 'long' })}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[100px]">
                <label className="block text-[10px] font-bold text-[#4A1B3C]/50 uppercase mb-1.5 ml-1">Year</label>
                <select 
                  value={reportYear} 
                  onChange={e => setReportYear(parseInt(e.target.value))}
                  className="w-full p-3 rounded-xl border border-[#E85D9A]/20 bg-white text-[#4A1B3C] font-semibold focus:border-[#E85D9A] outline-none"
                >
                  {[0, 1].map(offset => (
                    <option key={offset} value={new Date().getFullYear() - offset}>{new Date().getFullYear() - offset}</option>
                  ))}
                </select>
              </div>
            </div>

            {reportGenerating ? (
              <div className="w-full p-6 text-center space-y-4">
                <div className="flex justify-center flex-col items-center">
                  <div className="w-12 h-12 border-4 border-[#E85D9A]/20 border-t-[#E85D9A] rounded-full animate-spin mb-4" />
                  <p className="text-[#E85D9A] font-bold animate-pulse">Preparing your report...</p>
                </div>
              </div>
            ) : reportUrl ? (
              <div className="space-y-4">
                <a href={reportUrl} className="flex items-center justify-center gap-2 w-full bg-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg transform transition-transform active:scale-95" download>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                  Download Report
                </a>
                <button onClick={() => setReportUrl(null)} className="w-full text-center text-[#4A1B3C]/40 text-xs font-bold uppercase hover:text-[#E85D9A]">Generate another</button>
              </div>
            ) : (
              <button 
                onClick={handleGenerateReport} 
                className="w-full bg-[#E85D9A] hover:bg-[#d44d88] text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95"
              >
                Generate PDF Report
              </button>
            )}

            {recentReports.length > 0 && (
              <div className="mt-8">
                <h4 className="text-[10px] font-black text-[#4A1B3C]/30 uppercase tracking-[0.2em] mb-4">Past 3 Months</h4>
                <div className="space-y-3">
                  {recentReports.slice(0, 3).map((rep, idx) => (
                    <a key={idx} href={rep.download_url} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-[#E85D9A]/20 transition-all group">
                       <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg bg-[#E85D9A]/10 flex items-center justify-center text-[#E85D9A]">
                           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                         </div>
                         <div>
                           <p className="text-sm font-bold text-[#4A1B3C]">Cycle Report</p>
                           <p className="text-[10px] text-[#4A1B3C]/50">{new Date(rep.created_at).toLocaleDateString([], { month: 'short', year: 'numeric' })}</p>
                         </div>
                       </div>
                       <div className="text-[#E85D9A] opacity-0 group-hover:opacity-100 transition-opacity">
                         <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                       </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-8 mt-8 border-t border-[#E85D9A]/10">
              <h3 className="text-xl font-bold text-[#4A1B3C] mb-2">Export Data</h3>
              <p className="text-[#4A1B3C]/70 text-sm mb-4">Download a complete JSON trace of all parameters safely logged within your account.</p>
              {exportUrl ? (
                <a href={exportUrl} className="block text-center w-full bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-md" download>Download Export.json</a>
              ) : (
                <button onClick={handleExport} disabled={exporting} className="w-full sm:w-auto px-8 py-3 bg-[#4A1B3C] text-white font-bold rounded-xl shadow-md disabled:opacity-50">{exporting ? 'Generating...' : 'Generate New Export'}</button>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'account' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#E85D9A]/10">
            <h3 className="text-xl font-bold text-[#4A1B3C] mb-2">Reset Password</h3>
            <p className="text-[#4A1B3C]/70 text-sm mb-4">You will receive an email instruction at {profile.email} to securely reset your credentials.</p>
            <button className="px-6 py-2 bg-gray-100 font-bold text-[#4A1B3C] rounded-lg" onClick={() => { setResetSent(true); alert('Not implemented directly in this snippet, use supabase.auth.resetPasswordForEmail() in production!'); }}>Send Reset Email</button>
          </div>
          {privacy.pendingDeletion ? (
            <div className="p-6 rounded-3xl border-2 border-red-500 bg-red-50 text-red-700 font-bold">Your account is scheduled for total deletion at {new Date(privacy.pendingDeletionAt).toLocaleString()}. Check your email to cancel.</div>
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
