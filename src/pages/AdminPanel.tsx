import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { UserProfile } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';

export default function AdminPanel() {
  const [users, setUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const u = snapshot.docs.map(doc => doc.data() as UserProfile);
      setUsers(u);
    });
    return () => unsubscribe();
  }, []);

  const handleUpdateStatus = async (uid: string, status: string) => {
    try {
      await updateDoc(doc(db, 'users', uid), { status });
      toast.success(`User status updated to ${status}`);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-3xl font-bold">Admin Management</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="py-4">User</th>
                  <th className="py-4">Role</th>
                  <th className="py-4">Status</th>
                  <th className="py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.uid} className="border-b last:border-0">
                    <td className="py-4">
                      <div>
                        <div className="font-medium">{user.displayName}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </div>
                    </td>
                    <td className="py-4">
                      <Badge variant="outline">{user.role}</Badge>
                    </td>
                    <td className="py-4">
                      <Badge className={user.status === 'approved' ? 'bg-green-500' : 'bg-yellow-500'}>
                        {user.status}
                      </Badge>
                    </td>
                    <td className="py-4 space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(user.uid, 'approved')}>Approve</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleUpdateStatus(user.uid, 'rejected')}>Reject</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
