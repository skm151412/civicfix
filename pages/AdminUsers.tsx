import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Search, ShieldCheck } from 'lucide-react';
import MainLayout from '../components/MainLayout';
import Card from '../components/Card';
import Button from '../components/Button';
import { Input, Select } from '../components/Input';
import { getAllUsers, updateUserRole, UserProfile } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

const roleOptions: { label: string; value: UserRole | 'all' }[] = [
  { label: 'All roles', value: 'all' },
  { label: 'Citizen', value: 'citizen' },
  { label: 'Staff', value: 'staff' },
  { label: 'Admin', value: 'admin' },
];

const AdminUsers: React.FC = () => {
  const { profile, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<typeof roleOptions[number]['value']>('all');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      if (authLoading) return;
      if (profile?.role !== 'admin') {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const result = await getAllUsers();
        setUsers(result);
      } catch (err) {
        console.error(err);
        setError('Unable to load users. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [authLoading, profile?.role]);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesRole = roleFilter === 'all' ? true : user.role === roleFilter;
      const matchesSearch = term
        ? user.name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term)
        : true;
      return matchesRole && matchesSearch;
    });
  }, [users, search, roleFilter]);

  const handleRoleChange = async (uid: string, nextRole: UserRole) => {
    try {
      setUpdatingUserId(uid);
      setError(null);
      await updateUserRole(uid, nextRole);
      setUsers((prev) => prev.map((user) => (user.uid === uid ? { ...user, role: nextRole } : user)));
    } catch (err) {
      console.error(err);
      setError('Unable to update user role.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <p className="text-sm text-slate-400">Manage access</p>
          <h1 className="text-3xl font-semibold text-white">User management</h1>
          <p className="text-slate-400 max-w-2xl">
            Review citizen, staff, and admin accounts. Promote frontline workers, ensure least-privilege roles, and audit who can manage reports.
          </p>
        </div>

        <Card className="bg-slate-950/40 border-white/5">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email"
                className="pl-10"
              />
            </div>
            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
              options={roleOptions.map(({ label, value }) => ({ label, value }))}
            />
            <div className="flex items-center text-sm text-slate-400">
              Showing <span className="text-white font-semibold mx-1">{filteredUsers.length}</span> of
              <span className="text-white font-semibold mx-1">{users.length}</span> profiles
            </div>
          </div>
        </Card>

        {error && (
          <Card className="p-3 border border-red-500/30 bg-red-500/5 text-sm text-red-200">{error}</Card>
        )}

        {loading ? (
          <Card className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
            <Loader2 className="animate-spin" size={18} /> Loading users…
          </Card>
        ) : !filteredUsers.length ? (
          <Card className="p-8 text-center text-slate-400">No users match this filter.</Card>
        ) : (
          <Card className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs uppercase tracking-[0.3em] text-slate-500 border-b border-white/5">
                  <th className="py-3 pr-4">Name</th>
                  <th className="py-3 pr-4">Email</th>
                  <th className="py-3 pr-4">Role</th>
                  <th className="py-3 pr-4">Reports</th>
                  <th className="py-3 pr-4">Karma</th>
                  <th className="py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map((user) => (
                  <tr key={user.uid} className="text-sm">
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-semibold">
                          {user.name ? user.name.slice(0, 2).toUpperCase() : user.email.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white font-semibold">{user.name || 'Unnamed user'}</p>
                          <p className="text-xs text-slate-500">{new Date(user.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 pr-4 text-slate-300">{user.email}</td>
                    <td className="py-4 pr-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-white/10 text-xs uppercase tracking-wide text-slate-200">
                        <ShieldCheck size={14} /> {user.role}
                      </span>
                    </td>
                    <td className="py-4 pr-4 text-slate-300">{user.reportsCount}</td>
                    <td className="py-4 pr-4 text-emerald-300 font-semibold">{user.karma}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        {(['citizen', 'staff', 'admin'] as UserRole[]).map((role) => (
                          <Button
                            key={role}
                            size="sm"
                            variant={user.role === role ? 'primary' : 'secondary'}
                            disabled={updatingUserId === user.uid || user.role === role}
                            onClick={() => handleRoleChange(user.uid, role)}
                            className={
                              user.role === role
                                ? 'bg-white/15 border border-white/20'
                                : 'bg-transparent border border-white/10 text-slate-300'
                            }
                          >
                            {updatingUserId === user.uid ? 'Saving…' : role}
                          </Button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

export default AdminUsers;
