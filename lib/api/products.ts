import { supabase } from '@/lib/supabase';
import { Product } from '@/types'; // Assuming Product type is needed/useful for casting

/**
 * Fetches a short list of approved products for testing.
 */
export async function fetchSimpleProductList(): Promise<Partial<Product>[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, price, image_url') // Select minimal fields
      .eq('is_approved', true)        // Only approved products
      .limit(5);                      // Limit to 5 results

    if (error) {
      console.error('Supabase fetch error:', error.message);
      throw error;
    }

    // Map image_url to imageUrl if needed, or adjust the select statement
    // For simplicity here, we assume the caller handles potential mapping
    // or the Product type uses image_url directly.
    // Let's return the raw data for the test, mapping can happen in UI if needed.
    return data || []; // Return fetched data or empty array

  } catch (error) {
    console.error('Error in fetchSimpleProductList:', error);
    // Re-throw the error so the caller can handle it
    throw error;
  }
} 