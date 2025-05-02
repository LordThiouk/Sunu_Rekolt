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
import { Package, ShoppingBag, LogOut, Plus, CreditCard, ChartBar as BarChart } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Product, Order, UserRole } from '@/types';
import ProductCard from '@/components/ProductCard';
import Button from '@/components/Button';
import Colors from '@/constants/Colors';
import ActivityDashboard from '@/components/ActivityDashboard';

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
      loadUserData();
    }
  }, [user, activeTab]);

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
    setReceivedOrders([]);
    setPlacedOrders([]);
    if (!user) return;
    try {
      if (!user) return;

      const parseAndSetItems = (orders: Order[]): Order[] => {
        return orders.map(order => ({
            ...order,
            items: (() => {
              if (Array.isArray(order.items)) return order.items;
              if (typeof order.items === 'string') {
                try {
                  const parsed = JSON.parse(order.items);
                  return Array.isArray(parsed) ? parsed : [];
                } catch (e) {
                  console.warn(`Failed to parse items JSON for order ${order.id}:`, order.items, e);
                  return [];
                }
              }
              return [];
            })()
          }));
      };

      // --- Fetch orders PLACED by the user (Buyer or Farmer) ---
      const { data: placedData, error: placedError } = await supabase
        .from('orders')
        .select('id, buyerId: buyer_id, items, total, status, paymentMethod: payment_method, createdAt: created_at')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });

      if (placedError) throw placedError;
      if (placedData) {
        setPlacedOrders(parseAndSetItems(placedData));
      }

      // --- If user is a Farmer, ALSO fetch orders RECEIVED ---
      if (user.role === 'farmer') {
        const { data: itemData, error: itemError } = await supabase
          .from('order_items')
          .select('order_id')
          .eq('farmer_id', user.id);

        if (itemError) throw itemError;
        
        if (itemData && itemData.length > 0) {
          const receivedOrderIds = Array.from(new Set(itemData.map(item => item.order_id)));
          const { data: receivedData, error: receivedError } = await supabase
             .from('orders')
             .select('id, buyerId: buyer_id, items, total, status, paymentMethod: payment_method, createdAt: created_at')
             .in('id', receivedOrderIds)
             .order('created_at', { ascending: false });
          
          if (receivedError) throw receivedError;
          if (receivedData) {
             setReceivedOrders(parseAndSetItems(receivedData));
          }
        }
      }

    } catch (error) {
       // Keep existing improved error logging
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
      // setLoading(false); // Loading handled by loadUserData
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

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary.DEFAULT} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          <View style={styles.profileInitials}>
            <Text style={styles.initialsText}>{user.name.charAt(0)}</Text>
          </View>
          <View>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.role}>
              {user.role === 'farmer' ? 'Agriculteur' : 'Acheteur'}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={24} color={Colors.neutral.white} />
        </TouchableOpacity>
      </View>

      {user.role === 'farmer' && (
        <View style={styles.farmerInfo}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Localisation</Text>
            <Text style={styles.infoValue}>{user.location || 'Non spécifié'}</Text>
          </View>
          {user.farmSize && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Superficie</Text>
              <Text style={styles.infoValue}>{user.farmSize} hectares</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.tabs}>
        {user.role === 'farmer' && (
          <>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'dashboard' && styles.activeTab]}
              onPress={() => setActiveTab('dashboard')}
            >
              <BarChart
                size={20}
                color={
                  activeTab === 'dashboard'
                    ? Colors.primary.DEFAULT
                    : Colors.neutral[600]
                }
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'dashboard' && styles.activeTabText,
                ]}
              >
                Tableau de bord
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'products' && styles.activeTab]}
              onPress={() => setActiveTab('products')}
            >
              <Package
                size={20}
                color={
                  activeTab === 'products'
                    ? Colors.primary.DEFAULT
                    : Colors.neutral[600]
                }
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'products' && styles.activeTabText,
                ]}
              >
                Mes produits
              </Text>
            </TouchableOpacity>
          </>
        )}
        <TouchableOpacity
          style={[styles.tab, activeTab === 'orders' && styles.activeTab]}
          onPress={() => setActiveTab('orders')}
        >
          <ShoppingBag
            size={20}
            color={
              activeTab === 'orders'
                ? Colors.primary.DEFAULT
                : Colors.neutral[600]
            }
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'orders' && styles.activeTabText,
            ]}
          >
            Mes commandes
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={Colors.primary.DEFAULT} />
        </View>
      ) : activeTab === 'dashboard' && user.role === 'farmer' ? (
        <ActivityDashboard farmerId={user.id} />
      ) : activeTab === 'products' && user.role === 'farmer' ? (
        <View style={styles.content}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mes produits</Text>
            <Button
              title="Ajouter"
              onPress={handleAddProduct}
              size="small"
              icon={<Plus size={16} color={Colors.neutral.white} />}
            />
          </View>

          {products.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                Vous n'avez pas encore ajouté de produits.
              </Text>
              <Button
                title="Ajouter un produit"
                onPress={handleAddProduct}
                variant="outline"
                style={styles.emptyActionButton}
              />
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.productsList}>
                {products.map((product: Product) => (
                  <View key={product.id}>
                    <ProductCard
                      product={product}
                      onPress={() => handleViewProductDetails(product.id)}
                    />
                  </View>
                ))}
              </View>
            </ScrollView>
          )}
        </View>
      ) : activeTab === 'orders' ? (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {user.role === 'farmer' && (
            <View style={styles.orderSection}>
              <Text style={styles.sectionTitle}>Commandes Reçues</Text>
              {receivedOrders.length === 0 ? (
                 <View style={styles.emptyStateCompact}> 
                    <Text style={styles.emptyText}>Aucune commande reçue pour le moment.</Text>
                 </View>
              ) : (
                 <View style={styles.ordersList}>
                    {receivedOrders.map((order: Order) => (
                      <View key={order.id}> 
                         <OrderCard 
                            order={order} 
                            userRole={user.role} 
                            currentUserId={user.id} 
                            onUpdateStatus={handleUpdateOrderStatus}
                            isUpdating={isUpdating}
                         /> 
                      </View>
                    ))}
                 </View>
              )}
            </View>
          )}

          <View style={styles.orderSection}>
             <Text style={styles.sectionTitle}>
                {user.role === 'farmer' ? 'Commandes Passées' : 'Mes Commandes'}
             </Text>
             {placedOrders.length === 0 ? (
                <View style={styles.emptyStateCompact}> 
                   <Text style={styles.emptyText}>Vous n'avez pas encore passé de commande.</Text>
                   <Button
                      title="Parcourir les produits"
                      onPress={() => router.push('/(tabs)/')}
                      variant="outline"
                      style={styles.emptyActionButtonSmall}
                   />
                </View>
             ) : (
                <View style={styles.ordersList}>
                   {placedOrders.map((order: Order) => (
                      <View key={order.id}> 
                         <OrderCard 
                            order={order} 
                            userRole={user.role} 
                            currentUserId={user.id} 
                            onUpdateStatus={handleUpdateOrderStatus}
                            isUpdating={isUpdating}
                         /> 
                      </View>
                   ))}
                </View>
             )}
          </View>
        </ScrollView>
      ) : null}
    </View>
  );
}

interface OrderCardProps {
  order: Order;
  userRole: UserRole;
  currentUserId: string;
  onUpdateStatus: (orderId: string, newStatus: Order['status']) => void;
  isUpdating: boolean;
}

function OrderCard({ 
  order,
  userRole,
  currentUserId,
  onUpdateStatus,
  isUpdating
}: OrderCardProps) {
  const getStatusStyle = (status: Order['status']) => {
    switch (status) {
      case 'paid': return styles.orderStatusPaid;
      case 'delivering': return styles.orderStatusDelivering;
      case 'delivered': return styles.orderStatusDelivered;
      case 'received': return styles.orderStatusReceived;
      case 'cancelled': return styles.orderStatusCancelled;
      default: return styles.orderStatusPending;
    }
  };

  const getStatusTextStyle = (status: Order['status']) => {
    switch (status) {
      case 'paid': return styles.orderStatusTextPaid;
      case 'delivering': return styles.orderStatusTextDelivering;
      case 'delivered': return styles.orderStatusTextDelivered;
      case 'received': return styles.orderStatusTextReceived;
      case 'cancelled': return styles.orderStatusTextCancelled;
      default: return styles.orderStatusTextPending;
    }
  };
  
  const getStatusText = (status: Order['status']) => {
     switch (status) {
       case 'paid': return 'Payé';
       case 'delivering': return 'En livraison';
       case 'delivered': return 'Livré';
       case 'received': return 'Reçu';
       case 'cancelled': return 'Annulé';
       default: return 'En attente';
     }
  };

  const getPaymentText = (method: Order['paymentMethod']) => {
     return method === 'mobile_money' ? 'Mobile Money' : 'Espèces';
  };

  const isOrderReceived = userRole === 'farmer' && order.buyerId !== currentUserId;
  const isOrderPlaced = order.buyerId === currentUserId;

  const renderActionButtons = () => {
    // Farmer actions on received orders
    if (isOrderReceived) {
      if (order.status === 'paid') {
        console.log(`[OrderCard ${order.id}] Rendering 'Marquer en livraison' button`);
        return (
          <Button 
            title="Marquer en livraison"
            onPress={() => {
               console.log(`[OrderCard ${order.id}] 'Marquer en livraison' PRESSED`);
               onUpdateStatus(order.id, 'delivering');
            }}
            variant="outline"
            size="small"
            disabled={isUpdating}
            loading={isUpdating}
            style={styles.actionButton}
          />
        );
      }
      if (order.status === 'delivering') {
        console.log(`[OrderCard ${order.id}] Rendering 'Marquer comme livré' button`);
        return (
          <Button 
            title="Marquer comme livré"
            onPress={() => {
               console.log(`[OrderCard ${order.id}] 'Marquer comme livré' PRESSED`);
               onUpdateStatus(order.id, 'delivered');
            }}
            variant="primary"
            size="small"
            disabled={isUpdating}
            loading={isUpdating}
            style={styles.actionButton}
          />
        );
      }
    }

    // Buyer actions on placed orders
    if (isOrderPlaced) {
      if (order.status === 'delivered') {
         console.log(`[OrderCard ${order.id}] Rendering 'Confirmer réception' button`);
        return (
          <Button 
            title="Confirmer réception"
            onPress={() => {
               console.log(`[OrderCard ${order.id}] 'Confirmer réception' PRESSED`);
               onUpdateStatus(order.id, 'received');
            }}
            variant="primary"
            size="small"
            disabled={isUpdating}
            loading={isUpdating}
            style={styles.actionButton}
          />
        );
      }
      
      // Action: Request refund (placeholder)
      if (['paid', 'delivering', 'delivered'].includes(order.status)) {
          console.log(`[OrderCard ${order.id}] Rendering 'Demander remboursement' button`);
          return (
             <Button 
                title="Demander remboursement"
                onPress={() => {
                   console.log(`[OrderCard ${order.id}] 'Demander remboursement' PRESSED`);
                   Alert.alert("Fonctionnalité à venir", "La demande de remboursement sera bientôt disponible.");
                }}
                variant="outline"
                size="small"
                disabled={isUpdating}
                style={styles.actionButton}
             />
          );
      }
    }
    console.log(`[OrderCard ${order.id}] Rendering NO action button (status: ${order.status}, isOrderReceived: ${isOrderReceived}, isOrderPlaced: ${isOrderPlaced})`);
    return null; 
  };

  return (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>Commande #{order.id.slice(0, 8)}</Text>
        <View style={[styles.orderStatus, getStatusStyle(order.status)]}>
          <Text style={[styles.orderStatusText, getStatusTextStyle(order.status)]}>
            {getStatusText(order.status)}
          </Text>
        </View>
      </View>

      <View style={styles.orderInfo}>
        <Text style={styles.orderDate}>
          {new Date(order.createdAt).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
        <Text style={styles.orderItems}>
          {order.items.length} {order.items.length > 1 ? 'articles' : 'article'}
        </Text>
      </View>

      <View style={styles.orderFooter}>
        <CreditCard size={16} color={Colors.neutral[600]} />
        <Text style={styles.paymentMethod}>
          {getPaymentText(order.paymentMethod)}
        </Text>
        <Text style={styles.orderTotal}>{order.total.toLocaleString()} CFA</Text>
      </View>

      <View style={styles.actionContainer}>
         {renderActionButtons()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[100],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: Colors.primary.DEFAULT,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInitials: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.neutral.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  initialsText: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.primary.DEFAULT,
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.neutral.white,
    marginBottom: 4,
  },
  role: {
    fontSize: 14,
    color: Colors.neutral[100],
  },
  logoutButton: {
    padding: 8,
  },
  farmerInfo: {
    backgroundColor: Colors.neutral.white,
    padding: 16,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  infoItem: {
    marginRight: 24,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.neutral[600],
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.neutral[800],
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.neutral.white,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    marginRight: 24,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary.DEFAULT,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.neutral[600],
    marginLeft: 8,
  },
  activeTabText: {
    color: Colors.primary.DEFAULT,
  },
  content: {
    flex: 1,
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral[800],
    marginBottom: 16,
  },
  productsList: {
    paddingBottom: 16,
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
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyActionButton: {
    minWidth: 200,
  },
  ordersList: {
    paddingBottom: 16,
  },
  orderCard: {
    backgroundColor: Colors.neutral.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: Colors.neutral.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral[800],
  },
  orderStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: Colors.neutral[200],
  },
  orderStatusPending: {
     backgroundColor: Colors.neutral[200],
  },
  orderStatusPaid: {
    backgroundColor: Colors.success.light,
  },
  orderStatusDelivering: {
      backgroundColor: Colors.warning.light,
  },
  orderStatusDelivered: {
    backgroundColor: Colors.primary[100],
  },
  orderStatusReceived: {
      backgroundColor: Colors.primary.DEFAULT,
  },
  orderStatusCancelled: {
    backgroundColor: Colors.error.light,
  },
  orderStatusText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.neutral[700],
  },
  orderStatusTextPending: {
     color: Colors.neutral[700],
  },
  orderStatusTextPaid: {
    color: Colors.success.DEFAULT,
  },
  orderStatusTextDelivering: {
      color: Colors.warning.dark,
  },
  orderStatusTextDelivered: {
    color: Colors.primary.DEFAULT,
  },
  orderStatusTextReceived: {
      color: Colors.neutral.white,
  },
  orderStatusTextCancelled: {
    color: Colors.error.DEFAULT,
  },
  orderInfo: {
    marginBottom: 12,
  },
  orderDate: {
    fontSize: 14,
    color: Colors.neutral[600],
    marginBottom: 4,
  },
  orderItems: {
    fontSize: 14,
    color: Colors.neutral[700],
  },
  orderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[200],
    paddingTop: 12,
  },
  paymentMethod: {
    fontSize: 14,
    color: Colors.neutral[600],
    marginLeft: 8,
    flex: 1,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary.DEFAULT,
  },
  orderSection: {
     padding: 16,
     marginBottom: 8,
  },
  emptyStateCompact: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  emptyActionButtonSmall: {
     marginTop: 12,
     paddingHorizontal: 24,
     paddingVertical: 8,
  },
  actionContainer: {
     marginTop: 16, 
     paddingTop: 12,
     borderTopWidth: 1,
     borderTopColor: Colors.neutral[200],
     alignItems: 'flex-end',
  },
  actionButton: {
     minWidth: 150,
     paddingVertical: 8,
  },
});