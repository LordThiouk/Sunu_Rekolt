import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Minus, Plus, Trash2 } from 'lucide-react-native';
import { CartItem as CartItemType } from '@/types';
import Colors from '@/constants/Colors';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}

export default function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  const increaseQuantity = () => {
    onUpdateQuantity(item.productId, item.quantity + 1);
  };

  const decreaseQuantity = () => {
    if (item.quantity > 1) {
      onUpdateQuantity(item.productId, item.quantity - 1);
    } else {
      onRemove(item.productId);
    }
  };

  const handleRemove = () => {
    onRemove(item.productId);
  };

  return (
    <View style={styles.container}>
      <Image source={{ uri: item.imageUrl }} style={styles.image} />
      <View style={styles.details}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.price}>{item.price.toLocaleString()} CFA</Text>
        <View style={styles.quantityContainer}>
          <TouchableOpacity 
            style={styles.quantityButton} 
            onPress={decreaseQuantity}
          >
            <Minus size={16} color={Colors.neutral[700]} />
          </TouchableOpacity>
          <Text style={styles.quantity}>{item.quantity}</Text>
          <TouchableOpacity 
            style={styles.quantityButton} 
            onPress={increaseQuantity}
          >
            <Plus size={16} color={Colors.neutral[700]} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.actions}>
        <Text style={styles.total}>
          {(item.price * item.quantity).toLocaleString()} CFA
        </Text>
        <TouchableOpacity style={styles.removeButton} onPress={handleRemove}>
          <Trash2 size={20} color={Colors.error.DEFAULT} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.neutral.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    elevation: 1,
    shadowColor: Colors.neutral.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 6,
  },
  details: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral[800],
  },
  price: {
    fontSize: 14,
    color: Colors.neutral[600],
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    backgroundColor: Colors.neutral[200],
    borderRadius: 4,
    padding: 4,
  },
  quantity: {
    fontSize: 16,
    fontWeight: '500',
    marginHorizontal: 12,
    minWidth: 25,
    textAlign: 'center',
  },
  actions: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  total: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary.DEFAULT,
  },
  removeButton: {
    padding: 4,
  },
});