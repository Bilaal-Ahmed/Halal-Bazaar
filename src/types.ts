export type UserRole = 'buyer' | 'seller' | 'admin';
export type UserStatus = 'pending' | 'approved' | 'rejected' | 'suspended' | 'restricted';

export interface DeliveryAddress {
  id: string;
  label: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  status: UserStatus;
  phone?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  defaultAddress?: string;
  addresses?: DeliveryAddress[];
  storeName?: string;
  storeDescription?: string;
  sellerContactPhone?: string;
  businessAddress?: string;
  businessCity?: string;
  sellerApplication?: {
    status: 'pending' | 'approved' | 'rejected';
    submittedAt?: any;
    reason?: string;
  };
  createdAt: any;
  updatedAt?: any;
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
  published?: boolean;
  createdAt: any;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  buyerId: string;
  items: Array<{
    product: Pick<Product, 'id' | 'name' | 'price' | 'category' | 'images' | 'sellerId' | 'sellerName'>;
    quantity: number;
    lineTotal: number;
  }>;
  sellerIds: string[];
  currency: string;
  totalAmount: number;
  subtotal: number;
  taxAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: 'cash_on_delivery' | 'bank_transfer' | 'jazzcash' | 'easypaisa';
  paymentStatus: 'unpaid' | 'pending_review' | 'paid' | 'rejected';
  transferReference?: string;
  fulfillmentBySeller?: Record<string, { status: string; updatedAt?: any }>;
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
