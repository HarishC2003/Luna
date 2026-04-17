import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const adminClient = createAdminClient();
  const { data: routeUser } = await adminClient.from('profiles').select('role').eq('id', user.id).single();

  if (!routeUser || routeUser.role !== 'admin') {
    redirect('/dashboard');
  }

  // Fetch 10 most recent auth logs
  const { data: logs } = await adminClient
    .from('auth_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  return (
    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Luna Admin Panel</h1>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100/50">
              <th className="py-3 px-4 text-sm font-semibold text-gray-600 border-b">Time</th>
              <th className="py-3 px-4 text-sm font-semibold text-gray-600 border-b">Event Type</th>
              <th className="py-3 px-4 text-sm font-semibold text-gray-600 border-b">Status</th>
              <th className="py-3 px-4 text-sm font-semibold text-gray-600 border-b">IP Address</th>
            </tr>
          </thead>
          <tbody>
            {logs?.map((log) => (
              <tr key={log.id} className="border-b last:border-0 hover:bg-gray-50/50">
                <td className="py-3 px-4 text-sm text-gray-600">
                  {new Date(log.created_at).toLocaleString()}
                </td>
                <td className="py-3 px-4 text-sm font-medium text-gray-900">
                  {log.event_type}
                </td>
                <td className="py-3 px-4 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    log.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {log.success ? 'Success' : 'Failed'}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-gray-500 font-mono">
                  {log.ip_address}
                </td>
              </tr>
            ))}
            {(!logs || logs.length === 0) && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-gray-500">
                  No auth logs found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
