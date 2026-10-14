import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { Button } from '../../components/ui/button';
import { AuthModal } from '../components/AuthModal';
import { CATEGORIES, Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import {
  ShoppingBag, ArrowRight, ShieldCheck, Truck, HeadphonesIcon,
  ChevronRight, Sparkles, Users, Award, Globe
} from 'lucide-react';
import { motion } from 'motion/react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'sonner';

/* ─── Hero Section ─────────────────────────────────────────────────── */
function HeroSection({ onLoginClick }: { onLoginClick: () => void }) {
  const { user } = useAuth();

  return (
    <section className="hero-gradient min-h-[92vh] flex items-center relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl" />
        {/* Islamic geometric pattern dots */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            style={{
              left: `${(i * 37) % 100}%`,
              top: `${(i * 53) % 100}%`,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: Text */}
          <div className="text-white space-y-8 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-sm font-medium backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span>Pakistan's Halal Marketplace</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tighter">
              Shop with
              <br />
              <span className="text-yellow-400">Faith.</span> Live with
              <br />
              Confidence.
            </h1>

            <p className="text-lg md:text-xl text-white/75 max-w-lg leading-relaxed">
              Browse published listings across food, fashion, beauty, and more from sellers reviewed by marketplace administrators.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                id="hero-shop-btn"
                to="/products"
                className="inline-flex items-center justify-center rounded-lg bg-white text-primary hover:bg-white/90 font-bold px-8 h-14 text-base shadow-xl hover:shadow-white/20 transition-all hover:-translate-y-0.5"
              >
                Shop Now <ArrowRight className="w-5 h-5 ml-2" />
              </Link>

              {!user && (
                <Button
                  id="hero-join-btn"
                  variant="outline"
                  size="lg"
                  onClick={onLoginClick}
                  className="border-white/40 text-white hover:bg-white/10 font-bold px-8 h-14 text-base backdrop-blur-sm bg-transparent"
                >
                  Join Free
                </Button>
              )}
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-6 pt-2">
              {[
                { icon: <ShieldCheck className="w-4 h-4" />, text: 'Seller-submitted halal information' },
                { icon: <ShoppingBag className="w-4 h-4" />, text: 'Live product availability' },
                { icon: <Users className="w-4 h-4" />, text: 'Seller applications reviewed' },
              ].map(b => (
                <div key={b.text} className="flex items-center gap-2 text-sm text-white/80">
                  {b.icon}
                  <span>{b.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Category grid preview */}
          <div className="hidden lg:grid grid-cols-2 gap-4">
            {CATEGORIES.slice(0, 4).map((cat, i) => (
              <motion.div
                key={cat.slug}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
              >
                <Link to={`/products?category=${cat.slug}`}>
                  <div className={`relative rounded-2xl overflow-hidden aspect-square group cursor-pointer ${i === 0 ? 'mt-8' : i === 2 ? '-mt-8' : ''}`}>
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-3 left-3">
                      <span className="text-2xl">{cat.icon}</span>
                      <p className="text-white text-sm font-bold mt-1">{cat.name}</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Stats Strip ───────────────────────────────────────────────────── */
function StatsStrip() {
  const stats = [
    { icon: <Users className="w-6 h-6" />, value: 'Reviewed', label: 'Seller applications' },
    { icon: <ShoppingBag className="w-6 h-6" />, value: 'Checked', label: 'Price and stock at checkout' },
    { icon: <ShieldCheck className="w-6 h-6" />, value: 'Protected', label: 'Payment status transitions' },
    { icon: <Globe className="w-6 h-6" />, value: 'Transparent', label: 'Manual transfer review' },
  ];

  return (
    <section className="bg-primary py-10">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map(s => (
          <div key={s.label} className="text-center text-white">
            <div className="flex justify-center mb-2 opacity-80">{s.icon}</div>
            <div className="text-3xl font-black">{s.value}</div>
            <div className="text-white/70 text-sm mt-1">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Categories Section ────────────────────────────────────────────── */
function CategoriesSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="halal-badge mb-3">Browse Categories</span>
          <h2 className="text-4xl font-black mt-3">Shop by Category</h2>
          <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
            Explore independent sellers' listings across a range of categories.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {CATEGORIES.map((cat, i) => (
            <motion.div
              key={cat.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <Link to={`/products?category=${cat.slug}`} id={`cat-${cat.slug}`}>
                <div className="group text-center rounded-2xl overflow-hidden border border-gray-100 hover:border-primary/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white cursor-pointer">
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-3">
                    <div className="text-2xl mb-1">{cat.icon}</div>
                    <p className="text-xs font-bold text-gray-800 leading-tight">{cat.name}</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Featured Products ──────────────────────────────────────────────── */
function FeaturedProducts() {
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const productQuery = query(
      collection(db, 'products'),
      where('published', '==', true),
    );
    return onSnapshot(productQuery, snapshot => {
      const publishedProducts = snapshot.docs.map(document => ({
        id: document.id,
        rating: 0,
        numReviews: 0,
        ...document.data(),
      } as Product));
      publishedProducts.sort((left, right) => {
        const createdAt = (value: Product['createdAt']) => value?.toMillis?.() ?? new Date(value || 0).getTime();
        return createdAt(right.createdAt) - createdAt(left.createdAt);
      });
      setProducts(publishedProducts.slice(0, 6));
      setLoading(false);
    }, error => {
      console.error('Could not load featured listings:', error);
      setProducts([]);
      setLoading(false);
      toast.error('Featured listings could not be loaded.');
    });
  }, []);

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="halal-badge mb-3">Handpicked for You</span>
            <h2 className="text-4xl font-black mt-3">Featured Products</h2>
          </div>

          <Link
            to="/products"
            className="hidden md:inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <ProductCard
                product={product}
                onAddToCart={() => addToCart(product)}
              />
            </motion.div>
          ))}
          {!loading && products.length === 0 && (
            <div className="sm:col-span-2 lg:col-span-3 rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
              No published listings yet. Approved sellers will appear here when they publish products.
            </div>
          )}
          {loading && <div className="sm:col-span-2 lg:col-span-3 p-8 text-center text-muted-foreground">Loading published listings…</div>}
        </div>

        <div className="text-center mt-10 md:hidden">
          <Link
            to="/products"
            className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-10 py-2 text-sm font-medium hover:bg-muted"
          >
            View All Products
          </Link>
        </div>
      </div>
    </section>
  );
}


/* ─── Why Us Section ────────────────────────────────────────────────── */
function WhyUsSection() {
  const perks = [
    {
      icon: <ShieldCheck className="w-7 h-7" />,
      title: 'Seller-provided information',
      desc: 'Listings may include halal information supplied by their seller; the marketplace does not independently certify claims.',
      color: 'bg-green-50 text-green-600',
    },
    {
      icon: <Truck className="w-7 h-7" />,
      title: 'Order updates',
      desc: 'Buyers can see seller fulfillment updates as orders move through processing, shipping, and delivery.',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      icon: <HeadphonesIcon className="w-7 h-7" />,
      title: 'Seller review',
      desc: 'Seller applications are reviewed before seller product and order tools become available.',
      color: 'bg-purple-50 text-purple-600',
    },
    {
      icon: <Award className="w-7 h-7" />,
      title: 'Payment visibility',
      desc: 'Manual bank transfers stay pending until reviewed. Gateway payments are not enabled without verified provider integrations.',
      color: 'bg-orange-50 text-orange-600',
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="halal-badge mb-3">Why Choose Us</span>
          <h2 className="text-4xl font-black mt-3">Built on Trust &amp; Faith</h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            We aren't just a marketplace — we're a community built on Islamic values and ethical commerce.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {perks.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group p-6 rounded-2xl border border-gray-100 hover:border-primary/30 hover:shadow-xl card-hover bg-white text-center"
            >
              <div className={`w-14 h-14 ${p.color} rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform`}>
                {p.icon}
              </div>
              <h3 className="font-bold text-lg mb-2">{p.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Home Page ──────────────────────────────────────────────────────── */
export default function Home() {
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <>
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      <HeroSection onLoginClick={() => setAuthOpen(true)} />
      <StatsStrip />
      <CategoriesSection />
      <FeaturedProducts />
      <WhyUsSection />
    </>
  );
}
