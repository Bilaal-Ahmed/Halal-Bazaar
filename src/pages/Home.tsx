import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { Button } from '../../components/ui/button';
import { AuthModal } from '../components/AuthModal';
import { CATEGORIES, SAMPLE_PRODUCTS } from '../types';
import { ProductCard } from '../components/ProductCard';
import {
  ShoppingBag, ArrowRight, ShieldCheck, Truck, HeadphonesIcon, Star,
  ChevronRight, Sparkles, Users, Award, Globe
} from 'lucide-react';
import { motion } from 'motion/react';

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
              <span>Pakistan's #1 Halal E-Commerce</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tighter">
              Shop with
              <br />
              <span className="text-yellow-400">Faith.</span> Live with
              <br />
              Confidence.
            </h1>

            <p className="text-lg md:text-xl text-white/75 max-w-lg leading-relaxed">
              Discover thousands of halal-certified products across food, fashion, beauty, and more —
              all from verified, trusted sellers.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button
                id="hero-shop-btn"
                asChild
                size="lg"
                className="bg-white text-primary hover:bg-white/90 font-bold px-8 h-14 text-base shadow-xl hover:shadow-white/20 transition-all hover:-translate-y-0.5"
              >
                <Link to="/products">
                  Shop Now <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>

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
                { icon: <ShieldCheck className="w-4 h-4" />, text: '100% Halal Certified' },
                { icon: <Star className="w-4 h-4 text-yellow-400" />, text: '4.9★ Rated' },
                { icon: <Users className="w-4 h-4" />, text: '50K+ Customers' },
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
    { icon: <Users className="w-6 h-6" />, value: '50,000+', label: 'Happy Customers' },
    { icon: <ShoppingBag className="w-6 h-6" />, value: '12,000+', label: 'Products Listed' },
    { icon: <Award className="w-6 h-6" />, value: '800+', label: 'Verified Sellers' },
    { icon: <Globe className="w-6 h-6" />, value: '35+', label: 'Countries Served' },
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
            Explore our wide range of halal-certified product categories
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

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="halal-badge mb-3">Handpicked for You</span>
            <h2 className="text-4xl font-black mt-3">Featured Products</h2>
          </div>
          <Button asChild variant="outline" className="hidden md:flex gap-2">
            <Link to="/products">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {SAMPLE_PRODUCTS.slice(0, 6).map((product, i) => (
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
        </div>

        <div className="text-center mt-10 md:hidden">
          <Button asChild variant="outline" size="lg" className="px-10">
            <Link to="/products">View All Products</Link>
          </Button>
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
      title: 'Halal Certified',
      desc: 'All products verified by certified Islamic scholars and halal certification bodies worldwide.',
      color: 'bg-green-50 text-green-600',
    },
    {
      icon: <Truck className="w-7 h-7" />,
      title: 'Fast Delivery',
      desc: 'Same-day delivery in major cities. Nationwide shipping with real-time tracking on every order.',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      icon: <HeadphonesIcon className="w-7 h-7" />,
      title: '24/7 Support',
      desc: 'Our dedicated team and AI assistant are always ready to answer your questions anytime.',
      color: 'bg-purple-50 text-purple-600',
    },
    {
      icon: <Award className="w-7 h-7" />,
      title: 'Quality Guarantee',
      desc: 'Not satisfied? Get a full refund within 30 days — no questions asked. We stand behind every product.',
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

/* ─── Testimonials ───────────────────────────────────────────────────── */
function Testimonials() {
  const reviews = [
    {
      name: 'Fatima Al-Rashid',
      role: 'Regular Customer',
      review: 'Halal-Bazaar has completely transformed my shopping experience. I can shop confidently knowing every product is verified halal. The quality is exceptional!',
      rating: 5,
      avatar: 'https://i.pravatar.cc/80?img=47',
    },
    {
      name: 'Ahmed Khan',
      role: 'Seller since 2024',
      review: "As a seller, the platform has given my halal business incredible reach. Sales have doubled in 3 months. The team's support is outstanding!",
      rating: 5,
      avatar: 'https://i.pravatar.cc/80?img=33',
    },
    {
      name: 'Sarah Mohammed',
      role: 'Verified Buyer',
      review: "Best online shopping experience I've had. Products arrive beautifully packaged, and the halal certification gives me complete peace of mind.",
      rating: 5,
      avatar: 'https://i.pravatar.cc/80?img=45',
    },
  ];

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="halal-badge mb-3">Testimonials</span>
          <h2 className="text-4xl font-black mt-3">Loved by Our Community</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((r, i) => (
            <motion.div
              key={r.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl card-hover"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(r.rating)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 text-sm leading-relaxed mb-6">"{r.review}"</p>
              <div className="flex items-center gap-3">
                <img src={r.avatar} alt={r.name} className="w-11 h-11 rounded-full object-cover" referrerPolicy="no-referrer" />
                <div>
                  <p className="font-bold text-sm">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Newsletter ─────────────────────────────────────────────────────── */
function Newsletter() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setEmail('');
  };

  return (
    <section className="py-20 hero-gradient">
      <div className="max-w-2xl mx-auto px-4 text-center text-white">
        <span className="inline-flex items-center gap-1 bg-white/10 border border-white/20 rounded-full px-3 py-1 text-xs mb-4">
          <Sparkles className="w-3 h-3 text-yellow-400" /> Exclusive Deals
        </span>
        <h2 className="text-4xl font-black mb-4">Get 15% Off Your First Order</h2>
        <p className="text-white/75 mb-8">
          Subscribe to our newsletter and be the first to know about new arrivals, halal sales, and exclusive community offers.
        </p>
        {sent ? (
          <div className="bg-white/10 border border-white/20 rounded-2xl p-6 backdrop-blur-sm">
            <div className="text-3xl mb-2">🎉</div>
            <p className="font-bold text-lg">You're in! Welcome to the community.</p>
            <p className="text-white/70 text-sm mt-1">Check your Gmail for your 15% discount code.</p>
          </div>
        ) : (
          <form
            id="newsletter-form"
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <input
              type="email"
              placeholder="your@gmail.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="flex-1 h-12 px-5 rounded-xl bg-white/10 border border-white/30 text-white placeholder:text-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <Button
              id="newsletter-subscribe-btn"
              type="submit"
              className="bg-white text-primary hover:bg-white/90 font-bold px-6 h-12"
            >
              Subscribe
            </Button>
          </form>
        )}
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
      <Testimonials />
      <Newsletter />
    </>
  );
}
