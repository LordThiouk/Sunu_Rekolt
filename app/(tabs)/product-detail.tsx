import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams(); // Example if it were a dynamic route like product/[id]
                                      // For a static product-detail, params might come differently or not at all.

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Product Detail</Text>
      <Text>Details for product {id ? id : 'N/A'}</Text>
      {/* TODO: Implement product detail view here */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
}); 