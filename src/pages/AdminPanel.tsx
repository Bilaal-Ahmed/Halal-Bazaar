import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { UserProfile } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import { Users, ShieldCheck, Store, User, CheckCircle, XCircle, Clock, BarChart3 } from 'lucide-react';

export default function AdminPanel() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filter, setFilter] = useState<'all' | 'buyer' | 'seller' | 'admin'>('all');

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const u = snapshot.docs.map(doc => doc.data() as UserProfile);
      setUsers(u);
    });
    return () => unsubscribe();
  }, []);

  const handleUpdateRole = async (uid: string, role: string) => {
    try {
      await updateDoc(doc(db, 'users', uid), { role });
      toast.success(`User role updated to ${role}`);
    } catch {
      toast.error('Failed to update role');
    }
  };

  const handleUpdateStatus = async (uid: string, status: string) => {
    try {
      await updateDoc(doc(db, 'users', uid), { status });
      toast.success(`User status updated to ${status}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const filteredUsers = filter === 'all' ? users : users.filter(u => u.role === filter);

  const stats = {
    total: users.length,
    buyers: users.filter(u => u.role === 'buyer').length,
    sellers: users.filter(u => u.role === 'seller').length,
    pending: users.filter(u => u.status === 'pending').length,
  };

  const statusColor = (status: string) => {
    if (status === 'approved') return 'bg-green-100 text-green-700';
    if (status === 'rejected') return 'bg-red-100 text-red-600';
    return 'bg-yellow-100 text-yellow-700';
  };

  const roleIcon = (role: string) => {
    if (role === 'admin') return <ShieldCheck className="w-3.5 h-3.5" />;
    if (role === 'seller') return <Store className="w-3.5 h-3.5" />;
    return <User className="w-3.5 h-3.5" />;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black">Admin Panel</h1>
        <p className="text-muted-foreground mt-1">Manage users, roles, and platform settings</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { title: 'Total Users', value: stats.total, icon: <Users className="w-5 h-5" />, color: 'bg-blue-50 text-blue-600' },
          { title: 'Buyers', value: stats.buyers, icon: <User className="w-5 h-5" />, color: 'bg-purple-50 text-purple-600' },
          { title: 'Sellers', value: stats.sellers, icon: <Store className="w-5 h-5" />, color: 'bg-green-50 text-green-600' },
          { title: 'Pending Review', value: stats.pending, icon: <Clock className="w-5 h-5" />, color: 'bg-yellow-50 text-yellow-600' },
        ].map(s => (
          <Card key={s.title} className="border-gray-100 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">{s.title}</CardTitle>
              <div className={`${s.color} p-2 rounded-xl`}>{s.icon}</div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* User Table */}
      <Card className="border-gray-100 shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" /> User Management
          </CardTitle>
          {/* Filter tabs */}
          <div className="flex gap-2">
            {(['all', 'buyer', 'seller', 'admin'] as const).map(role => (
              <button
                key={role}
                onClick={() => setFilter(role)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                  filter === role ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">User</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Role</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredUsers.map(user => (
                    <tr key={user.uid} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                            {user.displayName?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <div className="font-semibold">{user.displayName}</div>
                            <div className="text-xs text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={user.role}
                          onChange={e => handleUpdateRole(user.uid, e.target.value)}
                          className="text-xs font-semibold border border-gray-200 rounded-lg px-2 py-1 bg-white capitalize cursor-pointer hover:border-primary/50 transition-colors"
                        >
                          <option value="buyer">Buyer</option>
                          <option value="seller">Seller</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${statusColor(user.status)}`}>
                          {user.status === 'approved' && <CheckCircle className="w-3 h-3" />}
                          {user.status === 'rejected' && <XCircle className="w-3 h-3" />}
                          {user.status === 'pending' && <Clock className="w-3 h-3" />}
                          {user.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          {user.status !== 'approved' && (
                            <Button
                              id={`approve-${user.uid}`}
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs text-green-600 border-green-200 hover:bg-green-50"
                              onClick={() => handleUpdateStatus(user.uid, 'approved')}
                            >
                              Approve
                            </Button>
                          )}
                          {user.status !== 'rejected' && (
                            <Button
                              id={`reject-${user.uid}`}
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs text-red-500 border-red-200 hover:bg-red-50"
                              onClick={() => handleUpdateStatus(user.uid, 'rejected')}
                            >
                              Reject
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
