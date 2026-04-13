import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Product } from '../types';
import { ShoppingCart, Star, Heart, ShieldCheck, Zap } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { motion } from 'motion/react';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

const CATEGORY_IMAGES: Record<string, string> = {
  food: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80',
  fashion: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600&q=80',
  beauty: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80',
  electronics: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=600&q=80',
  home: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600&q=80',
  books: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&q=80',
};

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const { isInCart } = useCart();
  const inCart = isInCart(product.id);

  const imageUrl = product.images[0]
    || CATEGORY_IMAGES[product.category?.toLowerCase()]
    || `https://picsum.photos/seed/${encodeURIComponent(product.name)}/600/600`;

  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null;

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
      <Card className="overflow-hidden group border border-gray-100 hover:border-primary/30 hover:shadow-2xl transition-shadow duration-300 bg-white h-full flex flex-col">

        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          <Link to={`/products`}>
            <img
              src={imageUrl}
              alt={product.name}
              className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
              referrerPolicy="no-referrer"
              onError={e => {
                (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${product.id}/600/600`;
              }}
            />
          </Link>

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.isHalalCertified && (
              <span className="halal-badge text-[10px] shadow-sm">
                <ShieldCheck className="w-3 h-3" /> Halal
              </span>
            )}
            {discount && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500 text-white shadow-sm">
                <Zap className="w-2.5 h-2.5" /> -{discount}%
              </span>
            )}
          </div>

          {/* Wishlist */}
          <button className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-500">
            <Heart className="w-4 h-4" />
          </button>

          {/* Out of stock overlay */}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="bg-white text-gray-900 font-bold text-sm px-4 py-2 rounded-full">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <CardContent className="p-4 flex-1">
          <Badge variant="secondary" className="text-[10px] mb-2 capitalize">
            {product.category}
          </Badge>
          <h3 className="font-bold text-base line-clamp-2 leading-snug mb-1.5 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <p className="text-muted-foreground text-xs line-clamp-2 leading-relaxed">
            {product.description}
          </p>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mt-3">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${i < Math.round(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200 fill-gray-200'}`}
                />
              ))}
            </div>
            <span className="text-xs font-semibold text-gray-700">{product.rating.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">({product.numReviews.toLocaleString()})</span>
          </div>
        </CardContent>

        {/* Footer */}
        <CardFooter className="p-4 pt-0 flex items-center justify-between gap-2">
          <div>
            <div className="text-xl font-black text-gray-900">
              ${product.price.toFixed(2)}
            </div>
            {product.originalPrice && (
              <div className="text-xs text-muted-foreground line-through">
                ${product.originalPrice.toFixed(2)}
              </div>
            )}
          </div>
          <Button
            id={`add-cart-${product.id}`}
            size="sm"
            onClick={() => onAddToCart?.(product)}
            disabled={product.stock === 0}
            className={`gap-1.5 font-semibold shrink-0 transition-all ${inCart ? 'bg-green-600 hover:bg-green-700' : 'btn-primary-glow'}`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            {inCart ? 'In Cart' : 'Add'}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
