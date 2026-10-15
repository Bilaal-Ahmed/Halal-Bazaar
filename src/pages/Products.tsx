import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  collection,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { toast } from 'sonner';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { motion } from 'motion/react';

import { db } from '../firebase';
import { Product, CATEGORIES } from '../types';
import { ProductCard } from '../components/ProductCard';
import { Skeleton } from '../../components/ui/skeleton';
import { Input } from '../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Slider } from '../../components/ui/slider';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useCart } from '../contexts/CartContext';

type SortOption = 'newest' | 'price-asc' | 'price-desc';

const DEFAULT_MAX_PRICE = 5000;

function getTimestamp(value: unknown): number {
  if (
    value &&
    typeof value === 'object' &&
    'toMillis' in value &&
    typeof value.toMillis === 'function'
  ) {
    return value.toMillis();
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const timestamp = new Date(value).getTime();
    return Number.isFinite(timestamp) ? timestamp : 0;
  }

  return 0;
}

export default function Products() {
  const [searchParams] = useSearchParams();
  const { addToCart } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState(
    searchParams.get('category') || 'all'
  );
  const [priceRange, setPriceRange] = useState<number[]>([
    0,
    DEFAULT_MAX_PRICE,
  ]);
  const [sort, setSort] = useState<SortOption>('newest');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const selectedCategory = searchParams.get('category');
    setCategory(selectedCategory || 'all');
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    setLoadError(false);

    const productsQuery = query(
      collection(db, 'products'),
      where('published', '==', true)
    );

    const unsubscribe = onSnapshot(
      productsQuery,
      (snapshot) => {
        console.log(
          '[Products] Firestore documents returned:',
          snapshot.size
        );

        const fetchedProducts = snapshot.docs.map((document) => {
          const data = document.data();

          return {
            ...data,
            id: document.id,
            name:
              typeof data.name === 'string' ? data.name : 'Unnamed product',
            description:
              typeof data.description === 'string'
                ? data.description
                : '',
            category:
              typeof data.category === 'string' ? data.category : '',
            price: Number(data.price) || 0,
            rating: Number(data.rating) || 0,
            numReviews: Number(data.numReviews) || 0,
            createdAt: data.createdAt,
          } as Product;
        });

        console.log(
          '[Products] Published products:',
          fetchedProducts.map((product) => ({
            id: product.id,
            name: product.name,
            price: product.price,
            category: product.category,
          }))
        );

        setProducts(fetchedProducts);
        setLoadError(false);
        setLoading(false);
      },
      (error) => {
        console.error('[Products] Firestore query failed:', {
          code: error.code,
          message: error.message,
        });

        setProducts([]);
        setLoadError(true);
        setLoading(false);

        toast.error(
          error.code === 'permission-denied'
            ? 'You do not have permission to read published products. Check Firestore rules.'
            : 'Could not load products. Please try again.'
        );
      }
    );

    return unsubscribe;
  }, []);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    let filtered = products.filter((product) => {
      const name = product.name.toLowerCase();
      const description = product.description.toLowerCase();

      const matchesSearch =
        name.includes(normalizedSearch) ||
        description.includes(normalizedSearch);

      const matchesCategory =
        category === 'all' || product.category === category;

      const matchesPrice =
        product.price >= priceRange[0] &&
        product.price <= priceRange[1];

      return matchesSearch && matchesCategory && matchesPrice;
    });

    if (sort === 'price-asc') {
      filtered = [...filtered].sort((a, b) => a.price - b.price);
    } else if (sort === 'price-desc') {
      filtered = [...filtered].sort((a, b) => b.price - a.price);
    } else {
      filtered = [...filtered].sort(
        (a, b) =>
          getTimestamp(b.createdAt) - getTimestamp(a.createdAt)
      );
    }

    return filtered;
  }, [products, searchQuery, category, priceRange, sort]);

  const resetFilters = () => {
    setSearchQuery('');
    setCategory('all');
    setPriceRange([0, DEFAULT_MAX_PRICE]);
    setSort('newest');
  };

  const activeFilterCount = [
    searchQuery.trim() !== '',
    category !== 'all',
    priceRange[0] !== 0 ||
      priceRange[1] !== DEFAULT_MAX_PRICE,
  ].filter(Boolean).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-black">All Products</h1>
          <p className="mt-1 text-muted-foreground">
            {loading
              ? 'Loading published products...'
              : `${ filteredProducts.length } published product listing${
  filteredProducts.length !== 1 ? 's' : ''
} `}
          </p>
        </div>

        {/* Search and mobile filters */}
        <div className="flex w-full gap-3 md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              id="product-search"
              placeholder="Search products..."
              className="h-10 pl-10"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />

            {searchQuery && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <Button
            id="filter-toggle-btn"
            variant="outline"
            className="h-10 gap-2 md:hidden"
            onClick={() => setShowFilters((visible) => !visible)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters

            {activeFilterCount > 0 && (
              <Badge className="flex h-4 w-4 items-center justify-center p-0 text-[10px]">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        {/* Filters */}
        <aside
          className={`lg: col - span - 1 ${
  showFilters ? 'block' : 'hidden lg:block'
} `}
        >
          <div className="sticky top-20 space-y-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-black">
                <SlidersHorizontal className="h-4 w-4 text-primary" />
                Filters
              </h2>

              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs font-semibold text-red-500 hover:text-red-600"
                >
                  Clear all ({activeFilterCount})
                </button>
              )}
            </div>

            {/* Sort */}
            <div className="space-y-2">
              <label
                htmlFor="sort-select"
                className="text-sm font-semibold"
              >
                Sort By
              </label>

              <Select
                value={sort}
                onValueChange={(value) =>
                  setSort(value as SortOption)
                }
              >
                <SelectTrigger id="sort-select" className="h-9">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price-asc">
                    Price: Low to High
                  </SelectItem>
                  <SelectItem value="price-desc">
                    Price: High to Low
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <p className="text-sm font-semibold">Category</p>

              <div className="space-y-1">
                {[
                  {
                    name: 'All Categories',
                    slug: 'all',
                    icon: '🛍️',
                  },
                  ...CATEGORIES,
                ].map((item) => (
                  <button
                    key={item.slug}
                    id={`filter - cat - ${ item.slug } `}
                    type="button"
                    aria-pressed={category === item.slug}
                    onClick={() => setCategory(item.slug)}
                    className={`flex w - full items - center gap - 2 rounded - xl px - 3 py - 2 text - left text - sm font - medium transition - colors ${
  category === item.slug
    ? 'bg-primary text-white'
    : 'text-gray-700 hover:bg-gray-50'
} `}
                  >
                    <span>{item.icon}</span>
                    <span>{item.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Price range */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="price-slider"
                  className="text-sm font-semibold"
                >
                  Price Range
                </label>

                <span className="rounded-lg bg-gray-100 px-2 py-1 font-mono text-xs text-gray-700">
                  PKR {priceRange[0].toLocaleString()} –{' '}
                  {priceRange[1].toLocaleString()}
                </span>
              </div>

              <Slider
                id="price-slider"
                value={priceRange}
                min={0}
                max={DEFAULT_MAX_PRICE}
                step={100}
                onValueChange={(value) => {
                  if (typeof value === 'number') {
                    setPriceRange([value, priceRange[1]]);
                    return;
                  }

                  setPriceRange([...value]);
                }}
                className="mt-2"
              />
            </div>
          </div>
        </aside>

        {/* Product grid */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="space-y-3">
                  <Skeleton className="aspect-square rounded-2xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ))}
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-red-200 bg-white py-20 text-center">
              <p className="text-lg font-bold">
                Products could not be loaded
              </p>
              <p className="max-w-md text-sm text-muted-foreground">
                Check the browser console and Firestore read rules, then
                reload the page.
              </p>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Try again
              </Button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-gray-200 bg-white py-20 text-center">
              <div className="text-6xl">🔍</div>

              <div className="space-y-1">
                <p className="text-lg font-bold">No products found</p>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your filters or search query.
                </p>
              </div>

              <Button
                variant="outline"
                onClick={resetFilters}
                id="clear-filters-btn"
              >
                Clear all filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: Math.min(index * 0.04, 0.4),
                  }}
                >
                  <ProductCard
                    product={product}
                    onAddToCart={() => addToCart(product)}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}