export type UserRole = 'buyer' | 'seller' | 'admin';
export type UserStatus = 'pending' | 'approved' | 'rejected';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  createdAt: any;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  sellerId: string;
  images: string[];
  rating: number;
  numReviews: number;
  createdAt: any;
}

export interface Order {
  id: string;
  buyerId: string;
  items: any[];
  totalAmount: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered';
  createdAt: any;
}
