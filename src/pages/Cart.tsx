import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { Button } from '../../components/ui/button';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Cart() {
  const { items, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice } = useCart();

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
        <Button id="cart-shop-btn" asChild size="lg" className="btn-primary-glow px-10">
          <Link to="/products">Start Shopping <ArrowRight className="ml-2 w-5 h-5" /></Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black">Shopping Cart</h1>
          <p className="text-muted-foreground mt-1">{totalItems} item{totalItems !== 1 ? 's' : ''} in your cart</p>
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
        {/* Cart Items */}
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
                {/* Image */}
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-50 shrink-0">
                  <img
                    src={product.images[0] || `https://picsum.photos/seed/${product.id}/200/200`}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={e => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${product.id}/200/200`; }}
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-sm line-clamp-2 leading-snug">{product.name}</h3>
                      <p className="text-xs text-muted-foreground capitalize mt-0.5">{product.category}</p>
                      {product.isHalalCertified && (
                        <span className="halal-badge text-[9px] mt-1 inline-flex">
                          <ShieldCheck className="w-3 h-3" /> Halal
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => removeFromCart(product.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors shrink-0 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    {/* Quantity control */}
                    <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-1">
                      <button
                        id={`qty-dec-${product.id}`}
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                        className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-gray-100 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-bold w-6 text-center">{quantity}</span>
                      <button
                        id={`qty-inc-${product.id}`}
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                        disabled={quantity >= product.stock}
                        className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-40"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      <div className="font-black text-base">${(product.price * quantity).toFixed(2)}</div>
                      {quantity > 1 && (
                        <div className="text-xs text-muted-foreground">${product.price.toFixed(2)} each</div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <Button asChild variant="outline" className="w-full gap-2 mt-4">
            <Link to="/products">← Continue Shopping</Link>
          </Button>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-20">
            <h2 className="text-xl font-black mb-6">Order Summary</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal ({totalItems} items)</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span className="text-green-600 font-medium">FREE</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tax (est.)</span>
                <span>${(totalPrice * 0.05).toFixed(2)}</span>
              </div>
              <div className="border-t border-dashed pt-3 flex justify-between font-black text-lg">
                <span>Total</span>
                <span>${(totalPrice * 1.05).toFixed(2)}</span>
              </div>
            </div>

            <Button
              id="checkout-btn"
              size="lg"
              className="w-full mt-6 btn-primary-glow font-bold text-base h-13"
            >
              Proceed to Checkout <ArrowRight className="ml-2 w-4 h-4" />
            </Button>

            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>Secure, encrypted checkout</span>
            </div>

            {/* Payment icons */}
            <div className="mt-5 pt-4 border-t flex items-center justify-center gap-3">
              {['VISA', 'MC', 'AMEX', 'JazzCash', 'EasyPaisa'].map(p => (
                <span key={p} className="text-[9px] font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded">
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
