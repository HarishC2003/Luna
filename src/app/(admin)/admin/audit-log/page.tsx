import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AuditLogPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') redirect('/dashboard');

  const { data: logs } = await admin.from('admin_audit_log').select(`
    *,
    profiles ( email, display_name )
  `).order('created_at', { ascending: false }).limit(100);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-extrabold text-[#4A1B3C]">Admin Audit Log</h2>
      <p className="text-gray-500">Immutable record of all administrative actions. (Recent 100 entries)</p>

      <div className="bg-white rounded-3xl shadow-sm border border-[#E85D9A]/10 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase">Timestamp</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase">Admin</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase">Action</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase">Target</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase">Metadata</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(logs || []).map(log => (
              <tr key={log.id} className="hover:bg-gray-50/50">
                <td className="p-4 text-sm font-mono text-gray-500">{new Date(log.created_at).toLocaleString()}</td>
                <td className="p-4">
                  <p className="font-bold text-[#4A1B3C]">{(log.profiles as any)?.email}</p>
                </td>
                <td className="p-4">
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-bold font-mono">
                    {log.action}
                  </span>
                </td>
                <td className="p-4 font-mono text-xs">{log.target_type}: {log.target_id?.split('-')[0] || 'N/A'}</td>
                <td className="p-4 text-xs text-gray-500 max-w-xs truncate" title={JSON.stringify(log.metadata)}>
                  {JSON.stringify(log.metadata)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
