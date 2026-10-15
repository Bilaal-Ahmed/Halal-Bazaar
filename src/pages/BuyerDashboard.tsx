import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ClipboardList, MapPin, Package, ShoppingBag, Store, UserRound } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest } from '../lib/api';
import { Order } from '../types';
import { formatCurrency } from '../lib/currency';

export default function BuyerDashboard() {
  const { user, profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState('');

  useEffect(() => {
    let active = true;
    apiRequest<{ orders: Order[] }>('/api/orders')
      .then(result => {
        if (active) setOrders(result.orders);
      })
      .catch(error => {
        if (active) setOrdersError(error instanceof Error ? error.message : 'Order history is unavailable.');
      })
      .finally(() => {
        if (active) setLoadingOrders(false);
      });
    return () => { active = false; };
  }, []);

  const outstandingPayments = orders.filter(order =>
    order.paymentStatus === 'pending_review'
    || order.paymentStatus === 'unpaid'
    || order.paymentStatus === 'rejected',
  ).length;
  const quickLinks = [
    { title: 'Browse products', description: 'Discover current marketplace listings.', href: '/products', icon: ShoppingBag },
    { title: 'Order history', description: 'Review purchases and delivery updates.', href: '/orders', icon: ClipboardList },
    { title: 'Profile & addresses', description: 'Update your account and saved addresses.', href: '/profile', icon: UserRound },
    ...(profile?.role === 'seller' && profile.status === 'approved'
      ? [{ title: 'Seller workspace', description: 'Manage your store separately from shopping.', href: '/seller', icon: Store }]
      : [{ title: 'Sell on Halal-Bazaar', description: 'Apply to create a seller store.', href: '/profile', icon: Store }]),
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="font-semibold text-primary">Buyer area</p>
          <h1 className="mt-1 text-3xl font-black">Welcome{profile?.displayName ? `, ${profile.displayName}` : ''}</h1>
          <p className="mt-2 text-muted-foreground">Your shopping, orders, and delivery details are in one place.</p>
          {profile?.role === 'seller' && <p className="mt-2 text-sm text-muted-foreground">This account can shop as a buyer and manage its approved seller store.</p>}
        </div>
        <Link to="/products"><Button className="gap-2">Continue shopping <ArrowRight className="h-4 w-4" /></Button></Link>
      </header>

      {profile?.status !== 'approved' && (
        <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Your account is {profile?.status || 'not active'}. Browsing is available, but checkout and protected operations require an active account.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm text-muted-foreground"><Package className="h-4 w-4" /> Orders</CardTitle></CardHeader><CardContent className="text-3xl font-black">{loadingOrders ? '…' : orders.length}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm text-muted-foreground"><ClipboardList className="h-4 w-4" /> Payment follow-up</CardTitle></CardHeader><CardContent className="text-3xl font-black">{loadingOrders ? '…' : outstandingPayments}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4" /> Saved addresses</CardTitle></CardHeader><CardContent className="text-3xl font-black">{profile?.addresses?.length || 0}</CardContent></Card>
      </div>

      <section>
        <h2 className="mb-4 text-xl font-bold">Your marketplace</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map(({ title, description, href, icon: Icon }) => (
            <Link key={title} to={href} className="group">
              <Card className="h-full transition-shadow group-hover:shadow-md">
                <CardContent className="flex h-full flex-col items-start p-5">
                  <Icon className="mb-4 h-6 w-6 text-primary" />
                  <h3 className="font-bold">{title}</h3>
                  <p className="mt-1 flex-1 text-sm text-muted-foreground">{description}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">Open <ArrowRight className="h-4 w-4" /></span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold">Recent orders</h2>
          <Link className="text-sm font-semibold text-primary hover:underline" to="/orders">View all</Link>
        </div>
        {ordersError ? (
          <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{ordersError}</div>
        ) : loadingOrders ? (
          <p className="py-6 text-center text-muted-foreground">Loading your orders…</p>
        ) : orders.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-muted-foreground">No orders yet. Your order updates will appear here.</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {orders.slice(0, 5).map(order => (
              <Card key={order.id}>
                <CardContent className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center">
                  <div>
                    <p className="font-semibold">Order {order.id.slice(0, 12)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{order.items?.length || 0} item(s) · {order.status} · payment {order.paymentStatus?.replaceAll('_', ' ')}</p>
                    {order.sellerPayments && Object.entries(order.sellerPayments).map(([sellerId, payment]) => (
                      <p key={sellerId} className="mt-1 text-xs text-muted-foreground">
                        Seller payment: {formatCurrency(Number(payment.amount), order.currency)} · {payment.status.replaceAll('_', ' ')}
                      </p>
                    ))}
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <strong>{formatCurrency(Number(order.totalAmount), order.currency)}</strong>
                    <Link to={`/orders/${encodeURIComponent(order.id)}`}><Button variant="outline" size="sm">Details</Button></Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <p className="text-xs text-muted-foreground">Signed in as {user?.email || 'your account'}.</p>
    </div>
  );
}
