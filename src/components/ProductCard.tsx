
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Tag } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useFavourites } from '../contexts/FavouritesContext';
import { formatCurrency } from '../lib/currency';
import type { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onAddToCart?: () => void;
}

export function ProductCard({
  product,
  onAddToCart,
}: ProductCardProps) {
  const { addToCart } = useCart();
  const { isFavourite, toggleFavourite } = useFavourites();

  const favourite = isFavourite(product.id);
  const productName = product.name || 'Unnamed product';
  const productImage = product.images?.[0];

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart();
    } else {
      addToCart(product);
    }
  };

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="relative aspect-square overflow-hidden bg-slate-100">
        <Link
          to={`/products/${product.id}`}
          aria-label={`View ${productName}`}
          className="block h-full w-full"
        >
          {productImage ? (
            <img
              src={productImage}
              alt={productName}
              loading="lazy"
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              No image available
            </div>
          )}
        </Link>

        <button
          type="button"
          aria-label={
            favourite ? 'Remove from favourites' : 'Add to favourites'
          }
          aria-pressed={favourite}
          title={favourite ? 'Remove from favourites' : 'Add to favourites'}
          onClick={() => void toggleFavourite(product.id)}
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400"
        >
          <Heart
            className={`h-5 w-5 transition-colors ${favourite
                ? 'fill-red-500 text-red-500'
                : 'text-slate-600'
              }`}
          />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        {product.category && (
          <div className="mb-2 flex items-center gap-1 text-xs text-slate-500">
            <Tag className="h-3.5 w-3.5" />
            <span>{product.category}</span>
          </div>
        )}

        <Link
          to={`/products/${product.id}`}
          className="line-clamp-2 font-semibold text-slate-800 transition hover:text-emerald-700"
        >
          {productName}
        </Link>

        {product.description && (
          <p className="mt-2 line-clamp-2 text-sm text-slate-500">
            {product.description}
          </p>
        )}

        <div className="mt-auto pt-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-lg font-bold text-emerald-700">
              {formatCurrency(product.price)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={product.stock != null && product.stock <= 0}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <ShoppingCart className="h-4 w-4" />
            {product.stock != null && product.stock <= 0
              ? 'Out of stock'
              : 'Add to cart'}
          </button>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
