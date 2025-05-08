import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import Colors from '@/constants/Colors';

export default function MyProductsScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Mes Produits</Text>
        <Text style={styles.placeholder}>Cette page affichera la liste de vos produits.</Text>
        <Text style={styles.placeholder}>Fonctionnalité à venir.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.neutral[100],
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: 'BalooBhai2_600SemiBold',
    color: Colors.neutral[800],
    marginBottom: 16,
  },
  placeholder: {
    fontSize: 16,
    fontFamily: 'BalooBhai2_400Regular',
    color: Colors.neutral[600],
    textAlign: 'center',
    marginBottom: 8,
  },
}); 