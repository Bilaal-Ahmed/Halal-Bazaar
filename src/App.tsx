import { AuthProvider } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Footer } from './components/Footer';
import { Toaster } from '../components/ui/sonner';
import { ChatBot } from './components/ChatBot';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Button } from '../components/ui/button';
import { ShoppingBag, Store, ShieldCheck, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import Products from './pages/Products';
import SellerDashboard from './pages/SellerDashboard';
import AdminPanel from './pages/AdminPanel';

function Navbar() {
  const { user, profile, login, logout } = useAuth();

  return (
    <nav className="border-b bg-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight">Halal-Bazaar</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link to="/products" className="text-sm font-medium hover:text-primary transition-colors">Products</Link>
            {profile?.role === 'seller' && (
              <Link to="/seller" className="text-sm font-medium flex items-center gap-1 hover:text-primary transition-colors">
                <Store className="w-4 h-4" /> Seller Dashboard
              </Link>
            )}
            {profile?.role === 'admin' && (
              <Link to="/admin" className="text-sm font-medium flex items-center gap-1 hover:text-primary transition-colors">
                <ShieldCheck className="w-4 h-4" /> Admin
              </Link>
            )}
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                  <span className="text-sm font-semibold">{profile?.displayName || user.email}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{profile?.role}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={logout}>
                  <LogOut className="w-5 h-5" />
                </Button>
              </div>
            ) : (
              <Button onClick={login} className="flex items-center gap-2">
                <LogIn className="w-4 h-4" /> Login
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center space-y-6">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter">
          The Ethical Marketplace for <span className="text-primary">Everyone.</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Discover a wide range of halal-certified products from trusted sellers around the world.
        </p>
        <div className="flex justify-center gap-4">
          <Button size="lg" className="px-8">Shop Now</Button>
          <Button size="lg" variant="outline" className="px-8">Become a Seller</Button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-slate-50 font-sans antialiased flex flex-col">
            <Navbar />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<Products />} />
                <Route path="/seller" element={<SellerDashboard />} />
                <Route path="/admin" element={<AdminPanel />} />
              </Routes>
            </main>
            <Footer />
            <ChatBot />
            <Toaster />
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}
