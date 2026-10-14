import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Product } from '../types';
import { useCart } from '../contexts/CartContext';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { ArrowLeft, ShieldCheck, ShoppingCart, Store } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '../lib/currency';

export default function ProductDetails() {
  const { productId = '' } = useParams();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(doc(db, 'products', productId), snapshot => {
      if (!snapshot.exists() || snapshot.data().published !== true) {
        setProduct(null);
        setUnavailable(true);
      } else {
        setProduct({ id: snapshot.id, rating: 0, numReviews: 0, ...snapshot.data() } as Product);
        setUnavailable(false);
      }
      setLoading(false);
    }, error => {
      console.error('Product details load failed:', error);
      setUnavailable(true);
      setLoading(false);
      toast.error('Could not load this product.');
    });
    return () => unsubscribe();
  }, [productId]);

  if (loading) return <div className="min-h-[50vh] flex items-center justify-center text-muted-foreground">Loading product…</div>;
  if (unavailable || !product) {
    return <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">Product unavailable</h1>
      <p className="mt-2 text-muted-foreground">This listing may have been unpublished or removed.</p>
      <Link to="/products"><Button className="mt-5">Browse products</Button></Link>
    </div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <Link to="/products" className="inline-flex items-center gap-2 text-sm text-primary mb-6"><ArrowLeft className="w-4 h-4" /> Back to products</Link>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 rounded-2xl bg-white p-5 md:p-8 shadow-sm border">
        <div className="aspect-square rounded-xl overflow-hidden bg-slate-50">
          <img src={product.images?.[0] || `https://picsum.photos/seed/${encodeURIComponent(product.id)}/800/800`} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </div>
        <div className="flex flex-col">
          <Badge variant="secondary" className="self-start capitalize">{product.category}</Badge>
          <h1 className="mt-4 text-3xl font-black">{product.name}</h1>
          <p className="mt-4 text-muted-foreground leading-relaxed whitespace-pre-wrap">{product.description}</p>
          {product.isHalalCertified && <p className="mt-4 inline-flex items-center gap-2 text-sm text-green-700"><ShieldCheck className="w-4 h-4" /> Seller marked this listing as halal certified</p>}
          <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground"><Store className="w-4 h-4" /> Sold by {product.sellerName || 'Marketplace seller'}</div>
          <div className="mt-6 text-3xl font-black">{formatCurrency(Number(product.price))}</div>
          <p className={`mt-2 text-sm font-semibold ${product.stock > 0 ? 'text-green-700' : 'text-red-600'}`}>
            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
          </p>
          <Button className="mt-6 gap-2 self-start" disabled={product.stock <= 0} onClick={() => addToCart(product)}>
            <ShoppingCart className="w-4 h-4" /> Add to cart
          </Button>
        </div>
      </div>
    </div>
  );
}
