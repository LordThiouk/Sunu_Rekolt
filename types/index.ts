export type UserRole = 'farmer' | 'buyer' | 'admin';

export interface User {
  id: string;
  phone: string;
  role: UserRole;
  name: string;
  location?: string;
  farmSize?: number; // in hectares
  avatarUrl?: string | null;
  fieldPictureUrl?: string | null;
  bio?: string | null;
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
  image_url: string;
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

export interface OrderItemWithProduct {
  id: string; // order_item id
  order_id: string;
  product_id: string;
  farmer_id: string;
  quantity: number;
  price_at_time: number;
  created_at: string;
  product: {
    name: string;
    image_url: string;
  } | null; // Product might be null if deleted
}

export interface Order {
  id: string;
  buyerId: string;
  items: OrderItemWithProduct[];
  total: number;
  status: 'pending' | 'paid' | 'delivering' | 'delivered' | 'received' | 'cancelled';
  paymentMethod: 'mobile_money' | 'cash' | string;
  createdAt: string;
  delivery_address?: string | null;
  delivery_details?: string | null;
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