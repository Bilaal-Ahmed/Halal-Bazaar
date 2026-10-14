import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest } from '../lib/api';
import { formatCurrency } from '../lib/currency';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Cart() {
  const navigate = useNavigate();
  const {
    items,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
  } = useCart();

  const { user, profile, login } = useAuth();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash_on_delivery' | 'bank_transfer'>('cash_on_delivery');
  const [transferReference, setTransferReference] = useState('');
  const [checkoutConfig, setCheckoutConfig] = useState({
    currency: import.meta.env.VITE_ORDER_CURRENCY || 'USD',
    taxRate: 0.05,
    bankTransferEnabled: false,
  });
  const idempotencyKey = useRef<string | null>(null);
  const [shippingAddress, setShippingAddress] = useState({
    name: '',
    address: '',
    city: '',
    zip: '',
    country: 'Pakistan',
  });

  useEffect(() => {
    if (!profile) return;
    setShippingAddress(current => ({
      name: profile.displayName || current.name,
      address: profile.defaultAddress || current.address,
      city: profile.city || current.city,
      zip: profile.postalCode || current.zip,
      country: profile.country || current.country,
    }));
  }, [profile]);

  useEffect(() => {
    let active = true;
    apiRequest<{ currency: string; taxRate: number; bankTransferEnabled: boolean }>('/api/checkout/config')
      .then(config => {
        if (!active) return;
        setCheckoutConfig(config);
        if (!config.bankTransferEnabled) setPaymentMethod('cash_on_delivery');
      })
      .catch(error => {
        console.error('Could not load checkout configuration:', error);
        if (active) toast.error('Checkout configuration could not be loaded.');
      });
    return () => { active = false; };
  }, []);

  const subtotal = totalPrice;
  const estimatedTax = subtotal * checkoutConfig.taxRate;
  const estimatedTotal = subtotal + estimatedTax;

  const handleCheckout = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!user) {
      try {
        await login();
        toast.info('After signing in, review your cart and confirm the order.');
      } catch (error) {
        console.error('Sign-in failed:', error);
        toast.error('Please sign in before placing your order.');
      }
      return;
    }
    if (!user.emailVerified) {
      toast.error('Verify your email before placing an order. You can request verification from your profile.');
      return;
    }

    if (items.length === 0) {
      toast.error('Your cart is empty.');
      return;
    }

    if (
      !shippingAddress.name.trim() ||
      !shippingAddress.address.trim() ||
      !shippingAddress.city.trim() ||
      !shippingAddress.zip.trim() ||
      !shippingAddress.country.trim()
    ) {
      toast.error('Please complete all delivery details.');
      return;
    }

    setSubmitting(true);

    try {
      idempotencyKey.current ||= crypto.randomUUID();
      const result = await apiRequest<{
        order: { id: string };
        bankTransferInstructions: string | null;
      }>('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          idempotencyKey: idempotencyKey.current,
          items: items.map(({ product, quantity }) => ({ productId: product.id, quantity })),
          paymentMethod,
          transferReference: paymentMethod === 'bank_transfer' ? transferReference.trim() : '',
          shippingAddress: {
            name: shippingAddress.name.trim(),
            address: shippingAddress.address.trim(),
            city: shippingAddress.city.trim(),
            zip: shippingAddress.zip.trim(),
            country: shippingAddress.country.trim(),
          },
        }),
      });

      clearCart();
      idempotencyKey.current = null;
      setCheckoutOpen(false);
      toast.success(`Order placed! Reference: ${result.order.id}`);
      if (paymentMethod === 'bank_transfer') {
        toast.info(result.bankTransferInstructions || 'Your transfer will remain pending until an administrator verifies it.');
      }
      navigate(`/orders/${encodeURIComponent(result.order.id)}`);
    } catch (error) {
      console.error('Checkout failed:', error);
      toast.error(error instanceof Error ? error.message : 'Could not place your order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-28 h-28 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="w-14 h-14 text-primary" />
        </div>
        <h1 className="text-3xl font-black mb-3">Your cart is empty</h1>
        <p className="text-muted-foreground max-w-sm mb-8">
          Looks like you haven't added any halal products yet. Let's fix that!
        </p>
        <Link
          id="cart-shop-btn"
          to="/products"
          className="btn-primary-glow inline-flex items-center justify-center rounded-lg px-10 h-9 text-sm font-medium"
        >
          Start Shopping <ArrowRight className="ml-2 w-5 h-5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black">Shopping Cart</h1>
          <p className="text-muted-foreground mt-1">
            {totalItems} item{totalItems !== 1 ? 's' : ''} in your cart
          </p>
        </div>
        <Button
          id="clear-cart-btn"
          variant="ghost"
          size="sm"
          onClick={clearCart}
          className="text-red-500 hover:text-red-600 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4 mr-2" /> Clear All
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence>
            {items.map(({ product, quantity }) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20, height: 0 }}
                className="flex gap-4 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-50 shrink-0">
                  <img
                    src={
                      product.images?.[0] ||
                      `https://picsum.photos/seed/${product.id}/200/200`
                    }
alt = { product.name }
className = "w-full h-full object-cover"
referrerPolicy = "no-referrer"
onError = {(e) => {
  (e.currentTarget as HTMLImageElement).src =
    `https://picsum.photos/seed/${product.id}/200/200`;
}}
                  />
                </div >

  <div className="flex-1 min-w-0">
    <div className="flex items-start justify-between gap-2">
      <div>
        <h3 className="font-bold text-sm line-clamp-2 leading-snug">
          {product.name}
        </h3>
        <p className="text-xs text-muted-foreground capitalize mt-0.5">
          {product.category}
        </p>
        {product.isHalalCertified && (
          <span className="halal-badge text-[9px] mt-1 inline-flex">
            <ShieldCheck className="w-3 h-3" /> Halal
          </span>
        )}
      </div>
      <button
        type="button"
        aria-label={`Remove ${product.name}`}
        onClick={() => removeFromCart(product.id)}
        className="text-gray-400 hover:text-red-500 transition-colors shrink-0 p-1"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>

    <div className="flex items-center justify-between mt-3">
      <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-1">
        <button
          type="button"
          aria-label={`Decrease ${product.name} quantity`}
          onClick={() =>
            updateQuantity(product.id, quantity - 1)
          }
          className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-gray-100"
        >
          <Minus className="w-3 h-3" />
        </button>
        <span className="text-sm font-bold w-6 text-center">
          {quantity}
        </span>
        <button
          type="button"
          aria-label={`Increase ${product.name} quantity`}
          onClick={() =>
            updateQuantity(product.id, quantity + 1)
          }
          disabled={quantity >= product.stock}
          className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-gray-100 disabled:opacity-40"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      <div className="text-right">
        <div className="font-black text-base">
          {formatCurrency(product.price * quantity, checkoutConfig.currency)}
        </div>
        {quantity > 1 && (
          <div className="text-xs text-muted-foreground">
            {formatCurrency(product.price, checkoutConfig.currency)} each
          </div>
        )}
      </div>
    </div>
  </div>
              </motion.div >
            ))}
          </AnimatePresence >

  <Link
    to="/products"
    className="inline-flex w-full items-center justify-center gap-2 mt-4 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
  >
    Continue Shopping
  </Link>
        </div >

  <div className="lg:col-span-1">
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-20">
      <h2 className="text-xl font-black mb-6">Order Summary</h2>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal ({totalItems} items)</span>
          <span>{formatCurrency(subtotal, checkoutConfig.currency)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Shipping</span>
          <span className="text-green-600 font-medium">FREE</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Tax (est.)</span>
          <span>{formatCurrency(estimatedTax, checkoutConfig.currency)}</span>
        </div>
        <div className="border-t border-dashed pt-3 flex justify-between font-black text-lg">
          <span>Total</span>
          <span>{formatCurrency(estimatedTotal, checkoutConfig.currency)}</span>
        </div>
      </div>

      <Button
        id="checkout-btn"
        type="button"
        size="lg"
        className="w-full mt-6 btn-primary-glow font-bold text-base h-13"
        onClick={() => setCheckoutOpen((open) => !open)}
      >
        {checkoutOpen ? 'Hide Checkout' : 'Proceed to Checkout'}
        <ArrowRight className="ml-2 w-4 h-4" />
      </Button>

      {checkoutOpen && (
        <form onSubmit={handleCheckout} className="mt-5 space-y-4">
          <h3 className="font-bold text-lg">Delivery Details</h3>

          <input
            required
            maxLength={100}
            autoComplete="name"
            placeholder="Full name"
            value={shippingAddress.name}
            onChange={(e) =>
              setShippingAddress({
                ...shippingAddress,
                name: e.target.value,
              })
            }
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />

          <textarea
            required
            maxLength={300}
            autoComplete="street-address"
            placeholder="Complete delivery address"
            value={shippingAddress.address}
            onChange={(e) =>
              setShippingAddress({
                ...shippingAddress,
                address: e.target.value,
              })
            }
            className="w-full rounded-lg border px-3 py-2 text-sm"
            rows={3}
          />

          <input
            required
            maxLength={80}
            autoComplete="address-level2"
            placeholder="City"
            value={shippingAddress.city}
            onChange={(e) =>
              setShippingAddress({
                ...shippingAddress,
                city: e.target.value,
              })
            }
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />

          <input
            required
            maxLength={20}
            autoComplete="postal-code"
            placeholder="Postal code"
            value={shippingAddress.zip}
            onChange={(e) =>
              setShippingAddress({
                ...shippingAddress,
                zip: e.target.value,
              })
            }
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />

          <input
            required
            maxLength={60}
            autoComplete="country-name"
            placeholder="Country"
            value={shippingAddress.country}
            onChange={(e) =>
              setShippingAddress({
                ...shippingAddress,
                country: e.target.value,
              })
            }
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />

          <fieldset className="space-y-2">
            <legend className="font-semibold text-sm">Payment method</legend>
            <label className="flex items-center gap-2 rounded-lg border p-3 text-sm cursor-pointer">
              <input
                type="radio"
                name="paymentMethod"
                value="cash_on_delivery"
                checked={paymentMethod === 'cash_on_delivery'}
                onChange={() => setPaymentMethod('cash_on_delivery')}
              />
              Cash on Delivery
            </label>
            <label className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${checkoutConfig.bankTransferEnabled ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
              <input
                type="radio"
                name="paymentMethod"
                value="bank_transfer"
                checked={paymentMethod === 'bank_transfer'}
                onChange={() => setPaymentMethod('bank_transfer')}
                disabled={!checkoutConfig.bankTransferEnabled}
              />
              Manual Bank Transfer {checkoutConfig.bankTransferEnabled ? '(review required)' : '(not configured)'}
            </label>
          </fieldset>
          {!checkoutConfig.bankTransferEnabled && <p className="text-xs text-muted-foreground">Manual transfer checkout is disabled until the operator configures bank instructions on the server.</p>}

          {paymentMethod === 'bank_transfer' && (
            <input
              required
              maxLength={120}
              placeholder="Transfer reference"
              value={transferReference}
              onChange={event => setTransferReference(event.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
          )}

          <div className="rounded-lg bg-slate-50 p-3 text-sm">
            <p className="font-semibold">
              {paymentMethod === 'cash_on_delivery' ? 'Pay in cash when delivered' : 'Manual bank-transfer review'}
            </p>
            <p className="text-muted-foreground mt-1">
              JazzCash and Easypaisa are not enabled until their merchant integrations are configured and verified.
            </p>
            <p className="font-bold mt-2">
              Estimated total: {formatCurrency(estimatedTotal, checkoutConfig.currency)}
            </p>
          </div>

          {!user && (
            <p className="text-sm text-amber-700">
              Sign in is required before you can submit your order.
            </p>
          )}
          {user && !user.emailVerified && (
            <p className="text-sm text-amber-700">
              Email verification is required for checkout. Use the Profile page to send a verification email.
            </p>
          )}

          <Button
            type="submit"
            disabled={submitting || Boolean(user && !user.emailVerified)}
            className="w-full font-bold"
          >
            {submitting
              ? 'Placing Order...'
              : user
                ? 'Confirm Order'
                : 'Sign In to Continue'}
          </Button>
        </form>
      )}

      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="w-4 h-4 text-primary" />
        <span>Order pricing and stock are revalidated on the server.</span>
      </div>
    </div>
  </div>
      </div >
    </div >
  );
}