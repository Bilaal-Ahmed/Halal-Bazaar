import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, query, where, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import { Plus, Package, DollarSign, TrendingUp, Trash2, ShieldCheck, Store, BarChart3 } from 'lucide-react';
import { Product, CATEGORIES } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { apiRequest } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../lib/currency';

export default function SellerDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [sellerOrders, setSellerOrders] = useState<Array<Record<string, any> & { id: string }>>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [storeSaving, setStoreSaving] = useState(false);
  const [store, setStore] = useState({
    storeName: profile?.storeName || '',
    description: profile?.storeDescription || '',
    contactPhone: profile?.sellerContactPhone || '',
    businessAddress: profile?.businessAddress || '',
    city: profile?.businessCity || '',
  });
  const [isAdding, setIsAdding] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    stock: '',
    category: 'food',
    isHalalCertified: true,
    imageURL: '',
  });

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'products'), where('sellerId', '==', user.uid));
    const unsub = onSnapshot(q, snap => {
      setMyProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
    }, error => {
      console.error('Could not load seller products:', error);
      toast.error('Could not load your product listings.');
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!profile) return;
    setStore({
      storeName: profile.storeName || '',
      description: profile.storeDescription || '',
      contactPhone: profile.sellerContactPhone || '',
      businessAddress: profile.businessAddress || '',
      city: profile.businessCity || '',
    });
  }, [profile]);

  const loadSellerOrders = async () => {
    setOrdersLoading(true);
    try {
      const result = await apiRequest<{ orders: Array<Record<string, any> & { id: string }> }>('/api/seller/orders');
      setSellerOrders(result.orders);
    } catch (error) {
      console.error('Could not load seller orders:', error);
      toast.error(error instanceof Error ? error.message : 'Could not load seller orders.');
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.role === 'seller' && profile.status === 'approved') void loadSellerOrders();
  }, [profile?.role, profile?.status]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || profile?.role !== 'seller' || profile.status !== 'approved') return;
    const name = formData.name.trim();
    const description = formData.description.trim();
    const price = Number(formData.price);
    const stock = Number(formData.stock);
    const originalPrice = formData.originalPrice ? Number(formData.originalPrice) : undefined;
    const imageURL = formData.imageURL.trim();
    if (!name || name.length > 120 || !description || description.length > 5000
      || !Number.isFinite(price) || price <= 0 || !Number.isSafeInteger(stock) || stock < 0
      || (originalPrice !== undefined && (!Number.isFinite(originalPrice) || originalPrice < price))) {
      toast.error('Enter a name, description, positive price, valid stock count, and valid original price.');
      return;
    }
    let validImageURL = true;
    if (imageURL) {
      try {
        validImageURL = new URL(imageURL).protocol === 'https:' && imageURL.length <= 2048;
      } catch {
        validImageURL = false;
      }
    }
    if (!validImageURL) {
      toast.error('Product images must use a valid HTTPS URL.');
      return;
    }
    setSubmitting(true);
    try {
      const productData = {
        name,
        description,
        price,
        originalPrice: originalPrice ?? null,
        stock,
        category: formData.category,
        isHalalCertified: formData.isHalalCertified,
        images: imageURL ? [imageURL] : [],
      };
      if (editingProductId) {
        await updateDoc(doc(db, 'products', editingProductId), productData);
        toast.success('Product updated.');
      } else {
        await addDoc(collection(db, 'products'), {
          ...productData,
          sellerId: user.uid,
          sellerName: profile.storeName || profile.displayName || '',
          rating: 0,
          numReviews: 0,
          published: true,
          createdAt: serverTimestamp(),
        });
        toast.success('Product listed successfully!');
      }
      setIsAdding(false);
      setEditingProductId(null);
      setFormData({ name: '', description: '', price: '', originalPrice: '', stock: '', category: 'food', isHalalCertified: true, imageURL: '' });
    } catch (error) {
      console.error('Product listing save failed:', error);
      toast.error(error instanceof Error ? error.message : 'Could not save this product listing.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (productId: string) => {
    try {
      await deleteDoc(doc(db, 'products', productId));
      toast.success('Product removed');
    } catch {
      toast.error('Failed to remove product');
    }
  };

  const startEditingProduct = (product: Product) => {
    setEditingProductId(product.id);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: String(product.price),
      originalPrice: product.originalPrice ? String(product.originalPrice) : '',
      stock: String(product.stock),
      category: product.category,
      isHalalCertified: Boolean(product.isHalalCertified),
      imageURL: product.images?.[0] || '',
    });
    setIsAdding(true);
  };

  const cancelProductForm = () => {
    setIsAdding(false);
    setEditingProductId(null);
    setFormData({ name: '', description: '', price: '', originalPrice: '', stock: '', category: 'food', isHalalCertified: true, imageURL: '' });
  };

  const saveStoreProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStoreSaving(true);
    try {
      await apiRequest('/api/seller/store', {
        method: 'PUT',
        body: JSON.stringify(store),
      });
      toast.success('Store profile saved.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save store profile.');
    } finally {
      setStoreSaving(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await apiRequest(`/api/seller/orders/${encodeURIComponent(orderId)}/fulfillment`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      toast.success('Order fulfillment updated.');
      await loadSellerOrders();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update fulfillment.');
    }
  };

  const saveInventory = async (product: Product, input: string) => {
    const stock = Number(input);
    if (!Number.isSafeInteger(stock) || stock < 0) {
      toast.error('Stock must be a whole number of zero or more.');
      return;
    }
    try {
      await updateDoc(doc(db, 'products', product.id), { stock });
      toast.success('Inventory updated.');
    } catch (error) {
      console.error('Inventory update failed:', error);
      toast.error('Could not update inventory.');
    }
  };

  const setProductPublished = async (product: Product) => {
    try {
      const published = product.published !== true;
      await updateDoc(doc(db, 'products', product.id), { published });
      toast.success(published ? 'Listing published.' : 'Listing hidden.');
    } catch (error) {
      console.error('Listing update failed:', error);
      toast.error('Could not update listing visibility.');
    }
  };

  if (profile?.role !== 'seller' || profile.status !== 'approved') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <Store className="w-16 h-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-black mb-2">Approved Seller Access Required</h1>
        <p className="text-muted-foreground max-w-sm">Seller tools are available only after an administrator approves your seller application.</p>
        <Button className="mt-4" onClick={() => navigate('/profile')}>Open profile and apply</Button>
      </div>
    );
  }

  const grossOrderValue = sellerOrders.reduce((sum, order) => sum + (order.items || []).reduce((lineSum: number, line: any) =>
    line.product?.sellerId === user?.uid ? lineSum + Number(line.lineTotal ?? Number(line.product?.price || 0) * Number(line.quantity || 0)) : lineSum, 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black">Seller Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, <span className="font-semibold text-foreground">{profile.displayName}</span>
          </p>
        </div>
        <Button
          id="add-product-btn"
          onClick={() => isAdding ? cancelProductForm() : setIsAdding(true)}
          className={`gap-2 btn-primary-glow font-bold ${isAdding ? 'bg-red-500 hover:bg-red-600' : ''}`}
        >
          <Plus className="w-4 h-4" />
          {isAdding ? 'Cancel' : 'Add New Product'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[
          { title: 'My Products', value: myProducts.length, icon: <Package className="w-5 h-5" />, color: 'bg-blue-50 text-blue-600' },
          { title: 'Gross order value', value: formatCurrency(grossOrderValue), icon: <DollarSign className="w-5 h-5" />, color: 'bg-green-50 text-green-600' },
          { title: 'Awaiting fulfillment', value: sellerOrders.filter(order => order.fulfillmentStatus !== 'delivered').length, icon: <TrendingUp className="w-5 h-5" />, color: 'bg-purple-50 text-purple-600' },
        ].map(stat => (
          <Card key={stat.title} className="border-gray-100 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <div className={`${stat.color} p-2 rounded-xl`}>{stat.icon}</div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-gray-100 shadow-sm">
        <CardHeader><CardTitle className="flex items-center gap-2"><Store className="w-5 h-5 text-primary" /> Store profile</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={saveStoreProfile} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input required maxLength={100} placeholder="Store name" value={store.storeName} onChange={event => setStore({ ...store, storeName: event.target.value })} />
            <Input maxLength={40} placeholder="Contact phone" value={store.contactPhone} onChange={event => setStore({ ...store, contactPhone: event.target.value })} />
            <Input maxLength={300} placeholder="Business address" value={store.businessAddress} onChange={event => setStore({ ...store, businessAddress: event.target.value })} />
            <Input maxLength={100} placeholder="Business city" value={store.city} onChange={event => setStore({ ...store, city: event.target.value })} />
            <textarea maxLength={2000} required placeholder="Store description" value={store.description} onChange={event => setStore({ ...store, description: event.target.value })} className="md:col-span-2 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" rows={3} />
            <Button type="submit" disabled={storeSaving} className="md:col-span-2">{storeSaving ? 'Saving…' : 'Save store profile'}</Button>
          </form>
        </CardContent>
      </Card>

      {/* Add Product Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -20, height: 0 }}
          >
            <Card className="border-primary/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" /> {editingProductId ? 'Edit Product Listing' : 'New Product Listing'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form id="add-product-form" onSubmit={handleAddProduct} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    id="product-name-input"
                    placeholder="Product Name *"
                    maxLength={120}
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="sm:col-span-2"
                    required
                  />
                  <textarea
                    placeholder="Product Description"
                    required
                    maxLength={5000}
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="sm:col-span-2 flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                  />

                  {/* Category */}
                  <div className="sm:col-span-2">
                    <label className="text-sm font-semibold mb-2 block">Category</label>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.map(cat => (
                        <button
                          type="button"
                          key={cat.slug}
                          onClick={() => setFormData({ ...formData, category: cat.slug })}
                          className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${
                            formData.category === cat.slug
                              ? 'bg-primary text-white border-primary'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-primary/50'
                          }`}
                        >
                          {cat.icon} {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Input id="product-price-input" type="number" step="0.01" placeholder="Price ($) *" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} required />
                  <Input id="product-original-price-input" type="number" step="0.01" placeholder="Original Price (optional – for discount)" value={formData.originalPrice} onChange={e => setFormData({ ...formData, originalPrice: e.target.value })} />
                  <Input id="product-stock-input" type="number" placeholder="Stock Quantity *" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} required />
                  <Input id="product-image-url-input" type="url" placeholder="Product image HTTPS URL (optional)" value={formData.imageURL} onChange={e => setFormData({ ...formData, imageURL: e.target.value })} className="sm:col-span-2" />

                  <div className="flex items-center gap-3 sm:col-span-2">
                    <input
                      type="checkbox"
                      id="halal-certified-check"
                      checked={formData.isHalalCertified}
                      onChange={e => setFormData({ ...formData, isHalalCertified: e.target.checked })}
                      className="w-4 h-4 accent-primary"
                    />
                    <label htmlFor="halal-certified-check" className="text-sm flex items-center gap-2 font-medium cursor-pointer">
                      <ShieldCheck className="w-4 h-4 text-primary" />
                      This product is Halal Certified
                    </label>
                  </div>

                  <Button
                    id="submit-product-btn"
                    type="submit"
                    className="sm:col-span-2 btn-primary-glow font-bold h-11"
                    disabled={submitting}
                  >
                    {submitting ? (editingProductId ? 'Saving…' : 'Publishing…') : (editingProductId ? 'Save Changes' : 'Publish Listing')}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Products Table */}
      <Card className="border-gray-100 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" /> My Listings
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {myProducts.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-semibold">No products listed yet</p>
              <p className="text-sm mt-1">Click "Add New Product" to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Product</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Category</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Price</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Stock</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Status</th>
                    <th className="py-3 px-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {myProducts.map(product => (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-medium">{product.name}</td>
                      <td className="py-3 px-4 capitalize text-muted-foreground">{product.category}</td>
                      <td className="py-3 px-4 font-bold">${product.price.toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          defaultValue={product.stock}
                          aria-label={`Stock for ${product.name}`}
                          className="w-24"
                          onBlur={event => {
                            if (Number(event.target.value) !== product.stock) void saveInventory(product, event.target.value);
                          }}
                        />
                      </td>
                      <td className="py-3 px-4">
                        {product.isHalalCertified && (
                          <span className="halal-badge text-[9px]"><ShieldCheck className="w-3 h-3" /> Halal</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Button size="sm" variant="outline" className="mr-2" onClick={() => startEditingProduct(product)}>Edit</Button>
                        <Button size="sm" variant="outline" className="mr-2" onClick={() => void setProductPublished(product)}>
                          {product.published === true ? 'Unpublish' : 'Publish'}
                        </Button>
                        <button onClick={() => handleDelete(product.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-gray-100 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Package className="w-5 h-5 text-primary" /> Seller orders</CardTitle>
          <Button variant="outline" size="sm" onClick={() => void loadSellerOrders()} disabled={ordersLoading}>{ordersLoading ? 'Loading…' : 'Refresh'}</Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {ordersLoading ? <p className="text-center py-6 text-muted-foreground">Loading orders…</p> : null}
          {!ordersLoading && sellerOrders.length === 0 ? <p className="text-center py-6 text-muted-foreground">No orders for your store yet.</p> : null}
          {sellerOrders.map(order => {
            const fulfillment = order.fulfillmentStatus || 'pending';
            const nextStatus: Record<string, string> = { pending: 'processing', processing: 'shipped', shipped: 'delivered' };
            const lines = (order.items || []).filter((line: any) => line.product?.sellerId === user?.uid);
            return <div key={order.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-xl border p-4">
              <div>
                <p className="font-bold">Order {order.id}</p>
                <p className="text-sm text-muted-foreground">{lines.map((line: any) => `${line.product?.name} × ${line.quantity}`).join(', ')}</p>
                <p className="text-sm capitalize">Your fulfillment: {fulfillment} · Payment: {order.paymentStatus}</p>
                <p className="text-xs text-muted-foreground">{order.shippingAddress?.name} · {order.shippingAddress?.address}, {order.shippingAddress?.city}, {order.shippingAddress?.zip}, {order.shippingAddress?.country}</p>
              </div>
              {nextStatus[fulfillment] && <Button size="sm" onClick={() => void updateOrderStatus(order.id, nextStatus[fulfillment])}>Mark {nextStatus[fulfillment]}</Button>}
            </div>;
          })}
        </CardContent>
      </Card>
    </div>
  );
}
