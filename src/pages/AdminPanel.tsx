import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { apiRequest } from '../lib/api';
import { toast } from 'sonner';
import { RefreshCw, ShieldCheck, Store, Users, Package, ClipboardList, CreditCard } from 'lucide-react';

type AdminRecord = Record<string, any> & { id: string };
interface AdminData {
  users: AdminRecord[];
  applications: AdminRecord[];
  products: AdminRecord[];
  orders: AdminRecord[];
  paymentReviews: AdminRecord[];
}

type AdminTab = 'applications' | 'users' | 'products' | 'orders' | 'payments';

const emptyData: AdminData = { users: [], applications: [], products: [], orders: [], paymentReviews: [] };

export default function AdminPanel() {
  const [data, setData] = useState<AdminData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<AdminTab>('applications');
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [busyId, setBusyId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await apiRequest<AdminData>('/api/admin/data'));
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Could not load admin data.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filteredUsers = useMemo(() => data.users.filter(user => {
    const value = `${user.displayName || ''} ${user.email || ''} ${user.role || ''}`.toLowerCase();
    return value.includes(filter.toLowerCase()) && (statusFilter === 'all' || user.status === statusFilter);
  }), [data.users, filter, statusFilter]);

  const filteredApplications = useMemo(() => data.applications.filter(application => {
    return `${application.storeName || ''} ${application.email || ''} ${application.status || ''}`.toLowerCase().includes(filter.toLowerCase())
      && (statusFilter === 'all' || application.status === statusFilter);
  }), [data.applications, filter, statusFilter]);

  const filteredProducts = useMemo(() => data.products.filter(product => {
    return `${product.name || ''} ${product.sellerName || ''} ${product.category || ''}`.toLowerCase().includes(filter.toLowerCase())
      && (statusFilter === 'all' || (statusFilter === 'published' ? product.published === true : product.published !== true));
  }), [data.products, filter, statusFilter]);

  const filteredOrders = useMemo(() => data.orders.filter(order => {
    return `${order.id} ${order.buyerEmail || ''} ${order.status || ''} ${order.paymentStatus || ''}`.toLowerCase().includes(filter.toLowerCase())
      && (statusFilter === 'all' || order.paymentStatus === statusFilter || order.status === statusFilter);
  }), [data.orders, filter, statusFilter]);

  const decideApplication = async (uid: string, decision: 'approved' | 'rejected') => {
    let reason = '';
    if (decision === 'rejected') {
      const input = window.prompt('Provide a reason for rejection:');
      if (input === null) return;
      reason = input.trim();
      if (!reason) {
        toast.error('A rejection reason is required.');
        return;
      }
    }
    setBusyId(uid);
    try {
      await apiRequest(`/api/admin/seller-applications/${encodeURIComponent(uid)}/decision`, {
        method: 'POST',
        body: JSON.stringify({ decision, reason }),
      });
      toast.success(`Seller application ${decision}.`);
      await load();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Could not update application.');
    } finally {
      setBusyId('');
    }
  };

  const setAccountStatus = async (uid: string, status: 'approved' | 'suspended' | 'restricted') => {
    setBusyId(uid);
    try {
      await apiRequest(`/api/admin/users/${encodeURIComponent(uid)}/status`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      });
      toast.success(`Account status set to ${status}.`);
      await load();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Could not update account status.');
    } finally {
      setBusyId('');
    }
  };

  const setProductPublished = async (id: string, published: boolean) => {
    setBusyId(id);
    try {
      await apiRequest(`/api/admin/products/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ published }),
      });
      toast.success(published ? 'Listing published.' : 'Listing unpublished.');
      await load();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Could not update listing.');
    } finally {
      setBusyId('');
    }
  };

  const reviewPayment = async (id: string, decision: 'approve_transfer' | 'reject_transfer' | 'cash_received') => {
    setBusyId(id);
    try {
      await apiRequest(`/api/admin/orders/${encodeURIComponent(id)}/payment-review`, {
        method: 'POST',
        body: JSON.stringify({ decision }),
      });
      toast.success('Payment review saved.');
      await load();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Could not review payment.');
    } finally {
      setBusyId('');
    }
  };

  const tabs: Array<{ id: AdminTab; label: string; icon: React.ReactNode; count: number }> = [
    { id: 'applications', label: 'Seller applications', icon: <Store className="w-4 h-4" />, count: data.applications.filter(item => item.status === 'pending').length },
    { id: 'users', label: 'Users', icon: <Users className="w-4 h-4" />, count: data.users.length },
    { id: 'products', label: 'Listings', icon: <Package className="w-4 h-4" />, count: data.products.length },
    { id: 'orders', label: 'Orders', icon: <ClipboardList className="w-4 h-4" />, count: data.orders.length },
    { id: 'payments', label: 'Payments', icon: <CreditCard className="w-4 h-4" />, count: data.orders.filter(order => order.paymentStatus === 'pending_review' || order.paymentStatus === 'unpaid').length },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-2"><ShieldCheck className="w-7 h-7 text-primary" /> Admin Console</h1>
          <p className="text-muted-foreground mt-1">Manage onboarding, users, listings, orders, and manual payment reviews.</p>
        </div>
        <Button variant="outline" onClick={() => void load()} disabled={loading} className="gap-2 self-start">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {tabs.map(item => (
          <button key={item.id} onClick={() => { setTab(item.id); setStatusFilter('all'); }} className={`flex items-center justify-between rounded-xl border p-3 text-left ${tab === item.id ? 'border-primary bg-primary/5' : 'bg-white'}`}>
            <span className="flex items-center gap-2 text-sm font-semibold">{item.icon}{item.label}</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{item.count}</span>
          </button>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle>{tabs.find(item => item.id === tab)?.label}</CardTitle>
          <div className="flex w-full flex-col sm:w-auto sm:flex-row gap-2">
            <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)} className="h-9 rounded-md border bg-background px-3 text-sm">
              <option value="all">All statuses</option>
              {tab === 'applications' && <><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></>}
              {tab === 'users' && <><option value="approved">Active</option><option value="suspended">Suspended</option><option value="restricted">Restricted</option></>}
              {tab === 'products' && <><option value="published">Published</option><option value="hidden">Hidden</option></>}
              {(tab === 'orders' || tab === 'payments') && <><option value="pending">Order pending</option><option value="shipped">Shipped</option><option value="pending_review">Payment review</option><option value="unpaid">Unpaid</option><option value="paid">Paid</option><option value="rejected">Rejected</option></>}
            </select>
            <Input value={filter} onChange={event => setFilter(event.target.value)} placeholder="Filter current list…" className="sm:max-w-xs" />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? <p className="py-10 text-center text-muted-foreground">Loading admin records…</p> : null}
          {!loading && tab === 'applications' && (
            filteredApplications.length ? <div className="space-y-3">
              {filteredApplications.map(application => (
                <div key={application.id} className="rounded-xl border p-4">
                  <div className="flex flex-col md:flex-row md:justify-between gap-4">
                    <div>
                      <h3 className="font-bold">{application.storeName} <span className="text-xs font-normal text-muted-foreground">· {application.status}</span></h3>
                      <p className="text-sm text-muted-foreground">{application.email} · {application.contactPhone} · {application.city}</p>
                      <p className="mt-2 text-sm">{application.description}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{application.businessAddress}</p>
                      {application.reason && <p className="mt-2 text-sm text-red-700">Decision reason: {application.reason}</p>}
                    </div>
                    {application.status === 'pending' && <div className="flex gap-2 self-start">
                      <Button size="sm" disabled={busyId === application.id} onClick={() => void decideApplication(application.id, 'approved')}>Approve</Button>
                      <Button size="sm" variant="destructive" disabled={busyId === application.id} onClick={() => void decideApplication(application.id, 'rejected')}>Reject</Button>
                    </div>}
                  </div>
                </div>
              ))}
            </div> : <p className="py-10 text-center text-muted-foreground">No matching applications.</p>
          )}
          {!loading && tab === 'users' && (
            filteredUsers.length ? <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead><tr className="border-b text-left text-muted-foreground"><th className="p-2">User</th><th className="p-2">Role</th><th className="p-2">Status</th><th className="p-2">Action</th></tr></thead>
              <tbody>{filteredUsers.map(user => <tr key={user.id} className="border-b">
                <td className="p-2"><strong>{user.displayName || 'User'}</strong><div className="text-xs text-muted-foreground">{user.email}</div></td>
                <td className="p-2 capitalize">{user.role}</td>
                <td className="p-2 capitalize">{user.status}</td>
                <td className="p-2">{user.role !== 'admin' && <Button size="sm" variant={user.status === 'suspended' ? 'outline' : 'destructive'} disabled={busyId === user.id} onClick={() => void setAccountStatus(user.id, user.status === 'suspended' ? 'approved' : 'suspended')}>{user.status === 'suspended' ? 'Reactivate' : 'Suspend'}</Button>}</td>
              </tr>)}</tbody>
            </table></div> : <p className="py-10 text-center text-muted-foreground">No matching users.</p>
          )}
          {!loading && tab === 'products' && (
            filteredProducts.length ? <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead><tr className="border-b text-left text-muted-foreground"><th className="p-2">Product</th><th className="p-2">Seller</th><th className="p-2">Price / stock</th><th className="p-2">Visibility</th><th className="p-2">Action</th></tr></thead>
              <tbody>{filteredProducts.map(product => <tr key={product.id} className="border-b">
                <td className="p-2 font-semibold">{product.name}<div className="text-xs text-muted-foreground">{product.category}</div></td>
                <td className="p-2">{product.sellerName || product.sellerId}</td>
                <td className="p-2">{product.currency || ''} {product.price} · {product.stock} in stock</td>
                <td className="p-2">{product.published ? 'Published' : 'Hidden'}</td>
                <td className="p-2"><Button size="sm" variant="outline" disabled={busyId === product.id} onClick={() => void setProductPublished(product.id, !product.published)}>{product.published ? 'Unpublish' : 'Publish'}</Button></td>
              </tr>)}</tbody>
            </table></div> : <p className="py-10 text-center text-muted-foreground">No matching listings.</p>
          )}
          {!loading && (tab === 'orders' || tab === 'payments') && (
            filteredOrders.length ? <div className="space-y-3">
              {filteredOrders.filter(order => tab === 'orders' || ['pending_review', 'unpaid', 'rejected'].includes(order.paymentStatus)).map(order => (
                <div key={order.id} className="rounded-xl border p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                    <div>
                      <p className="font-bold">Order {order.id}</p>
                      <p className="text-sm text-muted-foreground">{order.buyerEmail} · {order.currency} {Number(order.totalAmount || 0).toFixed(2)}</p>
                      <p className="text-sm capitalize">Fulfillment: {order.status} · Payment: {String(order.paymentMethod).replaceAll('_', ' ')} / {String(order.paymentStatus).replaceAll('_', ' ')}</p>
                      {order.transferReference && <p className="text-xs text-muted-foreground">Transfer reference: {order.transferReference}</p>}
                      <p className="text-xs text-muted-foreground">{(order.items || []).map((line: any) => `${line.product?.name || line.name} × ${line.quantity}`).join(', ')}</p>
                    </div>
                    {tab === 'payments' && <div className="flex flex-wrap gap-2">
                      {order.paymentMethod === 'bank_transfer' && order.paymentStatus === 'pending_review' && <>
                        <Button size="sm" disabled={busyId === order.id} onClick={() => void reviewPayment(order.id, 'approve_transfer')}>Approve transfer</Button>
                        <Button size="sm" variant="destructive" disabled={busyId === order.id} onClick={() => void reviewPayment(order.id, 'reject_transfer')}>Reject transfer</Button>
                      </>}
                      {order.paymentMethod === 'cash_on_delivery' && order.paymentStatus === 'unpaid' &&
                        <Button size="sm" disabled={busyId === order.id} onClick={() => void reviewPayment(order.id, 'cash_received')}>Confirm cash received</Button>}
                      {order.paymentStatus === 'paid' && <span className="text-sm font-semibold text-green-700">Verified paid</span>}
                    </div>}
                  </div>
                </div>
              ))}
            </div> : <p className="py-10 text-center text-muted-foreground">No matching orders.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
