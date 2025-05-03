import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Package, ShoppingBag, LogOut, Plus, CreditCard, ChartBar as BarChart, Settings, User as UserIcon, History, Bell, ChevronRight, HelpCircle, MapPin } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Product, Order, UserRole } from '@/types';
import ProductCard from '@/components/ProductCard';
import Button from '@/components/Button';
import Colors from '@/constants/Colors';
import ActivityDashboard from '@/components/ActivityDashboard';

// Action Row Component (Helper)
interface ActionRowProps {
  icon: React.ElementType;
  label: string;
  onPress: () => void;
}
const ActionRow: React.FC<ActionRowProps> = ({ icon: Icon, label, onPress }) => (
  <TouchableOpacity style={styles.actionRow} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.actionIconContainer}>
       <Icon size={20} color={Colors.neutral[600]} />
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
    <ChevronRight size={20} color={Colors.neutral[400]} />
  </TouchableOpacity>
);

export default function ProfileScreen() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [receivedOrders, setReceivedOrders] = useState<Order[]>([]);
  const [placedOrders, setPlacedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const { user, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      loadInitialData();
    } else {
       setLoading(false); 
    }
  }, [user]);

  const loadInitialData = async () => {
    setLoading(true);
    console.log("[ProfileScreen] Initial data loaded (user from context).");
    // Simulate short load for profile display
    await new Promise(resolve => setTimeout(resolve, 100)); 
    setLoading(false);
  };

  const loadUserData = async () => {
    setLoading(true);
    
    if (activeTab === 'products' && user?.role === 'farmer') {
      await fetchFarmerProducts();
    } else if (activeTab === 'orders') {
      await fetchOrders();
    } else if (activeTab === 'dashboard' && user?.role === 'farmer') {
       // Fetch dashboard stats if needed (currently handled by ActivityDashboard component itself)
       // For now, just ensure loading state is handled
    }
    
    setLoading(false);
  };

  const fetchFarmerProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('farmer_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedProducts: Product[] = data.map(item => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          quantity: item.quantity,
          unit: item.unit,
          category: item.category,
          imageUrl: item.image_url,
          farmerId: item.farmer_id,
          farmerName: user?.name || '',
          isApproved: item.is_approved,
          createdAt: item.created_at,
        }));
        
        setProducts(formattedProducts);
      }
    } catch (error) {
      console.error('Error fetching farmer products:', error);
    }
  };

  const fetchOrders = async () => {
    console.log('[ProfileScreen] fetchOrders called.');
    setReceivedOrders([]);
    setPlacedOrders([]);
    if (!user) {
      console.log('[ProfileScreen] fetchOrders: No user, returning.');
      return;
    }
    console.log(`[ProfileScreen] fetchOrders: User ID: ${user.id}, Role: ${user.role}`);
    try {

      // --- Fetch orders PLACED by the user (Buyer or Farmer) ---
      console.log(`[ProfileScreen] fetchOrders: Fetching placed orders for user ${user.id}`);
      const { data: placedOrdersData, error: placedError } = await supabase
        .from('orders')
        .select('id, buyerId: buyer_id, total, status, paymentMethod: payment_method, createdAt: created_at, delivery_address, delivery_details') 
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });

      if (placedError) {
         console.error('[ProfileScreen] fetchOrders: Error fetching placed orders:', placedError);
         throw placedError;
      }
      
      let finalPlacedOrders: Order[] = [];
      if (placedOrdersData && placedOrdersData.length > 0) {
        console.log(`[ProfileScreen] fetchOrders: Found ${placedOrdersData.length} placed orders.`);
        // Fetch items using RPC for each placed order
        // NOTE: This makes N+1 calls, less efficient but uses the working RPC
        // Consider optimizing later if performance is an issue
        const placedOrdersWithItems = await Promise.all(placedOrdersData.map(async (order: any) => {
          console.log(`[ProfileScreen] fetchOrders: Fetching items via RPC for placed order ${order.id}...`);
          const { data: itemsData, error: itemsError } = await supabase
             .rpc('get_order_items_for_buyer', { p_order_id: order.id });
             
          if (itemsError) {
             console.error(`[ProfileScreen] fetchOrders: Error fetching items for placed order ${order.id}:`, itemsError);
             return { ...order, items: [] }; // Return order without items on error
          }
          console.log(`[ProfileScreen] fetchOrders: Found ${itemsData?.length || 0} items for placed order ${order.id}.`);
          return { 
             ...order, 
             // Map item_id back if needed by OrderCard
             items: (itemsData || []).map((item: any) => ({...item, id: item.item_id})) 
            };
        }));
        finalPlacedOrders = placedOrdersWithItems;

        // <<< ADD LOGGING HERE >>>
        console.log(`[ProfileScreen] fetchOrders: Final mapped placedOrdersWithItems (first order):`, JSON.stringify(finalPlacedOrders?.slice(0, 1), null, 2));
        if (finalPlacedOrders && finalPlacedOrders.length > 0) {
          console.log(`[ProfileScreen] fetchOrders: First final placed order items length: ${finalPlacedOrders[0].items?.length}`);
        }
        // <<< END LOGGING >>>
      }
      setPlacedOrders(finalPlacedOrders);

      // --- If user is a Farmer, ALSO fetch orders RECEIVED using RPC ---
      if (user.role === 'farmer') {
        console.log(`[ProfileScreen] fetchOrders: User is a farmer. Fetching received orders via RPC for farmer ID ${user.id}`);
        const { data: receivedOrdersData, error: receivedOrdersError } = await supabase
           .rpc('get_received_orders_for_farmer', { p_farmer_id: user.id });

        if (receivedOrdersError) {
           console.error('[ProfileScreen] fetchOrders: Error fetching received orders via RPC:', receivedOrdersError);
           throw receivedOrdersError;
        }

        // <<< ADD LOGGING HERE >>>
        console.log(`[ProfileScreen] fetchOrders: Raw receivedOrdersData from RPC:`, JSON.stringify(receivedOrdersData?.slice(0, 1), null, 2)); // Log first raw order
        if (receivedOrdersData && receivedOrdersData.length > 0) {
            const firstRawOrder = receivedOrdersData[0];
            console.log(`[ProfileScreen] fetchOrders: First raw received order created_at: ${firstRawOrder?.created_at}, type: ${typeof firstRawOrder?.created_at}`);
        }
        // <<< END LOGGING >>>

        if (receivedOrdersData && receivedOrdersData.length > 0) { // Check receivedOrdersData
           console.log(`[ProfileScreen] fetchOrders: Found ${receivedOrdersData.length} received orders via RPC.`);
           const receivedOrderIds = receivedOrdersData.map((o: any) => o.id);
           if (receivedOrderIds.length > 0) {
              console.log(`[ProfileScreen] fetchOrders: Fetching items for ${receivedOrderIds.length} received orders (using farmer RLS)...`);
              const { data: receivedItemsData, error: receivedItemsError } = await supabase
                  .from('order_items')
                  .select('*') 
                  .in('order_id', receivedOrderIds)
                  .eq('farmer_id', user.id); 
                  
              if (receivedItemsError) {
                  console.error('[ProfileScreen] fetchOrders: Error fetching items for received orders:', receivedItemsError); // Log error
                  // Map orders without items on error
                  const receivedOrdersWithoutItems = receivedOrdersData.map((order: any) => ({ ...order, items: [] }));
                  setReceivedOrders(receivedOrdersWithoutItems);
              } else {
                 console.log(`[ProfileScreen] fetchOrders: Successfully fetched ${receivedItemsData?.length || 0} items for received orders.`); // Log success count
                 // Map items to their respective orders
                 const receivedOrdersWithItems = receivedOrdersData.map((order: any) => {
                     const itemsForThisOrder = (receivedItemsData || []).filter((item: any) => item.order_id === order.id);
                     // Explicitly map snake_case to camelCase for OrderCard compatibility
                     const mappedOrder = {
                         ...order,
                         createdAt: order.created_at, // Map created_at -> createdAt
                         buyerId: order.buyer_id,     // Ensure buyerId is mapped if needed
                         paymentMethod: order.payment_method // Ensure paymentMethod is mapped
                         // Add other necessary mappings if Order type expects camelCase
                     };
                     // Log the count of items found for a specific received order
                     if (order.id === receivedOrderIds[0]) { // Log for the first order only
                       console.log(`[ProfileScreen] fetchOrders: Items found for received order ${order.id}: ${itemsForThisOrder.length}`);
                     }
                     return {
                        ...mappedOrder, // Use the mapped order object
                        items: itemsForThisOrder
                     };
                 });
                 // Log final structure for first received order
                 if (receivedOrdersWithItems.length > 0) {
                    console.log(`[ProfileScreen] fetchOrders: Final structure for first received order (${receivedOrdersWithItems[0].id}):`, JSON.stringify(receivedOrdersWithItems[0], null, 2));
                 }
                 setReceivedOrders(receivedOrdersWithItems);
              }
           } else {
              setReceivedOrders([]);
           }
        } else {
          console.log(`[ProfileScreen] fetchOrders: No received orders found via RPC for farmer ID ${user.id}.`);
          setReceivedOrders([]);
        }
      } else {
         console.log('[ProfileScreen] fetchOrders: User is not a farmer, skipping received orders fetch.');
      }

    } catch (error) {
       // Keep existing error logging
       if (error instanceof Error) {
          console.error('Error fetching orders:', error.message);
          if ('details' in error) {
            console.error('Error details:', (error as any).details);
          }
          Alert.alert("Erreur", `Impossible de charger les commandes: ${error.message}`);
      } else {
          console.error('Unknown error fetching orders:', error);
          Alert.alert("Erreur", "Une erreur inconnue est survenue lors du chargement des commandes.");
      }
    } finally {
      // setLoading(false); // Loading handled by loadUserData in parent
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    console.log(`[ProfileScreen] handleUpdateOrderStatus called for order ${orderId} with status ${newStatus}`);
    if (!user) {
       console.log("[ProfileScreen] No user found, returning.");
       return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      // Update local state optimistically
      setPlacedOrders((prevOrders: Order[]) => 
        prevOrders.map((o: Order) => o.id === orderId ? { ...o, status: newStatus } : o)
      );
      setReceivedOrders((prevOrders: Order[]) => 
        prevOrders.map((o: Order) => o.id === orderId ? { ...o, status: newStatus } : o)
      );

      Alert.alert("Succès", "Statut de la commande mis à jour.");

    } catch (error) {
       const message = error instanceof Error ? error.message : 'Une erreur inconnue est survenue.';
       console.error('Error updating order status:', error);
       Alert.alert("Erreur", `Impossible de mettre à jour le statut: ${message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddProduct = () => {
    router.push('/(tabs)/product/add');
  };

  const handleViewProductDetails = (productId: string) => {
    router.push(`/(tabs)/catalog/${productId}`);
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Déconnecter', style: 'destructive', onPress: signOut }
      ]
    );
  };

  const handleNavigate = (path: string) => {
    console.log(`Navigating to ${path}...`);
    router.push(path as any);
    // TODO: Implement actual screens
    Alert.alert("Navigation", `Placeholder: Naviguer vers ${path}`);
  };

  if (loading || !user) { 
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary.DEFAULT} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 1. Simple Header */}
      <View style={styles.newHeader}>
        <Text style={styles.newHeaderTitle}>Mon Profil</Text>
        <TouchableOpacity onPress={() => handleNavigate('/settings')} style={styles.settingsButton}>
           <Settings size={24} color={Colors.neutral[600]} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* 2. Profile Summary */}
        <View style={styles.profileSummary}>
           {/* TODO: Add actual Image component for avatar if available */}
           <View style={styles.profileInitials}>
             <Text style={styles.initialsText}>{user.name?.charAt(0)?.toUpperCase() || ' '}</Text>
           </View>
           <Text style={styles.profileName}>{user.name}</Text>
           <Text style={styles.profileRole}>
             {user.role === 'farmer' ? 'Agriculteur' : 'Acheteur'}
           </Text>
           {/* Optionally display location for farmer */}
           {user.role === 'farmer' && user.location && (
                <View style={styles.locationRow}>
                   <MapPin size={14} color={Colors.neutral[500]} />
                   <Text style={styles.profileLocation}>{user.location}</Text>
                </View>
           )}
        </View>

        {/* 3. Action List */}
        <View style={styles.actionList}>
           <ActionRow 
              icon={UserIcon} 
              label="Modifier le profil" 
              onPress={() => router.push('/(tabs)/edit-profile')}
           />
           <ActionRow 
              icon={History} 
              label="Historique des commandes" 
              onPress={() => handleNavigate('/order-history')} 
           />
           {/* Farmer specific actions */}
           {user.role === 'farmer' && (
             <>
               <ActionRow 
                 icon={Package} 
                 label="Mes Produits" 
                 onPress={() => handleNavigate('/my-products')} 
               />
               <ActionRow 
                 icon={BarChart} 
                 label="Tableau de bord" 
                 onPress={() => handleNavigate('/dashboard')} 
               />
             </>
           )}
           <ActionRow 
              icon={Bell} 
              label="Notifications" 
              onPress={() => handleNavigate('/notifications')} 
           />
            <ActionRow 
              icon={HelpCircle} 
              label="Aide et Support" 
              onPress={() => handleNavigate('/support')} 
           />
           {/* Add Confidentialité / Privacy later if needed */}
        </View>

        {/* 4. Logout Button */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
            <LogOut size={18} color={Colors.error.DEFAULT} />
            <Text style={styles.logoutButtonText}>Se déconnecter</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50], // Lighter background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.neutral[50],
  },
  newHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16, // Adjust as needed for status bar height
    paddingBottom: 12,
    backgroundColor: Colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  newHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral[800],
  },
  settingsButton: {
    padding: 4,
  },
  scrollContainer: {
    paddingBottom: 32, // Space at the bottom
  },
  profileSummary: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: Colors.neutral.white,
    marginBottom: 12, // Space before action list
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  profileInitials: { // Reuse style for initials circle
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary[100], // Use existing light shade e.g., 100
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  initialsText: {
    fontSize: 36,
    fontWeight: '600',
    color: Colors.primary.DEFAULT,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.neutral[800],
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 14,
    color: Colors.neutral[600],
    marginBottom: 8,
  },
  locationRow: {
     flexDirection: 'row',
     alignItems: 'center',
     marginTop: 4, 
  },
  profileLocation: {
     fontSize: 14,
     color: Colors.neutral[500],
     marginLeft: 4,
  },
  actionList: {
    backgroundColor: Colors.neutral.white,
    marginHorizontal: 16,
    borderRadius: 8,
    overflow: 'hidden', // Clip borders
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  actionIconContainer: {
     width: 30, // Fixed width for alignment
     alignItems: 'center',
     marginRight: 12,
  },
  actionLabel: {
    flex: 1, // Take remaining space
    fontSize: 16,
    color: Colors.neutral[700],
  },
  logoutContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.error.light, // Use error.light
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.error.DEFAULT, // Use error.DEFAULT for border
  },
  logoutButtonText: {
    fontSize: 16,
    color: Colors.error.DEFAULT,
    fontWeight: '500',
    marginLeft: 8,
  },
});