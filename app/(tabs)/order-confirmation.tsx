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
import { CircleCheck as CheckCircle2, PhoneCall, MapPin, Info } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Order, User } from '@/types';
import Button from '@/components/Button';
import Colors from '@/constants/Colors';

type OrderWithAddress = Order & {
  delivery_address?: string | null;
  delivery_details?: string | null;
};

export default function OrderConfirmationScreen() {
  const { orderId } = useLocalSearchParams();
  const [order, setOrder] = useState<OrderWithAddress | null>(null);
  const [farmerPhone, setFarmerPhone] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (orderId) {
      fetchOrderAndFarmer(String(orderId));
    }
  }, [orderId]);

  const fetchOrderAndFarmer = async (id: string) => {
    try {
      setLoading(true);
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*, items')
        .eq('id', id)
        .single();

      if (orderError) throw orderError;
      if (!orderData) throw new Error('Order data not found');

      setOrder(orderData as OrderWithAddress);

      const farmerId = orderData.items?.[0]?.farmerId;

      if (farmerId) {
        const { data: farmerData, error: farmerError } = await supabase
          .from('profiles')
          .select('phone')
          .eq('id', farmerId)
          .single();

        if (farmerError) {
          console.warn('Could not fetch farmer phone:', farmerError.message);
        } else if (farmerData) {
          setFarmerPhone(farmerData.phone);
        }
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
    router.push('/(tabs)/');
  };

  const handleViewProfile = () => {
    router.push('/(tabs)/profile');
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

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <CheckCircle2 size={60} color={Colors.success.DEFAULT} />
          <Text style={styles.title}>Commande confirmée!</Text>
          <Text style={styles.orderIdText}>Numéro de commande: #{order.id.slice(0, 8)}</Text>
        </View>

        {order.delivery_address && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Adresse de livraison</Text>
            <View style={styles.addressContainer}>
              <MapPin size={20} color={Colors.neutral[600]} style={styles.addressIcon} />
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
              <PhoneCall size={20} color={Colors.primary.DEFAULT} style={styles.phoneIcon} />
              <Text style={styles.phoneText}>{farmerPhone}</Text>
            </TouchableOpacity>
            <Text style={styles.infoTextSmall}>Appelez pour coordonner la livraison.</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Récapitulatif de la commande</Text>

          <View style={styles.orderItems}>
            {order.items.map((item) => (
              <View key={item.id} style={styles.orderItem}>
                <Text style={styles.itemName}>{item.name}</Text>
                <View style={styles.itemDetails}>
                  <Text style={styles.itemQuantity}>{item.quantity}x</Text>
                  <Text style={styles.itemPrice}>
                    {(item.price * item.quantity).toLocaleString()} CFA
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.orderSummary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Sous-total</Text>
              <Text style={styles.summaryValue}>
                {(order.total - 1000).toLocaleString()} CFA
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Livraison</Text>
              <Text style={styles.summaryValue}>1 000 CFA</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{order.total.toLocaleString()} CFA</Text>
            </View>
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
                ]}
              >
                {order.status === 'paid' ? 'Payé' : order.status}
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

        <View style={styles.actions}>
          <Button
            title="Continuer mes achats"
            onPress={handleContinueShopping}
            style={styles.button}
          />
          <Button
            title="Voir mon profil"
            onPress={handleViewProfile}
            variant="outline"
            style={styles.button}
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
  orderItems: {
    backgroundColor: Colors.neutral[50],
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  itemName: {
    flex: 1,
    fontSize: 16,
    color: Colors.neutral[800],
  },
  itemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemQuantity: {
    fontSize: 16,
    color: Colors.neutral[600],
    marginRight: 8,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.neutral[800],
    minWidth: 80,
    textAlign: 'right',
  },
  orderSummary: {
    backgroundColor: Colors.neutral[50],
    borderRadius: 8,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: Colors.neutral[600],
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.neutral[800],
  },
  divider: {
    height: 1,
    backgroundColor: Colors.neutral[300],
    marginVertical: 8,
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
    backgroundColor: Colors.success[100],
    color: Colors.success[700],
  },
  infoText: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.neutral[700],
  },
  actions: {
    padding: 16,
    gap: 12,
    marginBottom: 16,
  },
  button: {
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
});