import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Alert 
} from 'react-native';
import { useRouter } from 'expo-router';
import { CreditCard } from 'lucide-react-native';
import { useCart } from '@/context/CartContext';
import CartItem from '@/components/CartItem';
import Button from '@/components/Button';
import Colors from '@/constants/Colors';

export default function CartScreen() {
  const { items, removeItem, updateQuantity, total, clearCart } = useCart();
  const router = useRouter();

  const handleRemoveItem = (productId: string) => {
    Alert.alert(
      'Supprimer l\'article',
      'Êtes-vous sûr de vouloir supprimer cet article du panier?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => removeItem(productId) }
      ]
    );
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      Alert.alert('Panier vide', 'Ajoutez des produits au panier avant de procéder au paiement.');
      return;
    }
    
    router.push('/(tabs)/payment');
  };

  const handleClearCart = () => {
    if (items.length === 0) return;
    
    Alert.alert(
      'Vider le panier',
      'Êtes-vous sûr de vouloir vider votre panier?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Vider', style: 'destructive', onPress: () => clearCart() }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mon Panier</Text>
        {items.length > 0 && (
          <Button
            title="Vider"
            onPress={handleClearCart}
            variant="ghost"
            size="small"
            style={styles.clearButton}
            textStyle={styles.clearButtonText}
          />
        )}
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Votre panier est vide</Text>
          <Button
            title="Parcourir les produits"
            onPress={() => router.push('/(tabs)/')}
            variant="outline"
            style={styles.browseButton}
          />
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <CartItem
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={handleRemoveItem}
              />
            )}
            contentContainerStyle={styles.itemsList}
            showsVerticalScrollIndicator={false}
          />

          <View style={styles.footer}>
            <View style={styles.summary}>
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

            <Button
              title="Procéder au paiement"
              onPress={handleCheckout}
              icon={<CreditCard size={20} color="#fff" />}
            />
          </View>
        </>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.neutral.white,
  },
  clearButton: {
    backgroundColor: 'transparent',
  },
  clearButtonText: {
    color: Colors.neutral.white,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    color: Colors.neutral[600],
    marginBottom: 16,
  },
  browseButton: {
    minWidth: 200,
  },
  itemsList: {
    padding: 16,
  },
  footer: {
    padding: 16,
    backgroundColor: Colors.neutral.white,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[200],
  },
  summary: {
    marginBottom: 16,
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
    fontSize: 22,
    fontWeight: '700',
    color: Colors.primary.DEFAULT,
  },
});