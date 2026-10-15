import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from 'react';
import {
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    setDoc,
    serverTimestamp,
} from 'firebase/firestore';
import { toast } from 'sonner';
import { db } from '../firebase';
import { useAuth } from './AuthContext';

interface FavouritesContextType {
    favouriteIds: string[];
    loading: boolean;
    isFavourite: (productId: string) => boolean;
    toggleFavourite: (productId: string) => Promise<void>;
}

const FavouritesContext = createContext<
    FavouritesContextType | undefined
>(undefined);

export function FavouritesProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user } = useAuth();
    const [favouriteIds, setFavouriteIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!user) {
            setFavouriteIds([]);
            setLoading(false);
            return;
        }

        setLoading(true);

        const favouritesRef = collection(
            db,
            'users',
            user.uid,
            'favourites'
        );

        const unsubscribe = onSnapshot(
            favouritesRef,
            (snapshot) => {
                setFavouriteIds(snapshot.docs.map((item) => item.id));
                setLoading(false);
            },
            (error) => {
                console.error('Could not load favourites:', error);
                setLoading(false);
                toast.error('Could not load favourites. Check Firestore rules.');
            }
        );

        return unsubscribe;
    }, [user?.uid]);

    const isFavourite = useCallback(
        (productId: string) => favouriteIds.includes(productId),
        [favouriteIds]
    );

    const toggleFavourite = useCallback(
        async (productId: string) => {
            if (!user) {
                toast.info('Please sign in to save favourites.');
                return;
            }

            if (!productId) return;

            const favouriteRef = doc(
                db,
                'users',
                user.uid,
                'favourites',
                productId
            );

            try {
                if (favouriteIds.includes(productId)) {
                    await deleteDoc(favouriteRef);
                    toast.success('Removed from favourites.');
                } else {
                    await setDoc(favouriteRef, {
                        productId,
                        createdAt: serverTimestamp(),
                    });
                    toast.success('Added to favourites.');
                }
            } catch (error) {
                console.error('Could not update favourite:', error);
                toast.error(
                    'Could not update favourites. Check Firestore permissions.'
                );
            }
        },
        [user, favouriteIds]
    );

    return (
        <FavouritesContext.Provider
            value={{
                favouriteIds,
                loading,
                isFavourite,
                toggleFavourite,
            }}
        >
            {children}
        </FavouritesContext.Provider>
    );
}

export function useFavourites() {
    const context = useContext(FavouritesContext);

    if (!context) {
        throw new Error(
            'useFavourites must be used within a FavouritesProvider'
        );
    }

    return context;
}