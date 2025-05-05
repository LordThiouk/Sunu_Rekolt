import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types';
import Button from '@/components/Button';
import { useCart } from '@/context/CartContext';
import { Feather } from '@expo/vector-icons';
import Colors from '@/constants/Colors';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const { addItem } = useCart();
  const router = useRouter();

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*, profiles(name)')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setProduct({
          id: data.id,
          name: data.name,
          description: data.description,
          price: data.price,
          quantity: data.quantity,
          unit: data.unit,
          category: data.category,
          imageUrl: data.image_url,
          farmerId: data.farmer_id,
          farmerName: data.profiles ? data.profiles.name : 'Agriculteur inconnu',
          isApproved: data.is_approved,
          createdAt: data.created_at,
        });
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      Alert.alert('Erreur', 'Impossible de charger le produit');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    setAddingToCart(true);
    try {
      addItem({
        id: `cart-${Date.now()}`,
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        imageUrl: product.imageUrl,
        farmerId: product.farmerId,
      });
      
      Alert.alert(
        'Ajouté au panier',
        `${product.name} a été ajouté à votre panier.`,
        [
          { text: 'Continuer mes achats', style: 'cancel' },
          { text: 'Voir mon panier', onPress: () => router.push('/(tabs)/cart') }
        ]
      );
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'ajouter au panier');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading || !product) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Image
          source={{ uri: product.imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />

        <View style={styles.backButton}>
          <Button
            title=""
            onPress={() => router.back()}
            variant="primary"
            size="small"
            icon={<Feather name="arrow-left" size={20} color="#fff" />}
            style={styles.backButtonInner}
          />
        </View>

        <View style={styles.content}>
          <Text style={styles.name}>{product.name}</Text>
          
          <View style={styles.priceRow}>
            <Text style={styles.price}>
              {product.price.toLocaleString()} CFA
              <Text style={styles.unit}>/{product.unit}</Text>
            </Text>
            <Text style={styles.stock}>
              Stock: {product.quantity} {product.unit}
            </Text>
          </View>
          
          <View style={styles.farmerContainer}>
            <Text style={styles.farmerLabel}>Vendeur:</Text>
            <Text style={styles.farmerName}>{product.farmerName}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Détails</Text>
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Catégorie</Text>
                <Text style={styles.detailValue}>
                  {product.category === 'vegetables' ? 'Légumes' : 
                   product.category === 'fruits' ? 'Fruits' : 
                   product.category === 'grains' ? 'Céréales' : 
                   product.category === 'livestock' ? 'Élevage' : 
                   product.category === 'dairy' ? 'Laitier' : 
                   'Autres'}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Disponibilité</Text>
                <Text style={styles.detailValue}>
                  {product.quantity > 0 ? 'En stock' : 'Épuisé'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Ajouter au panier"
          onPress={handleAddToCart}
          loading={addingToCart}
          disabled={product.quantity <= 0}
          icon={<Feather name="shopping-bag" size={20} color="#fff" />}
          iconPosition="left"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 300,
  },
  backButton: {
    position: 'absolute',
    top: 48,
    left: 16,
    zIndex: 10,
  },
  backButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 0,
  },
  content: {
    padding: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.neutral[800],
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  price: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.primary.DEFAULT,
  },
  unit: {
    fontSize: 16,
    fontWeight: '400',
    color: Colors.neutral[600],
  },
  stock: {
    fontSize: 16,
    color: Colors.neutral[600],
  },
  farmerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[200],
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
    marginBottom: 16,
  },
  farmerLabel: {
    fontSize: 16,
    color: Colors.neutral[600],
    marginRight: 8,
  },
  farmerName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral[800],
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral[800],
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.neutral[700],
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailItem: {
    width: '50%',
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.neutral[600],
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.neutral[800],
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[200],
    backgroundColor: Colors.neutral.white,
  },
});