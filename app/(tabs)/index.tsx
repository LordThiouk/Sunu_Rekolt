import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Search, Filter, Plus } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Product, ProductCategory, PRODUCT_CATEGORIES } from '@/types';
import ProductCard from '@/components/ProductCard';
import Button from '@/components/Button';
import { useAuth } from '@/context/AuthContext';
import Colors from '@/constants/Colors';

export default function CatalogScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('products')
        .select('*, profiles(name)')
        .eq('is_approved', true)
        .order('created_at', { ascending: false });
      
      if (selectedCategory && selectedCategory !== 'other') {
        query = query.eq('category', selectedCategory);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      if (data) {
        const formattedProducts: Product[] = data.map(item => {
          return {
            id: item.id,
            name: item.name,
            description: item.description,
            price: item.price,
            quantity: item.quantity,
            unit: item.unit,
            category: item.category,
            imageUrl: item.image_url,
            farmerId: item.farmer_id,
            farmerName: item.profiles ? item.profiles.name : 'Agriculteur inconnu',
            isApproved: item.is_approved,
            createdAt: item.created_at,
          };
        });
        
        setProducts(formattedProducts);
      }
    } catch (error) {
      console.error('Error in fetchProducts mapping or query:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCategorySelect = (category: ProductCategory | null) => {
    setSelectedCategory(category);
  };

  const navigateToAddProduct = () => {
    router.push('/(tabs)/product/add');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Search size={20} color={Colors.neutral[500]} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher des produits..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.neutral[400]}
          />
        </View>
        
        {user?.role === 'farmer' && (
          <Button
            title="Ajouter"
            onPress={navigateToAddProduct}
            size="small"
            icon={<Plus size={18} color="#fff" />}
            style={styles.addButton}
          />
        )}
      </View>
      
      <View style={styles.categoriesContainer}>
        <ScrollableCategories
          selectedCategory={selectedCategory}
          onSelectCategory={handleCategorySelect}
        />
      </View>
      
      {loading ? (
        <ActivityIndicator 
          size="large" 
          color={Colors.primary.DEFAULT}
          style={styles.loader} 
        />
      ) : filteredProducts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            Aucun produit trouvé
          </Text>
          <Button
            title="Rafraîchir"
            onPress={fetchProducts}
            variant="outline"
          />
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ProductCard product={item} />}
          contentContainerStyle={styles.productsList}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

function ScrollableCategories({ 
  selectedCategory, 
  onSelectCategory 
}: { 
  selectedCategory: ProductCategory | null, 
  onSelectCategory: (category: ProductCategory | null) => void 
}) {
  return (
    <FlatList
      horizontal
      data={['all', ...PRODUCT_CATEGORIES]}
      keyExtractor={(item) => item}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[
            styles.categoryButton,
            (item === 'all' && selectedCategory === null) || item === selectedCategory
              ? styles.categoryButtonActive
              : {}
          ]}
          onPress={() => onSelectCategory(item === 'all' ? null : item as ProductCategory)}
        >
          <Text
            style={[
              styles.categoryButtonText,
              (item === 'all' && selectedCategory === null) || item === selectedCategory
                ? styles.categoryButtonTextActive
                : {}
            ]}
          >
            {item === 'all' ? 'Tous' : 
              item === 'vegetables' ? 'Légumes' : 
              item === 'fruits' ? 'Fruits' : 
              item === 'grains' ? 'Céréales' : 
              item === 'livestock' ? 'Élevage' : 
              item === 'dairy' ? 'Laitier' : 
              'Autres'}
          </Text>
        </TouchableOpacity>
      )}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.categoriesList}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[100],
  },
  header: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: Colors.primary.DEFAULT,
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.neutral.white,
    borderRadius: 8,
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: Colors.neutral[800],
  },
  addButton: {
    marginLeft: 12,
    height: 40,
  },
  categoriesContainer: {
    backgroundColor: Colors.neutral.white,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: Colors.neutral.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoriesList: {
    paddingHorizontal: 16,
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
  productsList: {
    padding: 16,
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
  emptyStateText: {
    fontSize: 18,
    color: Colors.neutral[600],
    marginBottom: 16,
    textAlign: 'center',
  },
});