'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/Toast';
import { Skeleton } from '@/components/ui/Skeleton';

export default function PrivacyPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);

  interface PrivacySummary {
    cycleLogs?: number;
    dailyLogs?: number;
    chatFeedback?: number;
    pendingDeletion?: boolean;
    pendingDeletionAt?: string;
  }

  interface Report {
    download_url: string;
    created_at: string;
  }

  const [privacy, setPrivacy] = useState<PrivacySummary>({});
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [reportType, setReportType] = useState<'month' | 'range'>('month');
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [reportStartDate, setReportStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [reportEndDate, setReportEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [reportGenerating, setReportGenerating] = useState(false);
  const [reportUrl, setReportUrl] = useState<string | null>(null);
  const [recentReports, setRecentReports] = useState<Report[]>([]);
  const [partnerEnabled, setPartnerEnabled] = useState(false);
  const [partnerToken, setPartnerToken] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [partnerToggling, setPartnerToggling] = useState<'generating' | 'disabling' | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [privRes, profRes] = await Promise.all([
        fetch('/api/privacy/summary'),
        fetch('/api/profile'),
      ]);
      if (privRes.ok) {
        const privacyData = await privRes.json();
        setPrivacy(privacyData);
      }
      if (profRes.ok) {
        const profileData = await profRes.json();
        setPartnerEnabled(profileData.partner_share_enabled || false);
        setPartnerToken(profileData.partner_share_token || null);
      }
    } catch (_err) {
      console.error('Failed to load privacy data:', _err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReports = useCallback(async () => {
    try {
      const res = await fetch('/api/privacy/reports');
      const data = await res.json();
      setRecentReports(data.reports || []);
    } catch (_e) {
      console.error(_e);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchData();
    void fetchReports();
  }, [fetchData, fetchReports]);

  const handleTogglePartnerShare = async () => {
    if (partnerToggling) return;
    const newEnabled = !partnerEnabled;
    setPartnerToggling(newEnabled ? 'generating' : 'disabling');
    try {
      const res = await fetch('/api/profile/partner-share', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newEnabled }),
      });
      if (res.ok) {
        const data = await res.json();
        setPartnerEnabled(data.enabled);
        setPartnerToken(data.token);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPartnerToggling(null);
    }
  };

  const copyPartnerLink = () => {
    if (partnerToken) {
      navigator.clipboard.writeText(`${window.location.origin}/partner/${partnerToken}`);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/privacy/export', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Export failed');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      setExportUrl(url);
      showToast('success', 'Export generated successfully');
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleGenerateReport = async () => {
    setReportGenerating(true);
    setReportUrl(null);
    try {
      const payload = reportType === 'month' 
        ? { month: reportMonth, year: reportYear }
        : { startDate: reportStartDate, endDate: reportEndDate };
        
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Report generation failed');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      setReportUrl(url);
      fetchReports();
      showToast('success', 'Report generated successfully');
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Report generation failed');
    } finally {
      setReportGenerating(false);
    }
  };

  if (loading) return (
    <div className="max-w-3xl mx-auto pb-10 space-y-4 pt-8 px-6">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto pb-10 px-6 sm:px-0 mt-6 relative">
      <h1 className="text-3xl font-extrabold text-[#4A1B3C] mb-8">Privacy &amp; Data</h1>

      <div className="space-y-6 animate-fade-in bg-white p-6 rounded-3xl shadow-sm border border-[#E85D9A]/10">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-xl text-center"><div className="text-2xl font-black text-[#E85D9A]">{privacy.cycleLogs || 0}</div><div className="text-xs font-bold text-[#4A1B3C] uppercase text-opacity-50 mt-1">Cycles</div></div>
          <div className="bg-gray-50 p-4 rounded-xl text-center"><div className="text-2xl font-black text-[#E85D9A]">{privacy.dailyLogs || 0}</div><div className="text-xs font-bold text-[#4A1B3C] uppercase text-opacity-50 mt-1">Logs</div></div>
          <div className="bg-gray-50 p-4 rounded-xl text-center"><div className="text-2xl font-black text-[#E85D9A]">{privacy.chatFeedback || 0}</div><div className="text-xs font-bold text-[#4A1B3C] uppercase text-opacity-50 mt-1">Feedback</div></div>
        </div>

        <div className="pt-8 border-t border-[#E85D9A]/10">
          <h3 className="text-xl font-bold text-[#4A1B3C] mb-2">Cycle PDF Report</h3>
          <p className="text-[#4A1B3C]/70 text-sm mb-6">Generate a detailed, doctor-ready PDF summary of your health data for any month or custom date range.</p>
          
          <div className="flex bg-gray-100 p-1 rounded-xl mb-6 w-full max-w-sm">
            <button onClick={() => setReportType('month')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${reportType === 'month' ? 'bg-white text-[#E85D9A] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>By Month</button>
            <button onClick={() => setReportType('range')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${reportType === 'range' ? 'bg-white text-[#E85D9A] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Custom Range</button>
          </div>

          {reportType === 'month' ? (
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
          ) : (
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex-1 min-w-[140px]">
                <label className="block text-[10px] font-bold text-[#4A1B3C]/50 uppercase mb-1.5 ml-1">Start Date</label>
                <input 
                  type="date"
                  value={reportStartDate} 
                  onChange={e => setReportStartDate(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#E85D9A]/20 bg-white text-[#4A1B3C] font-semibold focus:border-[#E85D9A] outline-none"
                />
              </div>
              <div className="flex-1 min-w-[140px]">
                <label className="block text-[10px] font-bold text-[#4A1B3C]/50 uppercase mb-1.5 ml-1">End Date</label>
                <input 
                  type="date"
                  value={reportEndDate} 
                  onChange={e => setReportEndDate(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#E85D9A]/20 bg-white text-[#4A1B3C] font-semibold focus:border-[#E85D9A] outline-none"
                />
              </div>
            </div>
          )}

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

          {recentReports.filter(rep => rep.download_url && rep.download_url !== 'direct_download').length > 0 && (
            <div className="mt-8">
              <h4 className="text-[10px] font-black text-[#4A1B3C]/30 uppercase tracking-[0.2em] mb-4">Past 3 Months</h4>
              <div className="space-y-3">
                {recentReports.filter(rep => rep.download_url && rep.download_url !== 'direct_download').slice(0, 3).map((rep, idx) => (
                  <a key={idx} href={rep.download_url} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-[#E85D9A]/20 transition-all group">
                     <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-lg bg-[#E85D9A]/10 flex items-center justify-center text-[#E85D9A]">
                         <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                       </div>
                       <div>
                         <p className="text-sm font-bold text-[#4A1B3C]">Cycle Report</p>
                         <p className="text-[10px] text-[#4A1B3C]/50">{new Date(rep.created_at || '').toLocaleDateString([], { month: 'short', year: 'numeric' })}</p>
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
            <h3 className="text-xl font-bold text-[#4A1B3C] mb-2">Partner Sharing</h3>
            <p className="text-[#4A1B3C]/70 text-sm mb-4">
              Share a read-only view of your cycle insights with a partner. They&apos;ll see your current phase and helpful tips — not your raw health data or notes.
            </p>
            
            <div 
              className={`flex items-center justify-between bg-[#FDF8FA] p-4 rounded-2xl border border-[#E85D9A]/10 mb-4 hover:border-[#E85D9A]/30 transition-colors ${partnerToggling ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`} 
              onClick={partnerToggling ? undefined : handleTogglePartnerShare}
            >
              <div className="flex flex-col">
                <span className="text-[15px] font-bold text-[#4A1B3C]">
                  {partnerToggling === 'generating' 
                    ? 'Generating...' 
                    : partnerToggling === 'disabling' 
                      ? 'Disabling...' 
                      : 'Enable Partner Link'}
                </span>
                {partnerToggling && (
                  <span className="text-xs text-[#E85D9A] animate-pulse">
                    {partnerToggling === 'generating' ? 'Please wait, generating link...' : 'Please wait, disabling link...'}
                  </span>
                )}
              </div>
              <button
                type="button"
                disabled={!!partnerToggling}
                className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  partnerEnabled ? 'bg-gradient-to-r from-[#E85D9A] to-[#D93F7D] shadow-inner' : 'bg-gray-200'
                } ${partnerToggling ? 'opacity-50 cursor-not-allowed' : ''}`}
                role="switch"
                aria-checked={partnerEnabled}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    partnerEnabled ? 'translate-x-8' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {partnerEnabled && partnerToken && (
              <div className="p-4 bg-[#E85D9A]/5 rounded-xl border border-[#E85D9A]/20">
                <div className="text-sm font-bold text-[#4A1B3C] mb-2">Share this link with your partner:</div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/partner/${partnerToken}`}
                    readOnly
                    className="flex-1 px-4 py-2.5 text-sm bg-white border border-[#E85D9A]/20 rounded-lg outline-none text-[#4A1B3C] w-full"
                  />
                  <button
                    type="button"
                    onClick={copyPartnerLink}
                    className="w-full sm:w-auto px-6 py-2.5 bg-[#E85D9A] text-white font-bold text-sm rounded-lg hover:bg-[#d44d88] transition-colors whitespace-nowrap shadow-sm active:scale-95"
                  >
                    {copySuccess ? 'Copied!' : 'Copy Link'}
                  </button>
                </div>
                <p className="text-xs text-[#4A1B3C]/50 mt-3 font-medium">
                  This link is private. Only share it with someone you trust.
                </p>
              </div>
            )}
          </div>

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
    </div>
  );
}
