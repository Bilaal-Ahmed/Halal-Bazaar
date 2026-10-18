import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useCheckoutConfig } from '../contexts/CheckoutConfigContext';
import { apiRequest } from '../lib/api';
import {
  allocateSellerTaxCents,
  findEnabledPaymentAccount,
  type SellerPaymentAccount,
} from '../lib/sellerPayments';
import {
  calculateTaxCents,
  formatCurrency,
  getProductPrice,
} from '../lib/currency';
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


function createIdempotencyKey(): string {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // Secure random bytes also work where randomUUID is unavailable.
  const bytes = crypto.getRandomValues(new Uint8Array(16));

  // Format as a UUID v4.
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('');

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}


interface CheckoutSeller {
  sellerId: string;
  sellerName: string;
  accounts: SellerPaymentAccount[];
}

const paymentMethodLabels: Record<SellerPaymentAccount['method'], string> = {
  jazzcash: 'JazzCash',
  easypaisa: 'Easypaisa',
  raast: 'Raast',
  bank_transfer: 'Bank transfer',
};

export default function Cart() {
  const navigate = useNavigate();
  const {
    items,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
  } = useCart();

  const { user, profile, login } = useAuth();
  const { config, error: checkoutConfigError } = useCheckoutConfig();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash_on_delivery' | 'manual_payment'>('cash_on_delivery');
  const [checkoutSellers, setCheckoutSellers] = useState<CheckoutSeller[]>([]);
  const [selectedPaymentAccountIds, setSelectedPaymentAccountIds] = useState<Record<string, string>>({});
  const [transferReferences, setTransferReferences] = useState<Record<string, string>>({});
  const [paymentAccountsLoading, setPaymentAccountsLoading] = useState(false);
  const checkoutConfig = config || {
    taxRates: { PKR: null as number | null, USD: null as number | null },
    legacyPriceCurrency: null as 'PKR' | 'USD' | null,
    cashOnDeliveryCountries: [] as string[],
    bankTransferEnabled: { PKR: false, USD: false },
  };
  const idempotencyKey = useRef<string | null>(null);
  const [shippingAddress, setShippingAddress] = useState({
    name: '',
    address: '',
    city: '',
    zip: '',
    country: 'PK',
  });
  const updateShippingField = (field: keyof typeof shippingAddress, value: string) => {
    setShippingAddress((current) => ({ ...current, [field]: value }));
  };

  useEffect(() => {
    if (!profile) return;
    const savedCountry = profile.country?.trim() || '';
    const normalizedCountry = /^pakistan$/i.test(savedCountry)
      ? 'PK'
      : /^[A-Za-z]{2}$/.test(savedCountry)
        ? savedCountry.toUpperCase()
        : '';
    setShippingAddress(current => ({
      name: profile.displayName || current.name,
      address: profile.defaultAddress || current.address,
      city: profile.city || current.city,
      zip: profile.postalCode || current.zip,
      country: normalizedCountry,
    }));
  }, [profile]);

  useEffect(() => {
    if (checkoutConfigError) toast.error('Checkout configuration could not be loaded.');
  }, [checkoutConfigError]);

  const countryCode = shippingAddress.country.trim().toUpperCase() === 'PAKISTAN'
    ? 'PK'
    : shippingAddress.country.trim().toUpperCase();
  const currency = countryCode === 'PK' ? 'PKR' : 'USD';
  const taxRate = checkoutConfig.taxRates[currency];
  const codAvailable = checkoutConfig.cashOnDeliveryCountries.includes(countryCode);
  const cartSellerIds = [...new Set(items
    .map(({ product }) => product.sellerId)
    .filter((sellerId): sellerId is string => typeof sellerId === 'string' && sellerId.length > 0))]
    .sort();
  const cartSellerIdsKey = cartSellerIds.join(',');
  const pricedItems = items.map(({ product, quantity }) => ({
    product,
    quantity,
    unitPrice: getProductPrice(product, currency, checkoutConfig.legacyPriceCurrency),
  }));
  const missingMarketPrice = pricedItems.some(item => item.unitPrice === null);
  const subtotal = pricedItems.reduce(
    (sum, item) => sum + (item.unitPrice ?? 0) * item.quantity,
    0
  );
  const subtotalCents = Math.round(subtotal * 100);
  const estimatedTax = taxRate === null || missingMarketPrice
    ? null
    : calculateTaxCents(subtotalCents, taxRate) / 100;
  const estimatedTotal = estimatedTax === null ? null : subtotal + estimatedTax;
  const manualPaymentAvailable = cartSellerIds.length > 0
    && cartSellerIds.every((sellerId) => checkoutSellers.some(
      (seller) => seller.sellerId === sellerId && seller.accounts.length > 0,
    ));

  const sellerPaymentEstimates: Record<string, number> = (() => {
    if (taxRate === null || missingMarketPrice || cartSellerIds.length === 0) return {};
    const sellerSubtotalsCents = Object.create(null) as Record<string, number>;
    for (const sellerId of cartSellerIds) sellerSubtotalsCents[sellerId] = 0;
    for (const item of pricedItems) {
      const price = item.unitPrice;
      if (
        price === null
        || !Object.prototype.hasOwnProperty.call(sellerSubtotalsCents, item.product.sellerId)
      ) continue;
      sellerSubtotalsCents[item.product.sellerId] += Math.round(price * 100) * item.quantity;
    }
    const sellerTaxCents = allocateSellerTaxCents(
      sellerSubtotalsCents,
      calculateTaxCents(subtotalCents, taxRate),
    );
    return Object.fromEntries(cartSellerIds.map((sellerId) => [
      sellerId,
      (sellerSubtotalsCents[sellerId] + sellerTaxCents[sellerId]) / 100,
    ]));
  })();

  useEffect(() => {
    if (!checkoutOpen || !user?.emailVerified || !cartSellerIdsKey) {
      setCheckoutSellers([]);
      setPaymentAccountsLoading(false);
      return;
    }

    let active = true;
    setPaymentAccountsLoading(true);
    apiRequest<{ sellers: CheckoutSeller[] }>(
      `/api/checkout/payment-accounts?sellerIds=${encodeURIComponent(cartSellerIdsKey)}`,
    )
      .then(({ sellers }) => {
        if (!active) return;
        setCheckoutSellers(sellers);
        setSelectedPaymentAccountIds((current) => Object.fromEntries(
          sellers.map((seller) => {
            const currentId = current[seller.sellerId];
            const selected = seller.accounts.find((account) => account.id === currentId)
              || seller.accounts[0];
            return [seller.sellerId, selected?.id || ''];
          }),
        ));
      })
      .catch((error) => {
        if (!active) return;
        setCheckoutSellers([]);
        toast.error(error instanceof Error ? error.message : 'Seller payment accounts could not be loaded.');
      })
      .finally(() => {
        if (active) setPaymentAccountsLoading(false);
      });

    return () => { active = false; };
  }, [checkoutOpen, user?.uid, user?.emailVerified, cartSellerIdsKey]);

  useEffect(() => {
    if (!codAvailable && manualPaymentAvailable && paymentMethod === 'cash_on_delivery') {
      setPaymentMethod('manual_payment');
    }
  }, [codAvailable, manualPaymentAvailable, paymentMethod]);

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

    if (taxRate === null) {
      toast.error('Checkout for this currency is unavailable until its tax policy is configured.');
      return;
    }
    if (missingMarketPrice) {
      toast.error(`At least one product does not have a valid ${currency} price.`);
      return;
    }
    if (paymentMethod === 'cash_on_delivery' && !codAvailable) {
      toast.error('Cash on delivery is not available for this delivery destination.');
      return;
    }
    if (paymentMethod === 'manual_payment') {
      if (!manualPaymentAvailable) {
        toast.error('Every seller in your cart must have an enabled payment account.');
        return;
      }
      const missingPaymentDetails = cartSellerIds.some((sellerId) => {
        const seller = checkoutSellers.find((entry) => entry.sellerId === sellerId);
        const account = seller?.accounts.find(
          (entry) => entry.id === selectedPaymentAccountIds[sellerId] && entry.enabled,
        );
        return !account || !transferReferences[sellerId]?.trim();
      });
      if (missingPaymentDetails) {
        toast.error('Choose an enabled payment account and enter a transfer reference for each seller.');
        return;
      }
    }

    setSubmitting(true);

    try {
      idempotencyKey.current ||= createIdempotencyKey();
      const result = await apiRequest<{
        order: { id: string };
      }>('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          idempotencyKey: idempotencyKey.current,
          items: items.map(({ product, quantity }) => ({ productId: product.id, quantity })),
          paymentMethod,
          ...(paymentMethod === 'manual_payment' ? {
            sellerPayments: cartSellerIds.map((sellerId) => ({
              sellerId,
              paymentAccountId: selectedPaymentAccountIds[sellerId],
              transferReference: transferReferences[sellerId].trim(),
            })),
          } : {}),
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
      if (paymentMethod === 'manual_payment') {
        toast.info('Transfer each seller’s amount separately. Sellers must independently verify receipt before marking payments as paid.');
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
            {pricedItems.map(({ product, quantity, unitPrice }) => (
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
        {unitPrice === null
          ? `Unavailable in ${currency}`
          : formatCurrency(unitPrice * quantity, currency)}
        </div>
      {quantity > 1 && unitPrice !== null && (
        <div className="text-xs text-muted-foreground">
          {formatCurrency(unitPrice, currency)} each
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
          <span>{missingMarketPrice ? 'Incomplete' : formatCurrency(subtotal, currency)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Shipping</span>
          <span className="text-green-600 font-medium">FREE</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Tax (est.)</span>
          <span>{missingMarketPrice ? 'Price required' : estimatedTax === null ? 'Not configured' : formatCurrency(estimatedTax, currency)}</span>
        </div>
        <div className="border-t border-dashed pt-3 flex justify-between font-black text-lg">
          <span>Total</span>
          <span>{estimatedTotal === null ? 'Not available' : formatCurrency(estimatedTotal, currency)}</span>
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
              updateShippingField('name', e.target.value)
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
              updateShippingField('address', e.target.value)
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
              updateShippingField('city', e.target.value)
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
              updateShippingField('zip', e.target.value)
            }
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />

          <input
            required
            maxLength={2}
            pattern="[A-Za-z]{2}"
            autoComplete="country"
            placeholder="ISO country code (e.g. PK or US)"
            value={shippingAddress.country}
            onChange={(e) =>
              updateShippingField('country', e.target.value)
            }
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />

          <fieldset className="space-y-2">
            <legend className="font-semibold text-sm">Payment method · {countryCode === 'PK' ? 'Pakistan / PKR' : 'International / USD'}</legend>
            <label className="flex items-center gap-2 rounded-lg border p-3 text-sm cursor-pointer">
              <input
                type="radio"
                name="paymentMethod"
                value="cash_on_delivery"
                checked={paymentMethod === 'cash_on_delivery'}
                onChange={() => setPaymentMethod('cash_on_delivery')}
                disabled={!codAvailable}
              />
              Cash on Delivery {!codAvailable && '(not available for this destination)'}
            </label>
            <label className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${manualPaymentAvailable || paymentAccountsLoading || !user ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
              <input
                type="radio"
                name="paymentMethod"
                value="manual_payment"
                checked={paymentMethod === 'manual_payment'}
                onChange={() => setPaymentMethod('manual_payment')}
                disabled={!manualPaymentAvailable && !paymentAccountsLoading && Boolean(user?.emailVerified)}
              />
              Manual Payment {manualPaymentAvailable ? '(seller verifies receipt)' : paymentAccountsLoading ? '(loading seller accounts)' : '(not available for every seller)'}
            </label>
          </fieldset>
          {paymentMethod === 'manual_payment' && paymentAccountsLoading && <p className="text-sm text-muted-foreground">Loading enabled payment accounts for the sellers in your cart…</p>}
          {paymentMethod === 'manual_payment' && !paymentAccountsLoading && !manualPaymentAvailable && (
            <p role="alert" className="text-sm text-amber-800">Manual payment is unavailable because at least one seller has no enabled payment account.</p>
          )}
          {taxRate === null && <p role="alert" className="text-sm text-amber-800">Checkout is unavailable because the operator has not configured the {currency} tax policy. No tax rate is assumed.</p>}
          {missingMarketPrice && <p role="alert" className="text-sm text-amber-800">One or more cart items have no verified {currency} price. Ask the seller to add a market price or select a different delivery destination.</p>}

          {paymentMethod === 'manual_payment' && checkoutSellers
            .filter((seller) => cartSellerIds.includes(seller.sellerId))
            .map((seller) => {
              const selectedAccount = findEnabledPaymentAccount(
                seller.accounts,
                selectedPaymentAccountIds[seller.sellerId] || '',
              );
              return (
                <section key={seller.sellerId} className="space-y-3 rounded-xl border p-3">
                  <div>
                    <h4 className="font-semibold">{seller.sellerName || 'Seller'}</h4>
                    <p className="text-sm text-muted-foreground">
                      Estimated amount due: {sellerPaymentEstimates[seller.sellerId] === undefined
                        ? 'Not available'
                        : formatCurrency(sellerPaymentEstimates[seller.sellerId], currency)}
                    </p>
                  </div>
                  <label className="block space-y-1 text-sm">
                    <span>Payment account</span>
                    <select
                      aria-label={`Payment account for ${seller.sellerName || seller.sellerId}`}
                      value={selectedPaymentAccountIds[seller.sellerId] || ''}
                      onChange={(event) => {
                        setSelectedPaymentAccountIds((current) => ({
                          ...current,
                          [seller.sellerId]: event.target.value,
                        }));
                      }}
                      className="w-full rounded-lg border bg-background px-3 py-2"
                    >
                      {seller.accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {paymentMethodLabels[account.method]} · {account.accountTitle}
                        </option>
                      ))}
                    </select>
                  </label>
                  {selectedAccount && (
                    <div className="rounded-lg bg-slate-50 p-3 text-sm">
                      <p><strong>{paymentMethodLabels[selectedAccount.method]}</strong> · {selectedAccount.accountTitle}</p>
                      <p>Account/mobile: {selectedAccount.accountNumber}</p>
                      {selectedAccount.iban && <p>IBAN: {selectedAccount.iban}</p>}
                      {selectedAccount.instructions && <p className="mt-1">{selectedAccount.instructions}</p>}
                    </div>
                  )}
                  <label className="block space-y-1 text-sm">
                    <span>Transfer reference for this seller</span>
                    <input
                      required
                      maxLength={120}
                      value={transferReferences[seller.sellerId] || ''}
                      onChange={(event) => {
                        setTransferReferences((current) => ({
                          ...current,
                          [seller.sellerId]: event.target.value,
                        }));
                      }}
                      className="w-full rounded-lg border px-3 py-2"
                    />
                  </label>
                </section>
              );
            })}

          <div className="rounded-lg bg-slate-50 p-3 text-sm">
            <p className="font-semibold">
              {paymentMethod === 'cash_on_delivery' ? 'Pay in cash when delivered' : 'Pay each seller separately'}
            </p>
            <p className="text-muted-foreground mt-1">
              {paymentMethod === 'manual_payment'
                ? 'Transfer each seller’s amount separately using that seller’s account. A transfer reference is not proof of receipt; each seller must independently verify the funds before approving their payment.'
                : 'Pay the full order amount in cash when it is delivered.'}
            </p>
            <p className="font-bold mt-2">
              Estimated total: {estimatedTotal === null ? 'Not available' : formatCurrency(estimatedTotal, currency)}
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
            disabled={submitting || Boolean(user && !user.emailVerified) || missingMarketPrice || taxRate === null || (paymentMethod === 'cash_on_delivery' && !codAvailable) || (paymentMethod === 'manual_payment' && Boolean(user) && (!manualPaymentAvailable || paymentAccountsLoading))}
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