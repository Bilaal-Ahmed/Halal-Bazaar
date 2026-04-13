import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, query, where, deleteDoc, doc } from 'firebase/firestore';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import { Plus, Package, DollarSign, TrendingUp, Trash2, ShieldCheck, Store, BarChart3 } from 'lucide-react';
import { Product, CATEGORIES } from '../types';
import { motion, AnimatePresence } from 'motion/react';

export default function SellerDashboard() {
  const { user, profile } = useAuth();
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    stock: '',
    category: 'food',
    isHalalCertified: true,
  });

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'products'), where('sellerId', '==', user.uid));
    const unsub = onSnapshot(q, snap => {
      setMyProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
    });
    return () => unsub();
  }, [user]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'products'), {
        ...formData,
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
        stock: parseInt(formData.stock),
        sellerId: user.uid,
        sellerName: profile?.displayName || '',
        images: [],
        rating: 0,
        numReviews: 0,
        createdAt: serverTimestamp(),
      });
      toast.success('Product listed successfully!');
      setIsAdding(false);
      setFormData({ name: '', description: '', price: '', originalPrice: '', stock: '', category: 'food', isHalalCertified: true });
    } catch (err) {
      toast.error('Failed to add product. Check your permissions.');
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

  if (profile?.role !== 'seller') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <Store className="w-16 h-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-black mb-2">Seller Access Required</h1>
        <p className="text-muted-foreground max-w-sm">You need a seller account to access this dashboard. Contact admin to upgrade your account.</p>
      </div>
    );
  }

  const totalRevenue = myProducts.reduce((sum, p) => sum + (p.price * (p.numReviews || 0)), 0);

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
          onClick={() => setIsAdding(!isAdding)}
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
          { title: 'Total Sales', value: `$${totalRevenue.toFixed(0)}`, icon: <DollarSign className="w-5 h-5" />, color: 'bg-green-50 text-green-600' },
          { title: 'Avg Rating', value: myProducts.length ? (myProducts.reduce((s, p) => s + p.rating, 0) / myProducts.length).toFixed(1) : '—', icon: <TrendingUp className="w-5 h-5" />, color: 'bg-purple-50 text-purple-600' },
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
                  <Plus className="w-5 h-5 text-primary" /> New Product Listing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form id="add-product-form" onSubmit={handleAddProduct} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    id="product-name-input"
                    placeholder="Product Name *"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="sm:col-span-2"
                    required
                  />
                  <textarea
                    placeholder="Product Description"
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
                    {submitting ? 'Publishing…' : 'Publish Listing'}
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
                        <span className={product.stock > 0 ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {product.isHalalCertified && (
                          <span className="halal-badge text-[9px]"><ShieldCheck className="w-3 h-3" /> Halal</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
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
    </div>
  );
}
