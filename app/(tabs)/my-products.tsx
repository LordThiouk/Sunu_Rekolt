import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  FlatList, 
  ActivityIndicator, 
  TouchableOpacity,
  Image,
  Alert
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter, useFocusEffect, Href } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import Colors from '@/constants/Colors';
import Button from '@/components/Button'; // Assuming you have a Button component
import { Product } from '@/types'; // Assuming you have a Product type

// Define a more specific type for products listed by the farmer, including approval status
interface FarmerProduct extends Product {
  is_approved: boolean;
  is_archived: boolean; // Ensure it's here if not automatically inherited by all uses
}

// Define filter types
type StatusFilter = 'all' | 'pending' | 'approved' | 'archived';

export default function MyProductsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [products, setProducts] = useState<FarmerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null); // To track which product is being deleted
  const [isTogglingArchive, setIsTogglingArchive] = useState<string | null>(null); // For archive loading state
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<StatusFilter>('all'); // Filter state

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
      
      // Map the fetched data to match the FarmerProduct type
      const mappedProducts = data ? data.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
        image_url: item.image_url,
        farmerId: item.farmer_id, // Assuming Product type expects farmerId (camelCase)
        is_approved: item.is_approved, // Keep as snake_case
        createdAt: item.created_at, // Map created_at to createdAt
        is_archived: item.is_archived, // Keep as snake_case
        // Add any other necessary mappings
      })) as FarmerProduct[] : [];

      setProducts(mappedProducts);
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

  const handleEditProduct = (productId: string) => {
    // Navigate to the edit screen, passing the product ID
    // Cast the dynamic path to Href to satisfy TypeScript
    router.push(`/product/edit/${productId}` as Href);
  };

  const handleDeleteProduct = async (productId: string, imageUrl: string | null) => {
    Alert.alert(
      "Confirmer la suppression",
      "Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible.",
      [
        {
          text: "Annuler",
          style: "cancel"
        },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(productId);
            try {
              // 1. Delete image from storage if it exists
              if (imageUrl) {
                const imagePath = imageUrl.substring(imageUrl.indexOf('products/')); // Extract path after bucket name
                if (imagePath) {
                  const { error: storageError } = await supabase.storage
                    .from('product-images')
                    .remove([imagePath]);
                  if (storageError) {
                    console.warn("Error deleting product image:", storageError.message);
                    // Optionally, decide if you want to stop the process or just log the warning
                  }
                }
              }

              // 2. Delete product from database
              const { error: dbError } = await supabase
                .from('products')
                .delete()
                .eq('id', productId);

              if (dbError) {
                throw dbError;
              }

              // 3. Refresh product list or filter locally
              setProducts(prevProducts => prevProducts.filter(p => p.id !== productId));
              Alert.alert("Succès", "Produit supprimé avec succès.");

            } catch (e: any) {
              console.error("Error deleting product:", e);
              Alert.alert("Erreur", e.message || "Impossible de supprimer le produit.");
            } finally {
              setIsDeleting(null);
            }
          }
        }
      ]
    );
  };

  const handleToggleArchive = async (productId: string, currentArchivedStatus: boolean) => {
    const actionText = currentArchivedStatus ? "Remettre en ligne" : "Masquer du catalogue";
    const newArchivedStatus = !currentArchivedStatus;

    Alert.alert(
      `Confirmer l\'action`, 
      `Êtes-vous sûr de vouloir ${actionText.toLowerCase()} ce produit ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: actionText,
          onPress: async () => {
            setIsTogglingArchive(productId);
            try {
              const { error: updateError } = await supabase
                .from('products')
                .update({ is_archived: newArchivedStatus })
                .eq('id', productId);

              if (updateError) throw updateError;

              // Update local state
              setProducts(prevProducts => 
                prevProducts.map(p => 
                  p.id === productId ? { ...p, is_archived: newArchivedStatus } : p
                )
              );
              Alert.alert("Succès", `Produit ${newArchivedStatus ? 'archivé' : 'remis en ligne'} avec succès.`);
            } catch (e: any) {
              console.error(`Error ${actionText.toLowerCase()} product:`, e);
              Alert.alert("Erreur", e.message || `Impossible de ${actionText.toLowerCase()} le produit.`);
            } finally {
              setIsTogglingArchive(null);
            }
          }
        }
      ]
    );
  };

  // Filter products based on selected status
  const filteredProducts = useMemo(() => {
    if (selectedStatusFilter === 'archived') {
      return products.filter(p => p.is_archived);
    }
    // For all other filters, only show non-archived products
    let displayProducts = products.filter(p => !p.is_archived);

    if (selectedStatusFilter === 'all') {
      return displayProducts;
    }
    const targetStatus = selectedStatusFilter === 'approved' ? true : false;
    return displayProducts.filter(p => p.is_approved === targetStatus);
  }, [products, selectedStatusFilter]);

  const getStatusText = (isApproved: boolean | null, isArchived: boolean) => {
    if (isArchived) return 'Archivé';
    if (isApproved === true) return 'Approuvé';
    if (isApproved === false) return 'En attente';
    return 'Indéterminé';
  };

  const getStatusColor = (isApproved: boolean | null, isArchived: boolean) => {
    if (isArchived) return Colors.neutral[400];
    if (isApproved === true) return Colors.success.DEFAULT;
    if (isApproved === false) return Colors.warning.DEFAULT;
    return Colors.neutral[500];
  };

  const renderProductItem = ({ item }: { item: FarmerProduct }) => (
    <View style={[styles.productItem, item.is_archived && styles.archivedProductItem]}>
      {(isDeleting === item.id || isTogglingArchive === item.id) && (
        <View style={styles.deletingOverlay}>
          <ActivityIndicator color={Colors.neutral.white} />
        </View>
      )}
      <Image 
        source={{ uri: item.image_url || 'https://placehold.co/600x400/EEE/31343C?text=Image+Produit' }} 
        style={styles.productImage} 
      />
      <View style={styles.productDetails}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productInfo}>Prix: {item.price} FCFA</Text>
        <Text style={styles.productInfo}>Quantité: {item.quantity} {item.unit}</Text>
        <Text style={styles.productInfo}>
          Ajouté le: {new Date(item.createdAt).toLocaleDateString()}
        </Text>
        <View style={styles.statusContainer}>
          <Text style={styles.productInfo}>Statut: </Text>
          <Text style={[styles.statusText, { color: getStatusColor(item.is_approved, item.is_archived) }]}>
            {getStatusText(item.is_approved, item.is_archived)}
          </Text>
        </View>
      </View>
      <View style={styles.actionsContainer}>
        {/* Edit is always available unless archived? Or maybe not if pending? For now, show if not archived. */}
        {!item.is_archived && (
            <TouchableOpacity 
                style={styles.actionButton} 
                onPress={() => handleEditProduct(item.id)}
                disabled={isTogglingArchive === item.id || isDeleting === item.id}
            >
              <Feather name="edit-2" size={20} color={Colors.neutral[600]} />
            </TouchableOpacity>
        )}

        {item.is_approved && ( // Unlist/Relist only for approved products
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => handleToggleArchive(item.id, item.is_archived)}
            disabled={isTogglingArchive === item.id || isDeleting === item.id}
          >
            <Feather name={item.is_archived ? "eye" : "eye-off"} size={20} color={Colors.neutral[600]} />
          </TouchableOpacity>
        )}

        {!item.is_approved && !item.is_archived && ( // Delete only for non-approved AND non-archived
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => handleDeleteProduct(item.id, item.image_url)}
              disabled={isDeleting === item.id || isTogglingArchive === item.id}
            >
              <Feather name="trash-2" size={20} color={isDeleting === item.id ? Colors.neutral[400] : Colors.error.DEFAULT} />
            </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // Helper function to render filter buttons
  const renderFilterButton = (status: StatusFilter, title: string) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedStatusFilter === status && styles.filterButtonActive,
      ]}
      onPress={() => setSelectedStatusFilter(status)}
    >
      <Text
        style={[
          styles.filterButtonText,
          selectedStatusFilter === status && styles.filterButtonTextActive,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  if (loading && products.length === 0) {
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
  
  if (products.length === 0 && !loading) {
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

      {/* Filter Buttons Section */}
      <View style={styles.filterContainer}>
        {renderFilterButton('all', 'Tous')}
        {renderFilterButton('pending', 'En attente')}
        {renderFilterButton('approved', 'Approuvés')}
        {renderFilterButton('archived', 'Archivés')}
      </View>

      {/* Display loading indicator over list if fetching updates */}
      {loading && <ActivityIndicator style={{ marginTop: 20 }} color={Colors.primary.DEFAULT} />}

      {/* Product List or Filtered Empty State */}
      {filteredProducts.length > 0 ? (
        <FlatList
          data={filteredProducts} // Use filtered data
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContentContainer}
          // Add RefreshControl if needed later
        />
      ) : (
        !loading && (
          <View style={styles.filteredEmptyContainer}>
            <Feather name="search" size={40} color={Colors.neutral[400]} style={{ marginBottom: 16 }}/>
            <Text style={styles.placeholder}>
              Aucun produit trouvé pour le filtre "{ 
                selectedStatusFilter === 'pending' ? 'En attente' : 
                selectedStatusFilter === 'approved' ? 'Approuvés' : 
                selectedStatusFilter === 'archived' ? 'Archivés' : 'Tous' 
              }".
            </Text>
          </View>
        )
      )}
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
    paddingTop: 15, // Adjusted padding
    paddingBottom: 10, // Adjusted padding
    backgroundColor: Colors.neutral.white,
    // Removed bottom border for filter integration
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
    paddingTop: 16, // Keep padding top for list
    paddingBottom: 16,
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
    position: 'relative', // For overlay
  },
  archivedProductItem: {
    opacity: 0.6, // Visual cue for archived items
  },
  deletingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    zIndex: 10,
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
  actionsContainer: {
    flexDirection: 'column', // Stack icons vertically
    justifyContent: 'space-around', // Distribute space
    marginLeft: 10, // Add some space between details and actions
  },
  actionButton: {
    padding: 8, // Make icons easier to tap
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.neutral.white, // Match header bg
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: Colors.neutral[100],
  },
  filterButtonActive: {
    backgroundColor: Colors.primary[100],
  },
  filterButtonText: {
    fontFamily: 'BalooBhai2_500Medium',
    color: Colors.neutral[600],
    fontSize: 14,
  },
  filterButtonTextActive: {
    color: Colors.primary.DEFAULT,
    fontFamily: 'BalooBhai2_600SemiBold',
  },
  filteredEmptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 40, // Add some margin from filters
  },
}); 