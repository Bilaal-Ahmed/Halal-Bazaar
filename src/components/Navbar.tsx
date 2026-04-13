import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { Button } from '../../components/ui/button';
import { AuthModal } from './AuthModal';
import {
  ShoppingBag, ShoppingCart, Menu, X, Store, ShieldCheck, LogOut,
  User as UserIcon, Package, Home, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function Navbar() {
  const { user, profile, logout } = useAuth();
  const { totalItems } = useCart();
  const { pathname } = useLocation();
  const [authOpen, setAuthOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Home', icon: <Home className="w-4 h-4" /> },
    { href: '/products', label: 'Products', icon: <Package className="w-4 h-4" /> },
    ...(profile?.role === 'seller' ? [{ href: '/seller', label: 'Dashboard', icon: <Store className="w-4 h-4" /> }] : []),
    ...(profile?.role === 'admin' ? [{ href: '/admin', label: 'Admin', icon: <ShieldCheck className="w-4 h-4" /> }] : []),
  ];

  return (
    <>
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />

      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group" id="nav-logo">
              <div className="bg-primary text-white p-1.5 rounded-xl shadow-md group-hover:shadow-primary/30 transition-shadow">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <span className="text-xl font-black tracking-tight text-gray-900">
                Halal<span className="text-primary">-Bazaar</span>
              </span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-6">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`nav-link flex items-center gap-1.5 hover:text-primary pb-1 ${
                    pathname === link.href ? 'text-primary font-semibold' : 'text-gray-600'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {/* Cart */}
              <Link to="/cart" id="cart-btn" className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <ShoppingCart className="w-5 h-5 text-gray-700" />
                <AnimatePresence>
                  {totalItems > 0 && (
                    <motion.span
                      key={totalItems}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center"
                    >
                      {totalItems > 99 ? '99+' : totalItems}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>

              {/* Auth */}
              {user ? (
                <div className="hidden md:flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {profile?.photoURL ? (
                      <img
                        src={profile.photoURL}
                        alt={profile.displayName}
                        className="w-8 h-8 rounded-full border-2 border-primary/30 object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserIcon className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-gray-900 leading-none">
                        {profile?.displayName?.split(' ')[0] || 'User'}
                      </span>
                      <span className="text-[9px] uppercase tracking-widest text-primary font-semibold">
                        {profile?.role}
                      </span>
                    </div>
                  </div>
                  <Button
                    id="logout-btn"
                    variant="ghost"
                    size="sm"
                    onClick={logout}
                    className="text-gray-500 hover:text-red-500"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  id="login-btn"
                  onClick={() => setAuthOpen(true)}
                  className="hidden md:flex btn-primary-glow"
                  size="sm"
                >
                  Sign In
                </Button>
              )}

              {/* Mobile hamburger */}
              <button
                id="mobile-menu-btn"
                className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-gray-100 overflow-hidden"
            >
              <div className="px-4 py-4 space-y-2 bg-white">
                {navLinks.map(link => (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-colors ${
                      pathname === link.href
                        ? 'bg-primary/10 text-primary'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {link.icon}
                    {link.label}
                  </Link>
                ))}
                <div className="pt-2 border-t border-gray-100">
                  {user ? (
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <UserIcon className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-bold">{profile?.displayName}</p>
                          <p className="text-xs text-muted-foreground capitalize">{profile?.role}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => { logout(); setMobileOpen(false); }}>
                        <LogOut className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      className="w-full btn-primary-glow"
                      onClick={() => { setAuthOpen(true); setMobileOpen(false); }}
                    >
                      Sign In
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
}
