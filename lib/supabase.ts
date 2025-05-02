import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    return SecureStore.deleteItemAsync(key);
  },
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS === 'web' ? localStorage : ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Type definitions for database tables
export type Tables = {
  profiles: {
    Row: {
      id: string;
      phone: string;
      role: 'farmer' | 'buyer' | 'admin';
      name: string;
      location: string | null;
      farm_size: number | null;
      created_at: string;
      updated_at: string;
    };
    Insert: Omit<Tables['profiles']['Row'], 'created_at' | 'updated_at'>;
    Update: Partial<Tables['profiles']['Insert']>;
  };
  products: {
    Row: {
      id: string;
      farmer_id: string;
      name: string;
      description: string;
      price: number;
      quantity: number;
      unit: string;
      category: 'vegetables' | 'fruits' | 'grains' | 'livestock' | 'dairy' | 'other';
      image_url: string;
      is_approved: boolean;
      created_at: string;
      updated_at: string;
    };
    Insert: Omit<Tables['products']['Row'], 'id' | 'created_at' | 'updated_at'>;
    Update: Partial<Tables['products']['Insert']>;
  };
  orders: {
    Row: {
      id: string;
      buyer_id: string;
      items: {
        id: string;
        productId: string;
        name: string;
        price: number;
        quantity: number;
        imageUrl: string;
        farmerId: string;
      }[];
      total: number;
      status: 'pending' | 'paid' | 'delivered' | 'cancelled';
      payment_method: 'orange_money' | 'wave' | 'free_money' | null;
      created_at: string;
      updated_at: string;
    };
    Insert: Omit<Tables['orders']['Row'], 'id' | 'created_at' | 'updated_at'>;
    Update: Partial<Tables['orders']['Insert']>;
  };
  agricultural_inputs: {
    Row: {
      id: string;
      name: string;
      description: string;
      price: number;
      category: 'seeds' | 'fertilizer' | 'pesticide' | 'tools' | 'other';
      image_url: string;
      stock: number;
      created_at: string;
      updated_at: string;
    };
    Insert: Omit<Tables['agricultural_inputs']['Row'], 'id' | 'created_at' | 'updated_at'>;
    Update: Partial<Tables['agricultural_inputs']['Insert']>;
  };
};