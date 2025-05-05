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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Order, User, OrderItemWithProduct } from '@/types';
import Button from '@/components/Button';
import Colors from '@/constants/Colors';

// Define a type specific to this screen's order state
type OrderForConfirmation = Order & {
  // No longer need buyerId here as it's in the base Order type
  // Keep delivery fields if needed
  delivery_address?: string | null;
  delivery_details?: string | null;
  // Ensure items uses the correct detailed type
  items: OrderItemWithProduct[]; 
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

export default function OrderConfirmationScreen() {
  const { orderId } = useLocalSearchParams();
  // Use the more specific type for the state
  const [order, setOrder] = useState<OrderForConfirmation | null>(null);
  const [farmerPhone, setFarmerPhone] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (orderId) {
      fetchOrderAndFarmer(String(orderId));
    }
  }, [orderId]);

  const fetchOrderAndFarmer = async (id: string) => {
    try {
      setLoading(true);
      // Step 1: Fetch basic order data (allowed by buyer RLS)
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('id, buyer_id, total, status, payment_method, created_at, delivery_address, delivery_details') 
        .eq('id', id)
        .single();

      if (orderError) throw orderError;
      if (!orderData) throw new Error('Order data not found');
      
      // Step 2: Fetch associated order items using the RPC function
      console.log(`[OrderConfirmation] Fetching items via RPC for order ID: ${orderData.id}`);
      const { data: itemsData, error: itemsError } = await supabase
        .rpc('get_order_items_for_buyer', { p_order_id: orderData.id });

      if (itemsError) {
         console.error('[OrderConfirmation] Error fetching order items via RPC:', itemsError);
         throw itemsError; 
      }
      
      console.log(`[OrderConfirmation] Found ${itemsData?.length || 0} items for order via RPC.`);
      
      // Step 3: Combine order data and items data 
      const fullOrderData: OrderForConfirmation = {
        ...orderData,
        buyerId: orderData.buyer_id,
        paymentMethod: orderData.payment_method,
        createdAt: orderData.created_at,
        // RPC returns items with product_name and item_id
        items: (itemsData || []).map((item: any) => ({ 
           // Map RPC fields to the OrderItemWithProduct structure
           id: item.item_id, // Map item_id -> id
           order_id: orderData.id, // Add order_id
           product_id: item.product_id || null, // Add product_id (might be null from RPC? check function)
           farmer_id: item.farmer_id || null, // Add farmer_id (might be null from RPC? check function)
           quantity: item.quantity,
           price_at_time: item.price_at_time,
           created_at: orderData.created_at, // Use order creation time for items?
           product: { // Construct nested product object
             id: item.product_id || 'unknown', 
             name: item.product_name, // Map product_name -> product.name
             image_url: item.product_image_url || '' // Map product_image_url (if available)
           }
        })),
      };
      
      // Extract farmerId from the *mapped* items
      const farmerId = fullOrderData.items?.[0]?.farmer_id;
      setOrder(fullOrderData);

      // Step 4: Fetch farmer phone
      if (farmerId) {
        console.log('[OrderConfirmation] Attempting to fetch profile for farmer ID:', farmerId);
        const { data: farmerData, error: farmerError } = await supabase
          .from('profiles')
          .select('phone')
          .eq('id', farmerId)
          .single();

        if (farmerError) {
          // Add more specific logging for the PGRST116 error
          console.error('Error fetching farmer profile:', farmerError);
          if (farmerError.code === 'PGRST116') {
            console.error(`--> No profile found in public.profiles for farmer ID: ${farmerId}`);
            Alert.alert('Erreur Vendeur', 'Profil du vendeur introuvable. Impossible d\'afficher le numéro.');
          } else {
             Alert.alert('Erreur', 'Impossible de charger les informations du vendeur.');
          }
          // Set phone to null or handle gracefully instead of just warning
          setFarmerPhone(null); 
        } else if (farmerData) {
          console.log('[OrderConfirmation] Farmer phone fetched successfully:', farmerData.phone);
          setFarmerPhone(farmerData.phone);
        }
      } else {
        console.warn('[OrderConfirmation] Could not extract farmerId from order items.');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      Alert.alert('Erreur', 'Impossible de charger les détails de la commande');
    } finally {
      setLoading(false);
    }
  };

  const handleCallFarmer = () => {
    if (farmerPhone) {
      Linking.openURL(`tel:${farmerPhone}`);
    } else {
      Alert.alert('Erreur', 'Numéro de téléphone indisponible.');
    }
  };

  const getPaymentMethodName = (method: string | null | undefined) => {
    switch (method) {
      case 'orange_money':
        return 'Orange Money';
      case 'wave':
        return 'Wave';
      case 'free_money':
        return 'Free Money';
      default:
        return method || 'Inconnu';
    }
  };

  const handleContinueShopping = () => {
    router.push('/');
  };

  const handleViewProfile = () => {
    router.push('/(tabs)/profile');
  };

  const handleConfirmReception = async () => {
    if (!order || !user || user.id !== order.buyerId) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'received' })
        .eq('id', order.id);

      if (error) throw error;

      setOrder((prevOrder) => prevOrder ? { ...prevOrder, status: 'received' } : null);

      Alert.alert("Succès", "Commande marquée comme reçue. Le paiement au vendeur sera initié.");

    } catch (error) {
       const message = error instanceof Error ? error.message : 'Une erreur inconnue est survenue.';
       console.error('Error confirming order reception:', error);
       Alert.alert("Erreur", `Impossible de confirmer la réception: ${message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary.DEFAULT} />
        <Text style={styles.loadingText}>Chargement de votre commande...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Commande non trouvée. Veuillez vérifier vos commandes dans votre profil.
        </Text>
        <Button title="Aller au profil" onPress={handleViewProfile} />
      </View>
    );
  }

  // Add console logs here for debugging
  console.log('[OrderConfirmation] Debug Button Render:');
  console.log('  - User ID:', user?.id);
  console.log('  - Order Buyer ID:', order?.buyerId);
  console.log('  - Order Status:', order?.status);
  console.log('  - Condition Met (user?.id === order.buyerId):', user?.id === order?.buyerId);
  console.log("  - Condition Met (order.status === 'delivered'):", order?.status === 'delivered');

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Feather name="check-circle" size={60} color={Colors.success.DEFAULT} />
          <Text style={styles.title}>Commande confirmée!</Text>
          <Text style={styles.orderIdText}>Numéro de commande: #{order.id.slice(0, 8)}</Text>
        </View>

        {order.delivery_address && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Adresse de livraison</Text>
            <View style={styles.addressContainer}>
              <Feather name="map-pin" size={20} color={Colors.neutral[600]} style={styles.addressIcon} />
              <View>
                <Text style={styles.addressText}>{order.delivery_address}</Text>
                {order.delivery_details && (
                  <Text style={styles.addressDetailsText}>{order.delivery_details}</Text>
                )}
              </View>
            </View>
          </View>
        )}

        {farmerPhone && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contacter le vendeur</Text>
            <TouchableOpacity style={styles.phoneContainer} onPress={handleCallFarmer}>
              <Feather name="phone" size={20} color={Colors.primary.DEFAULT} style={styles.phoneIcon} />
              <Text style={styles.phoneText}>{farmerPhone}</Text>
            </TouchableOpacity>
            <Text style={styles.infoTextSmall}>Appelez pour coordonner la livraison.</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Résumé de la commande</Text>
          {order.items.map((item) => (
            <View key={item.id} style={styles.itemContainer}>
              <View style={styles.itemDetails}>
                <Text style={styles.itemName}>{item.product?.name || 'Produit inconnu'}</Text>
                <Text style={styles.itemInfo}>Quantité: {item.quantity}</Text>
                <Text style={styles.itemInfo}>Prix unitaire: {item.price_at_time?.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}</Text>
              </View>
              <Text style={styles.itemTotal}>
                 {(item.quantity * (item.price_at_time ?? 0)).toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}
              </Text>
            </View>
          ))}
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Montant total:</Text>
            <Text style={styles.totalValue}>{order.total?.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}</Text>
          </View>
          <View style={styles.infoNoteContainer}>
             <Feather name="info" size={16} color={Colors.neutral[500]} style={styles.infoIcon} />
             <Text style={styles.infoNoteText}>Le paiement a été effectué via {getPaymentMethodName(order.paymentMethod)}.</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Détails du paiement</Text>
          <View style={styles.paymentDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Méthode de paiement</Text>
              <Text style={styles.detailValue}>
                {getPaymentMethodName(order.paymentMethod)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Statut</Text>
              <Text
                style={[
                  styles.statusBadge,
                  order.status === 'paid' && styles.statusPaid,
                  order.status === 'delivering' && styles.statusDelivering,
                  order.status === 'delivered' && styles.statusDelivered,
                  order.status === 'received' && styles.statusReceived,
                ]}
              >
                {getStatusText(order.status)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>
                {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.infoText}>
            Votre commande a été traitée avec succès. Vous recevrez bientôt une confirmation de la part des agriculteurs concernés. 
            Vous pouvez suivre l'état de votre commande dans la section "Mes commandes" de votre profil.
          </Text>
        </View>

        <View style={styles.bottomActions}>
          {user?.id === order.buyerId && order.status === 'delivered' && (
            <Button
              title="Confirmer la réception"
              onPress={handleConfirmReception}
              loading={isUpdating}
              variant="primary"
            />
          )}
          {order.status === 'received' && (
            <View style={styles.infoNoteContainer}> 
                <Feather name="check-circle" size={16} color={Colors.success.DEFAULT} style={styles.infoIcon} />
                <Text style={[styles.infoNoteText, {color: Colors.success.DEFAULT}]}>Vous avez confirmé la réception.</Text>
             </View>
          )}
          <Button
            title="Continuer les achats"
            onPress={handleContinueShopping}
            variant="outline"
            style={styles.continueButton}
          />
        </View>
      </ScrollView>
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
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.neutral[600],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: Colors.neutral[700],
    textAlign: 'center',
    marginBottom: 24,
  },
  header: {
    backgroundColor: Colors.primary[50],
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary.DEFAULT,
    marginTop: 16,
    marginBottom: 8,
  },
  orderIdText: {
    fontSize: 16,
    color: Colors.neutral[600],
  },
  section: {
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral[800],
    marginBottom: 16,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  itemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemName: {
    flex: 1,
    fontSize: 16,
    color: Colors.neutral[800],
  },
  itemInfo: {
    fontSize: 14,
    color: Colors.neutral[600],
    marginRight: 8,
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.neutral[800],
    minWidth: 80,
    textAlign: 'right',
  },
  totalContainer: {
    backgroundColor: Colors.neutral[50],
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral[800],
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary.DEFAULT,
  },
  paymentDetails: {
    backgroundColor: Colors.neutral[50],
    borderRadius: 8,
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 16,
    color: Colors.neutral[600],
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.neutral[800],
    flexShrink: 1,
    textAlign: 'right',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 14,
    fontWeight: '600',
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  statusPaid: {
    backgroundColor: Colors.success.light,
    color: Colors.success.DEFAULT,
  },
  statusDelivering: {
    backgroundColor: Colors.warning.light,
    color: Colors.warning.dark,
  },
  statusDelivered: {
    backgroundColor: Colors.primary[100],
    color: Colors.primary.DEFAULT,
  },
  statusReceived: {
    backgroundColor: Colors.success.DEFAULT,
    color: Colors.neutral.white,
  },
  infoText: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.neutral[700],
  },
  bottomActions: {
    padding: 16,
    gap: 12,
    marginBottom: 16,
  },
  continueButton: {
    marginBottom: 12,
  },
  addressContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.neutral[50],
    borderRadius: 8,
    padding: 16,
    alignItems: 'flex-start',
  },
  addressIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  addressText: {
    fontSize: 16,
    color: Colors.neutral[800],
    marginBottom: 4,
  },
  addressDetailsText: {
    fontSize: 14,
    color: Colors.neutral[600],
  },
  phoneContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.primary[50],
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primary[200],
  },
  phoneIcon: {
    marginRight: 12,
  },
  phoneText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary.DEFAULT,
    letterSpacing: 1,
  },
  infoTextSmall: {
    fontSize: 13,
    color: Colors.neutral[500],
    textAlign: 'center',
    marginTop: 8,
  },
  infoNoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: Colors.neutral[50],
    borderRadius: 4,
  },
  infoIcon: {
    marginRight: 8,
  },
  infoNoteText: {
    fontSize: 14,
    color: Colors.neutral[700],
  },
});