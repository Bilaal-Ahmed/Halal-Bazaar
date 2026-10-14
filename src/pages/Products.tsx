import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { db } from '../firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { Product, CATEGORIES } from '../types';
import { ProductCard } from '../components/ProductCard';
import { Skeleton } from '../../components/ui/skeleton';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Slider } from '../../components/ui/slider';
import { toast } from 'sonner';
import { Search, SlidersHorizontal, X, LayoutGrid, List } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useCart } from '../contexts/CartContext';
import { motion } from 'motion/react';

type SortOption = 'newest' | 'price-asc' | 'price-desc';

export default function Products() {
  const [searchParams] = useSearchParams();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState(searchParams.get('category') || 'all');
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [sort, setSort] = useState<SortOption>('newest');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) setCategory(cat);
  }, [searchParams]);

  useEffect(() => {
    const q = query(
      collection(db, 'products'),
      where('published', '==', true),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prods = snapshot.docs.map(doc => ({
        id: doc.id,
        rating: 0,
        numReviews: 0,
        ...doc.data(),
      } as Product));
      setProducts(prods);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching products:', error);
      toast.error('Could not load published product listings.');
      setProducts([]);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredProducts = useMemo(() => {
    let filtered = products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = category === 'all' || p.category === category;
      const matchPrice = p.price >= priceRange[0] && p.price <= priceRange[1];
      return matchSearch && matchCat && matchPrice;
    });

    if (sort === 'price-asc') filtered = [...filtered].sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') filtered = [...filtered].sort((a, b) => b.price - a.price);
    else filtered = [...filtered].sort((a, b) => {
      const createdAt = (value: Product['createdAt']) => value?.toMillis?.() ?? new Date(value || 0).getTime();
      return createdAt(b.createdAt) - createdAt(a.createdAt);
    });
    return filtered;
  }, [products, searchQuery, category, priceRange, sort]);

  const resetFilters = () => {
    setSearchQuery('');
    setCategory('all');
    setPriceRange([0, 500]);
    setSort('newest');
  };

  const activeFilterCount = [
    searchQuery !== '',
    category !== 'all',
    priceRange[0] !== 0 || priceRange[1] !== 500,
  ].filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black">All Products</h1>
          <p className="text-muted-foreground mt-1">
            {filteredProducts.length} published product listing{filteredProducts.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Search + Filter bar */}
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="product-search"
              placeholder="Search products…"
              className="pl-10 h-10"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button
            id="filter-toggle-btn"
            variant="outline"
            className="md:hidden gap-2 h-10"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge className="h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <aside className={`lg:col-span-1 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6 sticky top-20">
            <div className="flex items-center justify-between">
              <h2 className="font-black text-lg flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-primary" /> Filters
              </h2>
              {activeFilterCount > 0 && (
                <button onClick={resetFilters} className="text-xs text-red-500 hover:text-red-600 font-semibold">
                  Clear all ({activeFilterCount})
                </button>
              )}
            </div>

            {/* Sort */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">Sort By</label>
              <Select value={sort} onValueChange={v => setSort(v as SortOption)}>
                <SelectTrigger id="sort-select" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price-asc">Price: Low → High</SelectItem>
                  <SelectItem value="price-desc">Price: High → Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">Category</label>
              <div className="space-y-1">
                {[{ name: 'All Categories', slug: 'all', icon: '🛍️' }, ...CATEGORIES].map(cat => (
                  <button
                    key={cat.slug}
                    id={`filter-cat-${cat.slug}`}
                    onClick={() => setCategory(cat.slug)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors text-left ${
                      category === cat.slug
                        ? 'bg-primary text-white'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold">Price Range</label>
                <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded-lg text-gray-700">
                  ${priceRange[0]} – ${priceRange[1]}
                </span>
              </div>
              <Slider
                id="price-slider"
                value={priceRange}
                max={500}
                step={5}
                onValueChange={(value) => {
                  setPriceRange(
                    typeof value === 'number' ? [value, value] : [...value]
                  );
                }}
                className="mt-2"
              />
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-square rounded-2xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center gap-4">
              <div className="text-6xl">🔍</div>
              <div className="space-y-1">
                <p className="font-bold text-lg">No products found</p>
                <p className="text-sm text-muted-foreground">Try adjusting your filters or search query.</p>
              </div>
              <Button variant="outline" onClick={resetFilters} id="clear-filters-btn">
                Clear all filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredProducts.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.4) }}
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
