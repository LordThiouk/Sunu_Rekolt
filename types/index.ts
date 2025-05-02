export type UserRole = 'farmer' | 'buyer' | 'admin';

export interface User {
  id: string;
  phone: string;
  role: UserRole;
  name: string;
  location?: string;
  farmSize?: number; // in hectares
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  unit: string; // kg, ton, bag, etc.
  category: string;
  imageUrl: string;
  farmerId: string;
  farmerName?: string;
  isApproved: boolean;
  createdAt: string;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  farmerId: string;
}

export interface Order {
  id: string;
  buyerId: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'paid' | 'delivering' | 'delivered' | 'received' | 'cancelled';
  paymentMethod: 'mobile_money' | 'cash';
  createdAt: string;
}

export interface AgriculturalInput {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'seeds' | 'fertilizer' | 'pesticide' | 'tools' | 'other';
  imageUrl: string;
  stock: number;
}

export type ProductCategory = 
  | 'vegetables' 
  | 'fruits' 
  | 'grains' 
  | 'livestock' 
  | 'dairy' 
  | 'other';

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  'vegetables',
  'fruits',
  'grains',
  'livestock',
  'dairy',
  'other'
];

export const PRODUCT_UNITS = [
  'kg',
  'ton',
  'bag',
  'sack',
  'dozen',
  'piece',
  'liter'
];