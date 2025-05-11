import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  FlatList, 
  ActivityIndicator, 
  TouchableOpacity,
  Image
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import Colors from '@/constants/Colors';
import Button from '@/components/Button'; // Assuming you have a Button component
import { Product } from '@/types'; // Assuming you have a Product type

// Define a more specific type for products listed by the farmer, including approval status
interface FarmerProduct extends Product {
  is_approved: boolean;
  // Add any other farmer-specific fields if needed
}

export default function MyProductsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [products, setProducts] = useState<FarmerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMyProducts = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('products')
        .select('*') // Select all fields for now, adjust as needed
        .eq('farmer_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }
      
      setProducts(data as FarmerProduct[] || []);
    } catch (e: any) {
      console.error("Error fetching farmer's products:", e);
      setError(e.message || 'Failed to fetch products.');
      setProducts([]); // Clear products on error
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchMyProducts();
    }, [fetchMyProducts])
  );

  const navigateToAddProduct = () => {
    router.push('/(tabs)/product/add');
  };

  const getStatusText = (isApproved: boolean | null) => {
    if (isApproved === true) return 'Approuvé';
    if (isApproved === false) return 'En attente'; // Or 'Rejeté' if you have that distinct status
    return 'Indéterminé'; // Fallback for null or undefined status
  };

  const getStatusColor = (isApproved: boolean | null) => {
    if (isApproved === true) return Colors.success.DEFAULT;
    if (isApproved === false) return Colors.warning.DEFAULT;
    return Colors.neutral[500];
  };


  const renderProductItem = ({ item }: { item: FarmerProduct }) => (
    <View style={styles.productItem}>
      <Image 
        source={{ uri: item.image_url || 'https://placehold.co/600x400/EEE/31343C?text=Image+Produit' }} 
        style={styles.productImage} 
      />
      <View style={styles.productDetails}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productInfo}>Prix: {item.price} FCFA</Text>
        <Text style={styles.productInfo}>Quantité: {item.quantity} {item.unit}</Text>
        <View style={styles.statusContainer}>
          <Text style={styles.productInfo}>Statut: </Text>
          <Text style={[styles.statusText, { color: getStatusColor(item.is_approved) }]}>
            {getStatusText(item.is_approved)}
          </Text>
        </View>
      </View>
      {/* Add action buttons (Edit, Delete) here later */}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator size="large" color={Colors.primary.DEFAULT} />
          <Text style={styles.loadingText}>Chargement de vos produits...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, styles.centered]}>
          <Feather name="alert-circle" size={40} color={Colors.error.DEFAULT} />
          <Text style={styles.errorText}>Erreur: {error}</Text>
          <Button title="Réessayer" onPress={fetchMyProducts} style={{marginTop: 20}} />
        </View>
      </SafeAreaView>
    );
  }
  
  if (products.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, styles.centered]}>
          <Feather name="package" size={48} color={Colors.neutral[400]} style={{marginBottom:16}}/>
          <Text style={styles.title}>Mes Produits</Text>
          <Text style={styles.placeholder}>Vous n'avez pas encore de produits.</Text>
          <Text style={styles.placeholder}>Ajoutez votre premier produit pour commencer à vendre !</Text>
          <Button 
            title="Ajouter un produit" 
            onPress={navigateToAddProduct} 
            style={{marginTop: 20, paddingHorizontal: 20}}
            icon={<Feather name="plus-circle" size={18} color={Colors.neutral.white} style={{marginRight: 8}}/>}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Mes Produits</Text>
        <TouchableOpacity onPress={navigateToAddProduct} style={styles.addButton}>
            <Feather name="plus" size={24} color={Colors.neutral.white} />
        </TouchableOpacity>
      </View>
      <FlatList
        data={products}
        renderItem={renderProductItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContentContainer}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.neutral[100],
  },
  container: {
    flex: 1,
    // padding: 20, // Padding applied in listContentContainer or specific sections
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: Colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'BalooBhai2_600SemiBold',
    color: Colors.primary.DEFAULT,
  },
  addButton: {
    backgroundColor: Colors.primary.DEFAULT,
    padding: 8,
    borderRadius: 20,
  },
  title: { // Used for centered empty state
    fontSize: 24,
    fontFamily: 'BalooBhai2_600SemiBold',
    color: Colors.neutral[800],
    marginBottom: 10,
  },
  placeholder: {
    fontSize: 16,
    fontFamily: 'BalooBhai2_400Regular',
    color: Colors.neutral[600],
    textAlign: 'center',
    marginBottom: 8,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: 'BalooBhai2_400Regular',
    color: Colors.neutral[600],
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: 'BalooBhai2_400Regular',
    color: Colors.error.DEFAULT,
    textAlign: 'center',
  },
  listContentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  productItem: {
    backgroundColor: Colors.neutral.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: Colors.neutral.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 17,
    fontFamily: 'BalooBhai2_600SemiBold',
    color: Colors.neutral[800],
    marginBottom: 4,
  },
  productInfo: {
    fontSize: 14,
    fontFamily: 'BalooBhai2_400Regular',
    color: Colors.neutral[600],
    marginBottom: 3,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'BalooBhai2_500Medium',
    // color is set dynamically
  },
}); 