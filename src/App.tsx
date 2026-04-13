import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import { ChatBot } from './components/ChatBot';
import { Toaster } from '../components/ui/sonner';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Products from './pages/Products';
import Cart from './pages/Cart';
import SellerDashboard from './pages/SellerDashboard';
import AdminPanel from './pages/AdminPanel';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <CartProvider>
          <Router>
            <div className="min-h-screen bg-slate-50 font-sans antialiased flex flex-col">
              <Navbar />
              <main className="flex-grow">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/seller" element={<SellerDashboard />} />
                  <Route path="/admin" element={<AdminPanel />} />
                </Routes>
              </main>
              <Footer />
              <ChatBot />
              <Toaster richColors position="top-right" />
            </div>
          </Router>
        </CartProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
