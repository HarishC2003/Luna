'use client';

import { useState, useEffect } from 'react';
import type { AnalyticsData } from '@/types/admin';
import { BarChart } from '@/components/admin/charts/BarChart';
import { LineChart } from '@/components/admin/charts/LineChart';
import { HorizontalBarChart } from '@/components/admin/charts/HorizontalBarChart';

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    fetch(`/api/admin/analytics?period=${period}`)
      .then(res => res.json())
      .then(setData);
  }, [period]);

  if (!data) return <div className="animate-pulse">Loading analytics...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-extrabold text-[#4A1B3C]">Analytics</h2>
        <select value={period} onChange={e => setPeriod(parseInt(e.target.value))} className="p-2 border rounded-xl">
          <option value={7}>Last 7 Days</option>
          <option value={14}>Last 14 Days</option>
          <option value={30}>Last 30 Days</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#E85D9A]/10">
          <h3 className="font-bold text-[#4A1B3C] mb-6">New Users Per Day</h3>
          <BarChart data={data.newUsersPerDay.map(d => ({ label: d.date, value: d.count }))} />
        </div>
        
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#E85D9A]/10">
          <h3 className="font-bold text-[#4A1B3C] mb-6">Cycle Logs Tracked</h3>
          <LineChart data={data.cycleLogsPerDay.map(d => ({ label: d.date, value: d.count }))} />
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#E85D9A]/10">
          <h3 className="font-bold text-[#4A1B3C] mb-6">Retention Overview</h3>
          <div className="flex items-center justify-around h-full pb-8">
            <div className="text-center">
              <p className="text-xs font-bold text-gray-500 uppercase">Active Last 7D</p>
              <p className="text-5xl font-black text-[#E85D9A]">{data.retention7d}</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-gray-500 uppercase">Active Last 30D</p>
              <p className="text-5xl font-black text-[#4A1B3C]">{data.retention30d}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#E85D9A]/10">
          <h3 className="font-bold text-[#4A1B3C] mb-6">Average Cycle Length Dist.</h3>
          <BarChart color="#4A1B3C" data={data.cycleDistribution} />
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#E85D9A]/10">
          <h3 className="font-bold text-[#4A1B3C] mb-6">Conditions Breakdown</h3>
          <HorizontalBarChart data={data.conditionsBreakdown} />
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#E85D9A]/10">
          <h3 className="font-bold text-[#4A1B3C] mb-6">User Goals</h3>
          <HorizontalBarChart data={data.goalsBreakdown} />
        </div>
      </div>
    </div>
  );
}
