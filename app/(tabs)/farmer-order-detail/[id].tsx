import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Linking,
  Alert,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ClipboardList as ListChecks,
  PhoneCall,
  MapPin,
  User as UserIcon,
  Package
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Order, User, OrderItemWithProduct } from '@/types';
import Button from '@/components/Button';
import Colors from '@/constants/Colors';

// Define needed types locally for clarity
type OrderForDisplay = Omit<Order, 'items'> & { buyer?: Pick<User, 'id' | 'name' | 'phone'> };
type OrderItemForDisplay = {
  id: string;
  order_id: string;
  product_id: string;
  farmer_id: string;
  quantity: number;
  price_at_time: number;
  created_at: string;
  product: {
    id: string;
    name: string;
    image_url: string;
  } | null;
};

// Helper functions (copied from OrderConfirmationScreen)
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

const getPaymentMethodName = (method: string | null | undefined) => {
  switch (method) {
    case 'orange_money': return 'Orange Money';
    case 'wave': return 'Wave';
    case 'free_money': return 'Free Money';
    default: return method || 'Inconnu';
  }
};

export default function FarmerOrderDetailScreen() {
  const { id: orderId } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<OrderForDisplay | null>(null);
  const [items, setItems] = useState<OrderItemForDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (orderId && user) {
      fetchOrderBuyerAndItems(orderId);
    } else if (!user) {
      setLoading(false);
      setError("Utilisateur non trouvé.");
    }
  }, [orderId, user]);

  const fetchOrderBuyerAndItems = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      // 1. Call RPC function to get Order + Buyer details securely
      console.log(`[FarmerOrderDetail] Calling RPC get_order_details_for_farmer for ID: ${id}`);
      const { data: orderDetailsJson, error: rpcError } = await supabase
        .rpc('get_order_details_for_farmer', { p_order_id: id });

      if (rpcError) {
        console.error("[FarmerOrderDetail] Error calling RPC:", rpcError);
        // Check if it's our custom authorization error from the function
        if (rpcError.message.includes('Authorization Error')) {
             throw new Error("Autorisation refusée: Vous n'êtes pas impliqué dans cette commande.");
        } else {
            throw new Error(`Erreur lors de la récupération des détails de commande (RPC: ${rpcError.code})`);
        }
      }
      if (!orderDetailsJson) throw new Error("Aucune donnée retournée par la fonction RPC.");

      // Cast the returned JSON to our OrderForDisplay type
      // Note: The JSON structure from the function should match OrderForDisplay
      const fetchedOrder: OrderForDisplay = orderDetailsJson as OrderForDisplay;
      console.log(`[FarmerOrderDetail] Order details fetched via RPC. Buyer: ${fetchedOrder.buyer?.name}`);

      // 2. Fetch Order Items (Still needed separately, RLS on order_items is fine)
      console.log(`[FarmerOrderDetail] Fetching order items for farmer ID: ${user!.id} and order ID: ${id}`);
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select(`*, product: products(id, name, image_url)`)
        .eq('order_id', id)
        .eq('farmer_id', user!.id);

      if (itemsError) {
        console.error("[FarmerOrderDetail] Error fetching order items:", itemsError);
        throw new Error(`Erreur lors de la récupération des articles (Erreur: ${itemsError.code})`);
      }

      // Authorization Check is implicitly handled by the RPC function throwing an error
      // or by this item fetch returning empty (though RPC should catch it first)
      if (!itemsData) { 
          // This case might be redundant if RPC always errors first, but keep as safety
          console.error(`[FarmerOrderDetail] No items data received after RPC success for order ${id}.`);
          throw new Error("Erreur: Impossible de récupérer les articles associés.");
      }
      console.log(`[FarmerOrderDetail] Found ${itemsData.length} items for this farmer.`);

      // 3. Map and Set State
      const fetchedItems: OrderItemForDisplay[] = (itemsData).map((item: any) => ({
        id: item.id,
        order_id: item.order_id,
        product_id: item.product_id,
        farmer_id: item.farmer_id,
        quantity: item.quantity,
        price_at_time: item.price_at_time,
        created_at: item.created_at,
        product: item.product ? { 
            id: item.product.id, 
            name: item.product.name, 
            image_url: item.product.image_url
        } : null
      }));

      // Set state using data from RPC and item fetch
      setOrder(fetchedOrder); 
      setItems(fetchedItems);
      console.log("[FarmerOrderDetail] State updated successfully.");

    } catch (err: any) { 
      console.error("[FarmerOrderDetail] Overall fetch error:", err);
      setError(err.message || "Impossible de charger les détails de la commande.");
    } finally {
      setLoading(false);
    }
  };

  // --- Action Handlers ---

  const handleUpdateOrderStatus = async (newStatus: Order['status']) => {
    if (!order) return;
    console.log(`[FarmerOrderDetail] Updating status for order ${order.id} to ${newStatus}`);

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', order.id);

      if (error) throw error;

      // Update local state optimistically
      setOrder((prevOrder) => prevOrder ? { ...prevOrder, status: newStatus } : null);

      Alert.alert("Succès", "Statut de la commande mis à jour.");

    } catch (error) {
       const message = error instanceof Error ? error.message : 'Une erreur inconnue est survenue.';
       console.error('[FarmerOrderDetail] Error updating order status:', error);
       Alert.alert("Erreur", `Impossible de mettre à jour le statut: ${message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCallBuyer = () => {
     const phone = order?.buyer?.phone;
    if (phone) {
       console.log(`[FarmerOrderDetail] Attempting to call buyer at ${phone}`);
       Linking.openURL(`tel:${phone}`).catch(err => {
          console.error("[FarmerOrderDetail] Failed to open phone link:", err);
          Alert.alert("Erreur", "Impossible d'ouvrir l'application téléphone.");
       });
    } else {
       console.log("[FarmerOrderDetail] Buyer phone number not available.");
       Alert.alert(
         'Erreur',
         "Numéro de téléphone de l\'acheteur indisponible."
       );
    }
  };

  // --- Render Functions ---

  const renderFarmerActionButtons = () => {
     if (!order) return null;

     switch (order.status) {
        case 'paid':
           return (
              <Button 
                 title="Marquer en livraison"
                 onPress={() => handleUpdateOrderStatus('delivering')}
                 variant="outline"
                 disabled={isUpdating}
                 loading={isUpdating}
                 style={styles.actionButton}
              />
           );
        case 'delivering':
            return (
               <Button 
                  title="Marquer comme livré"
                  onPress={() => handleUpdateOrderStatus('delivered')}
                  variant="primary"
                  disabled={isUpdating}
                  loading={isUpdating}
                  style={styles.actionButton}
               />
            );
        default:
            // No actions for other statuses (delivered, received, cancelled, pending)
            return null;
     }
  };

  // --- Main Render ---
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary.DEFAULT} />
      </View>
    );
  }

  if (error) {
     return (
       <View style={styles.errorContainer}>
         <Text style={styles.errorText}>{error}</Text>
         <Button title="Retour" onPress={() => router.back()} />
       </View>
     );
  }

  if (!order) {
     return (
       <View style={styles.errorContainer}>
         <Text style={styles.errorText}>Commande non trouvée.</Text>
          <Button title="Retour" onPress={() => router.back()} />
       </View>
     );
  }

  // Buyer details extracted for convenience
  const buyer = order.buyer;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <View style={[styles.statusBadge, getStatusStyle(order.status)]}>
          <Text style={[styles.statusText, getStatusTextStyle(order.status)]}>
            {getStatusText(order.status)}
          </Text>
        </View>
        <Text style={styles.title}>Commande Reçue</Text>
        <Text style={styles.orderIdText}>ID: {order.id.slice(0, 8)}...</Text>
        <Text style={styles.dateText}>
           {new Date(order.createdAt).toLocaleString('fr-FR', { 
               year: 'numeric', 
               month: 'long', 
               day: 'numeric',
               hour: '2-digit',
               minute: '2-digit'
            })}
        </Text>
      </View>

      {/* Buyer Information Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informations de l'acheteur</Text>
        {buyer ? (
          <View style={styles.buyerInfoContainer}>
            <View style={styles.buyerDetailRow}>
              <UserIcon size={20} color={Colors.neutral[600]} style={styles.icon} />
              <Text style={styles.buyerText}>{buyer.name}</Text>
            </View>
            <View style={styles.buyerDetailRow}>
              <PhoneCall size={20} color={Colors.neutral[600]} style={styles.icon} />
              <TouchableOpacity onPress={handleCallBuyer}>
                <Text style={[styles.buyerText, styles.phoneText]}>{buyer.phone}</Text>
              </TouchableOpacity>
            </View>
             {/* Display Delivery Address if available */}
            {order.delivery_address && (
              <View style={styles.buyerDetailRow}>
                  <MapPin size={20} color={Colors.neutral[600]} style={styles.icon} />
                  <Text style={styles.buyerText} numberOfLines={2} ellipsizeMode="tail">
                     {order.delivery_address}
                     {order.delivery_details ? ` (${order.delivery_details})` : ''}
                  </Text>
              </View>
            )}
          </View>
        ) : (
          <Text>Informations de l'acheteur non disponibles.</Text>
        )}
      </View>

      {/* Items Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Articles commandés (par vous)</Text>
        <View style={styles.itemsContainer}>
          {items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              {/* Optionally add Image component here if needed using item.product.image_url */}
              <Text style={styles.itemName}>{item.product?.name || 'Produit Inconnu'}</Text>
              <Text style={styles.itemQuantity}>x {item.quantity}</Text>
              <Text style={styles.itemPrice}>{(item.price_at_time * item.quantity).toLocaleString()} CFA</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Summary Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Résumé de la commande</Text>
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Articles (vos articles)</Text>
            {/* Calculate subtotal for farmer's items if needed, or show full order total */}
            <Text style={styles.summaryValue}>{items.reduce((sum, item) => sum + item.price_at_time * item.quantity, 0).toLocaleString()} CFA</Text>
          </View>
          <View style={styles.summaryRow}>
             <Text style={styles.summaryLabel}>Total Commande Complète</Text>
             <Text style={styles.summaryValue}>{order.total.toLocaleString()} CFA</Text>
          </View>
           <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Méthode de paiement</Text>
              <Text style={styles.summaryValue}>{getPaymentMethodName(order.paymentMethod)}</Text>
           </View>
        </View>
      </View>

      {/* Actions Section */}
      <View style={styles.actionsContainer}>
        {renderFarmerActionButtons()}
      </View>
    </ScrollView>
  );
}

// Styles definition (ensure all needed styles from confirmation screen are merged here)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral[50] },
  contentContainer: { paddingBottom: 32 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  errorText: { color: Colors.error.DEFAULT, marginBottom: 16, textAlign: 'center', fontSize: 16 },
  header: { alignItems: 'center', padding: 20, backgroundColor: Colors.neutral.white, borderBottomWidth: 1, borderBottomColor: Colors.neutral[200] },
  title: { fontSize: 22, fontWeight: '700', color: Colors.neutral[800], marginTop: 12, marginBottom: 4 },
  orderIdText: { fontSize: 14, color: Colors.neutral[500], marginBottom: 12 },
  dateText: { fontSize: 14, color: Colors.neutral[500], marginBottom: 16 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15, marginBottom: 8 },
  statusText: { fontSize: 12, fontWeight: '600', color: Colors.neutral.white },
  section: { backgroundColor: Colors.neutral.white, marginHorizontal: 16, marginTop: 16, borderRadius: 8, padding: 16, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 1 } },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: Colors.neutral[700], marginBottom: 12 },
  buyerInfoContainer: { gap: 12 },
  buyerDetailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  icon: { marginRight: 10 },
  buyerText: { fontSize: 16, color: Colors.neutral[800], flexShrink: 1 },
  phoneText: { color: Colors.primary.DEFAULT, fontWeight: '500' },
  itemsContainer: { gap: 8 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.neutral[100] },
  itemName: { flex: 1, fontSize: 15, color: Colors.neutral[700], marginLeft: 8 },
  itemQuantity: { fontSize: 15, color: Colors.neutral[600], marginRight: 10 },
  itemPrice: { fontSize: 15, fontWeight: '500', color: Colors.neutral[800], minWidth: 70, textAlign: 'right' },
  summaryContainer: { gap: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: 15, color: Colors.neutral[600] },
  summaryValue: { fontSize: 15, fontWeight: '500', color: Colors.neutral[800] },
  actionsContainer: { padding: 16, borderTopWidth: 1, borderTopColor: Colors.neutral[100], backgroundColor: Colors.neutral.white },
  actionButton: { marginBottom: 12 },
  // Status colors
  orderStatusPaid: { backgroundColor: Colors.success.light },
  orderStatusDelivering: { backgroundColor: Colors.warning.light },
  orderStatusDelivered: { backgroundColor: Colors.primary[100] },
  orderStatusReceived: { backgroundColor: Colors.primary.DEFAULT },
  orderStatusCancelled: { backgroundColor: Colors.error.light },
  orderStatusPending: { backgroundColor: Colors.neutral[200] },
  orderStatusTextPaid: { color: Colors.success.DEFAULT },
  orderStatusTextDelivering: { color: Colors.warning.dark },
  orderStatusTextDelivered: { color: Colors.primary.DEFAULT },
  orderStatusTextReceived: { color: Colors.neutral.white },
  orderStatusTextCancelled: { color: Colors.error.DEFAULT },
  orderStatusTextPending: { color: Colors.neutral[700] },
});

// Define helper functions outside the styles object
const getStatusStyle = (status: Order['status']): ViewStyle => 
  (styles[`orderStatus${status.charAt(0).toUpperCase() + status.slice(1)}` as keyof typeof styles] || styles.orderStatusPending) as ViewStyle;

const getStatusTextStyle = (status: Order['status']) => 
  styles[`orderStatusText${status.charAt(0).toUpperCase() + status.slice(1)}` as keyof typeof styles] || styles.orderStatusTextPending;

// End of file, removed comments and tag 