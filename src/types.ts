export type UserRole = 'buyer' | 'seller' | 'admin';
export type UserStatus = 'pending' | 'approved' | 'rejected';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: any;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  stock: number;
  sellerId: string;
  sellerName?: string;
  images: string[];
  rating: number;
  numReviews: number;
  isHalalCertified?: boolean;
  tags?: string[];
  createdAt: any;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  buyerId: string;
  items: CartItem[];
  totalAmount: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered';
  shippingAddress?: {
    name: string;
    address: string;
    city: string;
    zip: string;
    country: string;
  };
  createdAt: any;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: any;
}

export const CATEGORIES = [
  {
    name: 'Food & Groceries',
    slug: 'food',
    icon: '🥘',
    image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80',
    desc: 'Halal-certified fresh & packaged foods',
  },
  {
    name: 'Fashion',
    slug: 'fashion',
    icon: '👗',
    image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600&q=80',
    desc: 'Modest & trendy clothing for everyone',
  },
  {
    name: 'Beauty & Care',
    slug: 'beauty',
    icon: '✨',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80',
    desc: 'Natural & halal-certified cosmetics',
  },
  {
    name: 'Electronics',
    slug: 'electronics',
    icon: '📱',
    image: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=600&q=80',
    desc: 'Latest gadgets & tech accessories',
  },
  {
    name: 'Home & Living',
    slug: 'home',
    icon: '🏡',
    image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600&q=80',
    desc: 'Elegant decor & home essentials',
  },
  {
    name: 'Books & Learning',
    slug: 'books',
    icon: '📚',
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&q=80',
    desc: 'Islamic & educational literature',
  },
];

export const SAMPLE_PRODUCTS: Product[] = [
  {
    id: 'sample-1',
    name: 'Organic Medjool Dates',
    description: 'Premium, juicy Medjool dates grown in the finest palm groves. Rich in natural sugars and nutrients. Perfect for Ramadan and everyday snacking.',
    price: 24.99,
    originalPrice: 32.99,
    category: 'food',
    stock: 50,
    sellerId: 'demo',
    images: ['https://images.unsplash.com/photo-1604869515882-4d10fa4b0492?w=600&q=80'],
    rating: 4.8,
    numReviews: 128,
    isHalalCertified: true,
    createdAt: new Date(),
  },
  {
    id: 'sample-2',
    name: 'Premium Hijab Collection',
    description: 'Luxuriously soft chiffon hijabs available in 20 stunning colors. Lightweight, breathable, and perfect for everyday wear or special occasions.',
    price: 19.99,
    originalPrice: 29.99,
    category: 'fashion',
    stock: 80,
    sellerId: 'demo',
    images: ['https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=600&q=80'],
    rating: 4.9,
    numReviews: 245,
    isHalalCertified: true,
    createdAt: new Date(),
  },
  {
    id: 'sample-3',
    name: 'Argan Oil Face Serum',
    description: '100% halal-certified, alcohol-free argan oil serum. Deeply moisturizing and anti-aging formula with natural vitamin E. Suitable for all skin types.',
    price: 34.99,
    category: 'beauty',
    stock: 35,
    sellerId: 'demo',
    images: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&q=80'],
    rating: 4.7,
    numReviews: 89,
    isHalalCertified: true,
    createdAt: new Date(),
  },
  {
    id: 'sample-4',
    name: 'Smart Watch Pro',
    description: 'Feature-rich smartwatch with Qibla direction, prayer time alerts, Hijri calendar, and health tracking. Stay connected to your faith and fitness.',
    price: 149.99,
    originalPrice: 199.99,
    category: 'electronics',
    stock: 20,
    sellerId: 'demo',
    images: ['https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=600&q=80'],
    rating: 4.6,
    numReviews: 63,
    createdAt: new Date(),
  },
  {
    id: 'sample-5',
    name: 'Handcrafted Prayer Rug',
    description: 'Beautiful hand-woven prayer rug made from premium wool. Features a stunning mosque design with intricate geometric patterns. Anti-slip backing included.',
    price: 49.99,
    category: 'home',
    stock: 25,
    sellerId: 'demo',
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80'],
    rating: 4.9,
    numReviews: 312,
    isHalalCertified: true,
    createdAt: new Date(),
  },
  {
    id: 'sample-6',
    name: 'Quran Translation & Tafsir',
    description: 'Complete English translation with detailed Tafsir commentary. Beautiful hardcover edition with Arabic text, transliteration, and detailed explanations.',
    price: 39.99,
    category: 'books',
    stock: 60,
    sellerId: 'demo',
    images: ['https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=600&q=80'],
    rating: 5.0,
    numReviews: 451,
    isHalalCertified: true,
    createdAt: new Date(),
  },
];
