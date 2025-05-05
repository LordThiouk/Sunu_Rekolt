import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { AgriculturalInput } from '@/types';
import Button from '@/components/Button';
import { Feather } from '@expo/vector-icons'; // Add Feather
import { useCart } from '@/context/CartContext';
import Colors from '@/constants/Colors';

export default function ShopScreen() {
  const [inputs, setInputs] = useState<AgriculturalInput[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { addItem } = useCart();

  const categories = [
    { id: 'seeds', name: 'Semences' },
    { id: 'fertilizer', name: 'Engrais' },
    { id: 'pesticide', name: 'Pesticides' },
    { id: 'tools', name: 'Outils' },
    { id: 'other', name: 'Autres' },
  ];

  useEffect(() => {
    fetchInputs();
  }, [selectedCategory]);

  const fetchInputs = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('agricultural_inputs')
        .select('*')
        .order('name');
      
      if (selectedCategory) {
        query = query.eq('category', selectedCategory);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      if (data) {
        const formattedInputs: AgriculturalInput[] = data.map(item => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category,
          imageUrl: item.image_url,
          stock: item.stock,
        }));
        
        setInputs(formattedInputs);
      }
    } catch (error) {
      console.error('Error fetching agricultural inputs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (input: AgriculturalInput) => {
    addItem({
      id: `cart-${Date.now()}`,
      productId: input.id,
      name: input.name,
      price: input.price,
      quantity: 1,
      imageUrl: input.imageUrl,
      farmerId: 'shop', // Special ID for shop items
    });
  };

  const renderCategoryFilter = () => (
    <FlatList
      horizontal
      data={[{ id: null, name: 'Tous' }, ...categories]}
      keyExtractor={(item) => item.id || 'all'}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[
            styles.categoryButton, 
            selectedCategory === item.id && styles.categoryButtonActive
          ]}
          onPress={() => setSelectedCategory(item.id)}
        >
          <Text 
            style={[
              styles.categoryButtonText, 
              selectedCategory === item.id && styles.categoryButtonTextActive
            ]}
          >
            {item.name}
          </Text>
        </TouchableOpacity>
      )}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.categoriesList}
    />
  );

  const renderInputItem = ({ item }: { item: AgriculturalInput }) => (
    <View style={styles.inputCard}>
      <Image source={{ uri: item.imageUrl }} style={styles.inputImage} />
      <View style={styles.inputContent}>
        <Text style={styles.inputName}>{item.name}</Text>
        <Text style={styles.inputPrice}>{item.price.toLocaleString()} CFA</Text>
        <Text style={styles.inputDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <Button
          title="Ajouter au panier"
          onPress={() => handleAddToCart(item)}
          size="small"
          icon={<Feather name="shopping-bag" size={16} color="#fff" />} // Use Feather
          style={styles.addButton}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Boutique d'intrants</Text>
        <Text style={styles.subtitle}>
          Tout ce dont vous avez besoin pour votre exploitation
        </Text>
      </View>
      
      {renderCategoryFilter()}
      
      {loading ? (
        <ActivityIndicator 
          size="large" 
          color={Colors.primary.DEFAULT} 
          style={styles.loader} 
        />
      ) : inputs.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            Aucun intrant disponible dans cette catégorie
          </Text>
          <Button 
            title="Rafraîchir" 
            onPress={fetchInputs} 
            variant="outline" 
          />
        </View>
      ) : (
        <FlatList
          data={inputs}
          keyExtractor={(item) => item.id}
          renderItem={renderInputItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.inputsList}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[100],
  },
  header: {
    padding: 16,
    backgroundColor: Colors.primary.DEFAULT,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.neutral.white,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.neutral[100],
  },
  categoriesList: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.neutral.white,
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: Colors.neutral[200],
  },
  categoryButtonActive: {
    backgroundColor: Colors.primary.DEFAULT,
  },
  categoryButtonText: {
    color: Colors.neutral[700],
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: Colors.neutral.white,
  },
  inputsList: {
    padding: 16,
  },
  inputCard: {
    flexDirection: 'row',
    backgroundColor: Colors.neutral.white,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 2,
    shadowColor: Colors.neutral.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputImage: {
    width: 120,
    height: 120,
  },
  inputContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  inputName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral[800],
    marginBottom: 4,
  },
  inputPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary.DEFAULT,
    marginBottom: 6,
  },
  inputDescription: {
    fontSize: 14,
    color: Colors.neutral[600],
    marginBottom: 12,
  },
  addButton: {
    alignSelf: 'flex-start',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.neutral[600],
    marginBottom: 16,
    textAlign: 'center',
  },
});