import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  ShoppingCart,
  Menu,
  X,
  Store,
  ShieldCheck,
  LogOut,
  User as UserIcon,
  Package,
  Home,
  Search,
  Heart,
  LayoutDashboard,
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { AuthModal } from './AuthModal';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

export function Navbar() {
  const { user, profile, logout } = useAuth();
  const { items } = useCart();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const cartCount = items.reduce(
    (total, item) => total + (item.quantity || 1),
    0
  );

  const isAdmin = profile?.role === 'admin';

  const isApprovedSeller =
    profile?.role === 'seller' && profile?.status === 'approved';

  const navLinks: NavItem[] = [
    {
      href: '/',
      label: 'Home',
      icon: <Home className="h-4 w-4" />,
    },
    {
      href: '/products',
      label: 'Products',
      icon: <Package className="h-4 w-4" />,
    },
    ...(user
      ? [
        {
          href: '/dashboard',
          label: 'Dashboard',
          icon: <LayoutDashboard className="h-4 w-4" />,
        },
        {
          href: '/favourites',
          label: 'Favourites',
          icon: <Heart className="h-4 w-4" />,
        },
        {
          href: '/orders',
          label: 'My Orders',
          icon: <ShoppingBag className="h-4 w-4" />,
        },
      ]
      : []),
    ...(isApprovedSeller
      ? [
        {
          href: '/seller',
          label: 'Seller Dashboard',
          icon: <Store className="h-4 w-4" />,
        },
      ]
      : []),
    ...(isAdmin
      ? [
        {
          href: '/admin',
          label: 'Admin',
          icon: <ShieldCheck className="h-4 w-4" />,
        },
      ]
      : []),
  ];

  const handleLogout = async () => {
    try {
      await logout();
      setMobileMenuOpen(false);
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${isActive
      ? 'bg-emerald-50 text-emerald-800'
      : 'text-slate-700 hover:bg-slate-100 hover:text-emerald-700'
    }`;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex shrink-0 items-center gap-2 text-xl font-bold text-emerald-800"
          >
            <ShoppingBag className="h-6 w-6" />
            <span>Halal Bazaar</span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.href === '/'}
                className={linkClass}
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              to="/products"
              aria-label="Search products"
              className="hidden rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 sm:inline-flex"
            >
              <Search className="h-5 w-5" />
            </Link>

            <Link
              to="/cart"
              aria-label={`Shopping cart, ${cartCount} items`}
              className="relative rounded-lg p-2 text-slate-700 transition hover:bg-slate-100"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-700 px-1 text-xs font-bold text-white">
                  {cartCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="hidden items-center gap-2 sm:flex">
                <Link
                  to="/profile"
                  aria-label="My profile"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
                >
                  <UserIcon className="h-4 w-4" />
                  <span className="max-w-28 truncate">
                    {profile?.displayName ||
                      user.displayName ||
                      user.email ||
                      'My Account'}
                  </span>
                </Link>

                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="rounded-lg p-2 text-slate-600 transition hover:bg-red-50 hover:text-red-600"
                  aria-label="Log out"
                  title="Log out"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="hidden rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 sm:inline-flex"
              >
                Sign in
              </button>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="rounded-lg p-2 text-slate-700 transition hover:bg-slate-100 lg:hidden"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white px-4 py-4 lg:hidden">
            <nav className="flex flex-col gap-1">
              {navLinks.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  end={item.href === '/'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={linkClass}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="mt-3 border-t border-slate-200 pt-3">
              {user ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                  >
                    <UserIcon className="h-4 w-4" />
                    {profile?.displayName ||
                      user.displayName ||
                      user.email ||
                      'My Profile'}
                  </Link>

                  <button
                    type="button"
                    onClick={() => void handleLogout()}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Log out
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setAuthModalOpen(true);
                  }}
                  className="w-full rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
                >
                  Sign in / Register
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </>
  );
}

export default Navbar;