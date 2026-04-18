'use client';

import { useState, useEffect } from 'react';
import type { AdminUser } from '@/types/admin';

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sort, setSort] = useState('created_at');
  
  useEffect(() => {
    const t = setTimeout(() => fetchUsers(), 400);
    return () => clearTimeout(t);
  }, [search, page, sort]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?page=${page}&limit=20&search=${search}&sort=${sort}&order=desc`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setTotalPages(data.totalPages || 1);
      }
    } finally {
      setLoading(false);
    }
  };

  const changeRole = async (id: string, role: string) => {
    const res = await fetch(`/api/admin/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role })
    });
    if (res.ok) {
      alert('Role updated');
      fetchUsers();
    } else {
      alert((await res.json()).error);
    }
  };

  const suspendUser = async (id: string) => {
    const reason = prompt('Reason for suspension (10-500 chars):');
    if (!reason) return;
    const res = await fetch(`/api/admin/users/${id}/suspend`, {
      method: 'POST',
      body: JSON.stringify({ action: 'suspend', reason })
    });
    if (res.ok) fetchUsers();
    else alert((await res.json()).error);
  };

  const liftSuspension = async (id: string) => {
    const res = await fetch(`/api/admin/users/${id}/suspend`, {
      method: 'POST',
      body: JSON.stringify({ action: 'lift', reason: '' })
    });
    if (res.ok) fetchUsers();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-extrabold text-[#4A1B3C]">Users</h2>
        <input 
          type="text" 
          placeholder="Search by email..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          className="px-4 py-2 border rounded-xl"
        />
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-[#E85D9A]/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">User</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase cursor-pointer" onClick={() => setSort('created_at')}>Joined</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Cycles</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50/50">
                  <td className="p-4">
                    <p className="font-bold text-[#4A1B3C]">{u.email}</p>
                    <p className="text-xs text-gray-500">{u.display_name || 'No name'}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold ${u.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{u.role}</span>
                  </td>
                  <td className="p-4 text-sm text-gray-600">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="p-4 font-mono text-sm">{u.cycle_log_count}</td>
                  <td className="p-4">
                    {u.is_suspended ? <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded">Suspended</span> :
                     !u.email_verified_at ? <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">Unverified</span> :
                     <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">Active</span>}
                  </td>
                  <td className="p-4">
                    <select onChange={e => {
                      if (e.target.value === 'suspend') suspendUser(u.id);
                      else if (e.target.value === 'lift') liftSuspension(u.id);
                      else if (e.target.value === 'admin' || e.target.value === 'user') changeRole(u.id, e.target.value);
                      e.target.value = '';
                    }} className="text-sm bg-gray-100 rounded-lg p-1" defaultValue="">
                      <option value="" disabled>Actions...</option>
                      <option value={u.role === 'admin' ? 'user' : 'admin'}>Make {u.role === 'admin' ? 'User' : 'Admin'}</option>
                      {u.is_suspended ? <option value="lift">Lift Suspension</option> : <option value="suspend">Suspend</option>}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t flex justify-between bg-gray-50">
          <button disabled={page === 1} onClick={() => setPage(page-1)} className="px-4 py-1 bg-white border rounded">Prev</button>
          <span className="text-sm font-semibold">Page {page} of {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(page+1)} className="px-4 py-1 bg-white border rounded">Next</button>
        </div>
      </div>
    </div>
  );
}
