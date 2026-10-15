
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { Heart } from 'lucide-react';
import { db } from '../firebase';
import { Product } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useFavourites } from '../contexts/FavouritesContext';
import { ProductCard } from '../components/ProductCard';

export default function Favourites() {
    const { user } = useAuth();
    const { addToCart } = useCart();
    const { favouriteIds, loading: favouritesLoading } = useFavourites();
    const [products, setProducts] = useState<Product[]>([]);
    const [productsLoading, setProductsLoading] = useState(true);

    useEffect(() => {
        const productsQuery = query(
            collection(db, 'products'),
            where('published', '==', true)
        );

        const unsubscribe = onSnapshot(
            productsQuery,
            (snapshot) => {
                const allProducts = snapshot.docs.map((item) => {
                    const data = item.data();

                    return {
                        ...data,
                        id: item.id,
                        name: typeof data.name === 'string' ? data.name : 'Unnamed product',
                        description: typeof data.description === 'string' ? data.description : '',
                        category: typeof data.category === 'string' ? data.category : '',
                        price: Number(data.price) || 0,
                        rating: Number(data.rating) || 0,
                        numReviews: Number(data.numReviews) || 0,
                    } as Product;
                });

                setProducts(allProducts);
                setProductsLoading(false);
            },
            (error) => {
                console.error('Could not load favourite products:', error);
                setProducts([]);
                setProductsLoading(false);
            }
        );

        return unsubscribe;
    }, []);

    const favouriteProducts = products.filter((product) =>
        favouriteIds.includes(product.id)
    );

    if (!user) {
        return (
            <section className="mx-auto max-w-3xl px-4 py-20 text-center">
                <Heart className="mx-auto mb-4 h-12 w-12 text-red-400" />
                <h1 className="text-2xl font-black">Your Favourites</h1>
                <p className="mt-2 text-muted-foreground">
                    Sign in to view and save your favourite products.
                </p>
                <p className="mt-5">
                    <Link to="/products" className="text-primary underline">
                        Browse products
                    </Link>
                </p>
            </section>
        );
    }

    if (favouritesLoading || productsLoading) {
        return (
            <div className="mx-auto max-w-7xl px-4 py-16">
                <p className="text-muted-foreground">Loading your favourites...</p>
            </div>
        );
    }

    return (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-center gap-3">
                <Heart className="h-7 w-7 fill-red-500 text-red-500" />
                <div>
                    <h1 className="text-3xl font-black">My Favourites</h1>
                    <p className="text-sm text-muted-foreground">
                        {favouriteProducts.length} saved product(s)
                    </p>
                </div>
            </div>

            {favouriteProducts.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-12 text-center">
                    <Heart className="mx-auto mb-4 h-10 w-10 text-gray-300" />
                    <h2 className="text-xl font-bold">No favourites yet</h2>
                    <p className="mt-2 text-muted-foreground">
                        Tap the heart on a product to save it here.
                    </p>
                    <Link
                        to="/products"
                        className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                        Explore products
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {favouriteProducts.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            onAddToCart={() => addToCart(product)}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
