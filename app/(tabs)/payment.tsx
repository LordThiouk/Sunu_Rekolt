import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { supabase } from '@/lib/supabase';
import TextInput from '@/components/TextInput';
import Button from '@/components/Button';
import Colors from '@/constants/Colors';
import { MapPin, Info } from 'lucide-react-native';
import { CartItem } from '@/types'; // Import CartItem type if not already

export default function PaymentScreen() {
  const [selectedMethod, setSelectedMethod] = useState('orange_money');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryDetails, setDeliveryDetails] = useState('');
  
  const router = useRouter();
  const { user } = useAuth();
  const { items, total, clearCart } = useCart();

  const paymentMethods = [
    { id: 'orange_money', name: 'Orange Money', icon: 'https://images.pexels.com/photos/7262407/pexels-photo-7262407.jpeg' },
    { id: 'wave', name: 'Wave', icon: 'https://images.pexels.com/photos/4968391/pexels-photo-4968391.jpeg' },
    { id: 'free_money', name: 'Free Money', icon: 'https://images.pexels.com/photos/6693655/pexels-photo-6693655.jpeg' },
  ];

  const handlePayment = async () => {
    if (!deliveryAddress) {
      Alert.alert('Erreur', 'Veuillez entrer votre adresse de livraison');
      return;
    }
    if (!phoneNumber) {
      Alert.alert('Erreur', 'Veuillez entrer votre numéro de téléphone');
      return;
    }
    if (!user) {
      Alert.alert('Erreur', 'Vous devez être connecté pour effectuer un paiement');
      return;
    }
    if (items.length === 0) {
       Alert.alert('Erreur', 'Votre panier est vide.');
       return;
    }

    setProcessingPayment(true);
    try {
      // --- Step 1: Create order in 'orders' table --- 
      console.log('[PaymentScreen] Creating order...');
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          buyer_id: user.id,
          total: total + 1000, // Including delivery fee
          status: 'paid', // Simulating successful payment
          payment_method: selectedMethod,
          delivery_address: deliveryAddress,
          delivery_details: deliveryDetails,
        })
        .select()
        .single();

      if (orderError) {
         console.error('[PaymentScreen] Error creating order:', orderError);
         throw orderError;
      }
      
      if (!order) {
        throw new Error('Failed to create order or retrieve order ID.');
      }
      
      console.log(`[PaymentScreen] Order created successfully. Order ID: ${order.id}`);

      // --- Step 2: Prepare and insert data into 'order_items' table --- 
      console.log('[PaymentScreen] Preparing order items...');
      const orderItemsData = items.map((cartItem: CartItem) => {
         // Ensure cartItem has necessary fields
         if (!cartItem.productId || !cartItem.farmerId || typeof cartItem.price !== 'number') {
            console.error('[PaymentScreen] Invalid cart item data:', cartItem);
            // Throw an error to stop the process if data is invalid
            throw new Error(`Données produit invalides dans le panier pour ${cartItem.name || 'un produit'}. ProductId, FarmerId ou Price manquant.`);
         }
         return {
            order_id: order.id,
            product_id: cartItem.productId,
            farmer_id: cartItem.farmerId,
            quantity: cartItem.quantity,
            price_at_time: cartItem.price,
         };
      });
      
      console.log(`[PaymentScreen] Inserting ${orderItemsData.length} order items...`);
      const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItemsData);

      if (itemsError) {
        console.error('[PaymentScreen] Error inserting order items:', itemsError);
        // Optional: Attempt to delete the order created in Step 1 for consistency?
        // await supabase.from('orders').delete().eq('id', order.id);
        throw itemsError;
      }
      
      console.log('[PaymentScreen] Order items inserted successfully.');

      // --- Step 3: Simulate processing, clear cart, navigate --- 
      console.log('[PaymentScreen] Simulating post-payment processing...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Shortened delay
      clearCart();
      console.log('[PaymentScreen] Navigating to order confirmation...');
      router.push({
        pathname: '/(tabs)/order-confirmation',
        params: { orderId: order.id }
      });

    } catch (error) {
      console.error('[PaymentScreen] Payment processing failed:', error);
      const message = error instanceof Error ? error.message : 'Une erreur inconnue est survenue.';
      Alert.alert('Erreur de paiement', ` ${message} Veuillez réessayer.`);
    } finally {
      setProcessingPayment(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Paiement</Text>
          <Text style={styles.subtitle}>Confirmez les détails de livraison et paiement</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Récapitulatif de la commande</Text>
          <View style={styles.orderSummary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Sous-total</Text>
              <Text style={styles.summaryValue}>{total.toLocaleString()} CFA</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Livraison</Text>
              <Text style={styles.summaryValue}>1 000 CFA</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{(total + 1000).toLocaleString()} CFA</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Adresse de livraison</Text>
          <TextInput
            label="Adresse principale"
            value={deliveryAddress}
            onChangeText={setDeliveryAddress}
            placeholder="Quartier, rue, numéro de maison..."
            icon={<MapPin size={20} color={Colors.neutral[600]} />}
          />
          <TextInput
            label="Détails supplémentaires (optionnel)"
            value={deliveryDetails}
            onChangeText={setDeliveryDetails}
            placeholder="Étage, bâtiment, point de repère..."
            icon={<Info size={20} color={Colors.neutral[600]} />}
            multiline
            numberOfLines={3}
            style={{ height: 80 }}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Méthode de paiement</Text>
          
          <View style={styles.paymentMethods}>
            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentMethodCard,
                  selectedMethod === method.id && styles.selectedPaymentMethod,
                ]}
                onPress={() => setSelectedMethod(method.id)}
              >
                <Image source={{ uri: method.icon }} style={styles.paymentMethodIcon} />
                <Text style={styles.paymentMethodName}>{method.name}</Text>
                <View style={styles.radioButton}>
                  {selectedMethod === method.id && <View style={styles.radioButtonInner} />}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Détails du paiement</Text>
          
          <TextInput
            label="Numéro de téléphone Mobile Money"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="Numéro pour la confirmation du paiement"
            keyboardType="phone-pad"
          />
          
          <Text style={styles.infoText}>
            Vous recevrez une demande de confirmation sur votre téléphone pour valider le paiement.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={processingPayment ? 'Traitement en cours...' : 'Payer maintenant'}
          onPress={handlePayment}
          disabled={processingPayment || items.length === 0}
          loading={processingPayment}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
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
  paymentMethods: {
    gap: 12,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.neutral[50],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
  },
  selectedPaymentMethod: {
    borderColor: Colors.primary.DEFAULT,
    borderWidth: 2,
    backgroundColor: Colors.primary[50],
  },
  paymentMethodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  paymentMethodName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: Colors.neutral[800],
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.primary.DEFAULT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary.DEFAULT,
  },
  infoText: {
    marginTop: 16,
    fontSize: 14,
    color: Colors.neutral[600],
    fontStyle: 'italic',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[200],
  },
});