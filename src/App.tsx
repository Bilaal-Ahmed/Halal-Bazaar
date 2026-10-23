
import { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from 'react-router-dom';

import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { FavouritesProvider } from './contexts/FavouritesContext';
import { CheckoutConfigProvider } from './contexts/CheckoutConfigContext';

import { ErrorBoundary } from './components/ErrorBoundary';
import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import { ChatBot } from './components/ChatBot';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Toaster } from '../components/ui/sonner';

import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Favourites from './pages/Favourites';
import SellerDashboard from './pages/SellerDashboard';
import AdminPanel from './pages/AdminPanel';
import ProfilePage from './pages/ProfilePage';
import OrdersPage from './pages/OrdersPage';
import BuyerDashboard from './pages/BuyerDashboard';

import {
  AboutPage,
  BlogPage,
  ContactPage,
  FaqPage,
  PrivacyPage,
  TermsPage,
} from './pages/InformationPages';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <CheckoutConfigProvider>
          <CartProvider>
            <FavouritesProvider>
              <Router>
                <ScrollToTop />

                <div className="min-h-screen bg-slate-50 font-sans antialiased flex flex-col">
                  <Navbar />

                  <main className="flex-grow">
                    <Routes>
                      {/* Public pages */}
                      <Route path="/" element={<Home />} />
                      <Route path="/about" element={<AboutPage />} />
                      <Route path="/blog" element={<BlogPage />} />
                      <Route path="/blog/:slug" element={<BlogPage />} />
                      <Route path="/contact" element={<ContactPage />} />
                      <Route path="/faq" element={<FaqPage />} />
                      <Route path="/privacy" element={<PrivacyPage />} />
                      <Route path="/terms" element={<TermsPage />} />

                      {/* Products and shopping */}
                      <Route path="/products" element={<Products />} />
                      <Route
                        path="/products/:productId"
                        element={<ProductDetails />}
                      />
                      <Route path="/cart" element={<Cart />} />

                      {/* User pages */}
                      <Route
                        path="/profile"
                        element={
                          <ProtectedRoute>
                            <ProfilePage />
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/dashboard"
                        element={
                          <ProtectedRoute>
                            <BuyerDashboard />
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/orders"
                        element={
                          <ProtectedRoute>
                            <OrdersPage />
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/orders/:orderId"
                        element={
                          <ProtectedRoute>
                            <OrdersPage />
                          </ProtectedRoute>
                        }
                      />

                      {/* Favourites */}
                      <Route
                        path="/favourites"
                        element={
                          <ProtectedRoute>
                            <Favourites />
                          </ProtectedRoute>
                        }
                      />

                      {/* Seller and admin */}
                      <Route
                        path="/seller"
                        element={
                          <ProtectedRoute role="seller">
                            <SellerDashboard />
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/admin"
                        element={
                          <ProtectedRoute role="admin">
                            <AdminPanel />
                          </ProtectedRoute>
                        }
                      />
                    </Routes>
                  </main>

                  <Footer />
                  <ChatBot />
                  <Toaster richColors position="top-right" />
                </div>
              </Router>
            </FavouritesProvider>
          </CartProvider>
        </CheckoutConfigProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
