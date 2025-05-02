import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Product } from '@/types';
import Colors from '@/constants/Colors';

interface ProductCardProps {
  product: Product;
  onPress?: () => void;
  compact?: boolean;
}

export default function ProductCard({ 
  product, 
  onPress,
  compact = false
}: ProductCardProps) {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/(tabs)/catalog/${product.id}`);
    }
  };

  return (
    <Pressable 
      style={[styles.container, compact && styles.compactContainer]} 
      onPress={handlePress}
    >
      <Image
        source={{ uri: product.imageUrl }}
        style={[styles.image, compact && styles.compactImage]}
        contentFit="cover"
        transition={300}
      />
      <View style={styles.content}>
        <Text 
          style={[styles.name, compact && styles.compactName]} 
          numberOfLines={1}
        >
          {product.name}
        </Text>
        <Text style={styles.price}>
          {product.price.toLocaleString()} CFA/{product.unit}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.quantity}>
            {product.quantity} {product.unit} disponible
          </Text>
          {!compact && (
            <Text style={styles.farmer} numberOfLines={1}>
              Par: {product.farmerName}
            </Text>
          )}
        </View>
      </View>
      {!product.isApproved && (
        <View style={styles.pendingBadge}>
          <Text style={styles.pendingText}>En attente</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.neutral.white,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: Colors.neutral.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 16,
  },
  compactContainer: {
    width: 160,
    marginRight: 12,
  },
  image: {
    width: '100%',
    height: 180,
  },
  compactImage: {
    height: 120,
  },
  content: {
    padding: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral[800],
    marginBottom: 4,
  },
  compactName: {
    fontSize: 16,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary.DEFAULT,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantity: {
    fontSize: 14,
    color: Colors.neutral[600],
  },
  farmer: {
    fontSize: 14,
    color: Colors.neutral[600],
    flex: 1,
    textAlign: 'right',
  },
  pendingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.warning.DEFAULT,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pendingText: {
    color: Colors.neutral.white,
    fontSize: 12,
    fontWeight: '600',
  },
});