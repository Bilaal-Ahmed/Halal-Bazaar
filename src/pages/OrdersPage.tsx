import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { apiRequest } from '../lib/api';
import { Order } from '../types';
import { Package, ArrowLeft, Truck, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

export default function OrdersPage() {
  const { orderId } = useParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    const request = orderId
      ? apiRequest<{ order: Order }>(`/api/orders/${encodeURIComponent(orderId)}`).then(result => {
        if (!cancelled) setSelectedOrder(result.order);
      })
      : apiRequest<{ orders: Order[] }>('/api/orders').then(result => {
        if (!cancelled) setOrders(result.orders);
      });

    request.catch(cause => {
      if (cancelled) return;
      const message = cause instanceof Error ? cause.message : 'Could not load orders.';
      setError(message);
      toast.error(message);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [orderId]);

  if (loading) return <div className="min-h-[50vh] flex items-center justify-center text-muted-foreground">Loading orders…</div>;

  if (error) return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
      <Link className="mt-4 inline-flex items-center gap-2 text-primary" to="/profile"><ArrowLeft className="w-4 h-4" /> Back to profile</Link>
    </div>
  );

  const orderCard = (order: Order, detailed = false) => (
    <Card key={order.id} className="border-gray-100 shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
        <div>
          <CardTitle className="text-lg">Order {order.id}</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString() : 'Order date unavailable'}
          </p>
        </div>
        {!detailed && <Link to={`/orders/${encodeURIComponent(order.id)}`}><Button variant="outline" size="sm">View details</Button></Link>}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <p><span className="font-semibold">Fulfillment:</span> <span className="capitalize">{order.status}</span></p>
          <p><span className="font-semibold">Payment:</span> <span className="capitalize">{order.paymentStatus?.replaceAll('_', ' ')}</span></p>
          <p><span className="font-semibold">Total:</span> {order.currency} {Number(order.totalAmount).toFixed(2)}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="flex items-center gap-2 font-semibold text-sm"><Package className="w-4 h-4" /> Items</p>
          <ul className="mt-2 space-y-1 text-sm">
            {order.items?.map((line, index) => (
              <li key={`${line.product.id}-${index}`} className="flex justify-between gap-2">
                <span>{line.product.name} × {line.quantity}</span>
                <span>{order.currency} {Number(line.lineTotal || line.product.price * line.quantity).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
        {detailed && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="rounded-xl border p-3">
                <h3 className="font-semibold flex items-center gap-2"><Truck className="w-4 h-4" /> Delivery address</h3>
                <p className="mt-2 text-muted-foreground">{order.shippingAddress?.name}<br />{order.shippingAddress?.address}<br />{order.shippingAddress?.city}, {order.shippingAddress?.zip}<br />{order.shippingAddress?.country}</p>
              </div>
              <div className="rounded-xl border p-3">
                <h3 className="font-semibold flex items-center gap-2"><CreditCard className="w-4 h-4" /> Payment information</h3>
                <p className="mt-2 text-muted-foreground capitalize">{order.paymentMethod?.replaceAll('_', ' ')}<br />Payment status: {order.paymentStatus?.replaceAll('_', ' ')}</p>
                {order.transferReference && <p className="mt-1 text-muted-foreground">Transfer reference: {order.transferReference}</p>}
              </div>
            </div>
            <div className="rounded-xl border p-3 text-sm">
              <h3 className="font-semibold">Seller fulfillment tracking</h3>
              {Object.entries(order.fulfillmentBySeller || {}).length === 0 ? (
                <p className="mt-1 text-muted-foreground">Your order is awaiting seller processing.</p>
              ) : Object.entries(order.fulfillmentBySeller || {}).map(([sellerId, fulfillment]) => (
                <p key={sellerId} className="mt-1 text-muted-foreground">Seller {sellerId}: <span className="capitalize">{fulfillment.status}</span></p>
              ))}
            </div>
          </>
        )}
        <div className="flex justify-between border-t pt-3 text-sm">
          <span>Subtotal {order.currency} {Number(order.subtotal).toFixed(2)} + tax {order.currency} {Number(order.taxAmount).toFixed(2)}</span>
          <strong>{order.currency} {Number(order.totalAmount).toFixed(2)}</strong>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div><h1 className="text-3xl font-black">{orderId ? 'Order details' : 'My orders'}</h1><p className="text-muted-foreground mt-1">View payment status and seller fulfillment updates.</p></div>
        <Link to="/profile"><Button variant="outline" className="gap-2"><ArrowLeft className="w-4 h-4" /> Profile</Button></Link>
      </div>
      {orderId ? selectedOrder ? orderCard(selectedOrder, true) : <p>Order not found.</p> :
        orders.length ? <div className="space-y-4">{orders.map(order => orderCard(order))} </div> :
          <Card><CardContent className="py-14 text-center text-muted-foreground">You have not placed any orders yet. Browse products to get started.</CardContent></Card>}
    </div>
  );
}
