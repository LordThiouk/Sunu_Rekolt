import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import Colors from '@/constants/Colors';
import Button from '@/components/Button';

export default function FarmerDashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();

  // Placeholder data - In a real app, this would come from API calls
  const salesData = {
    currentMonthSales: '150,000 FCFA',
    totalSales: '1,250,000 FCFA',
  };
  const ordersData = {
    newOrders: 5,
    pendingOrders: 2,
  };
  const reliabilityScore = 92; // Percentage

  const navigateToAddProduct = () => {
    router.push('/(tabs)/product/add');
  };

  const navigateToOrders = () => {
    router.push('/(tabs)/farmer-orders');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Welcome Message */}
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeText}>Bonjour, {user?.name || 'Agriculteur'}!</Text>
          <Text style={styles.welcomeSubtext}>Voici un aperçu de votre activité.</Text>
        </View>

        {/* Key Metrics Section */}
        <View style={styles.metricsGrid}>
          <TouchableOpacity style={[styles.metricCard]}>
            <View style={styles.iconContainer}>
              <Feather name="trending-up" size={24} color={Colors.primary.DEFAULT} />
            </View>
            <Text style={styles.metricValue}>{salesData.currentMonthSales}</Text>
            <Text style={styles.metricLabel}>Ventes (ce mois)</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.metricCard]} 
            onPress={navigateToOrders}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(255, 109, 0, 0.1)' }]}>
              <Feather name="box" size={24} color={Colors.secondary.DEFAULT} />
            </View>
            <Text style={styles.metricValue}>{ordersData.newOrders} Nouvelle(s)</Text>
            <Text style={styles.metricLabel}>Commandes à traiter</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.metricCard]}>
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <Feather name="shield" size={24} color="#10B981" />
            </View>
            <Text style={styles.metricValue}>{reliabilityScore}%</Text>
            <Text style={styles.metricLabel}>Score de Fiabilité</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.metricCard]}>
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(93, 64, 55, 0.1)' }]}>
              <Feather name="bar-chart-2" size={24} color={Colors.accent.DEFAULT} />
            </View>
            <Text style={styles.metricValue}>{salesData.totalSales}</Text>
            <Text style={styles.metricLabel}>Ventes Totales</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions Section */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Actions Rapides</Text>
          <TouchableOpacity 
            style={styles.addProductButton}
            onPress={navigateToAddProduct}
            activeOpacity={0.8}
          >
            <View style={styles.buttonIconContainer}>
              <Feather name="plus" size={20} color={Colors.neutral.white} />
            </View>
            <Text style={styles.addProductButtonText}>Ajouter un nouveau produit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.viewOrdersButton}
            onPress={navigateToOrders}
            activeOpacity={0.8}
          >
            <View style={[styles.buttonIconContainer, styles.outlineIconContainer]}>
              <Feather name="shopping-bag" size={20} color={Colors.primary.DEFAULT} />
            </View>
            <Text style={styles.viewOrdersButtonText}>Voir toutes mes commandes</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  },
  contentContainer: {
    padding: 20,
  },
  welcomeCard: {
    backgroundColor: Colors.primary[50],
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 5,
    borderLeftColor: Colors.primary.DEFAULT,
  },
  welcomeText: {
    fontSize: 20,
    fontFamily: 'BalooBhai2_600SemiBold',
    color: Colors.primary.DEFAULT,
  },
  welcomeSubtext: {
    fontSize: 14,
    fontFamily: 'BalooBhai2_400Regular',
    color: Colors.neutral[700],
    marginTop: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  metricCard: {
    backgroundColor: Colors.neutral.white,
    borderRadius: 12,
    padding: 16,
    width: '48%', // Two cards per row with a small gap
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: Colors.neutral.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 18,
    fontFamily: 'BalooBhai2_600SemiBold',
    color: Colors.neutral[800],
    marginTop: 8,
    textAlign: 'center',
  },
  metricLabel: {
    fontSize: 13,
    fontFamily: 'BalooBhai2_400Regular',
    color: Colors.neutral[600],
    marginTop: 4,
    textAlign: 'center',
  },
  actionsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'BalooBhai2_600SemiBold',
    color: Colors.neutral[700],
    marginBottom: 16,
  },
  addProductButton: {
    backgroundColor: Colors.primary.DEFAULT,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIconContainer: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  outlineIconContainer: {
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
  },
  addProductButtonText: {
    fontSize: 16,
    fontFamily: 'BalooBhai2_600SemiBold',
    color: Colors.neutral.white,
  },
  viewOrdersButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.primary.DEFAULT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewOrdersButtonText: {
    fontSize: 16,
    fontFamily: 'BalooBhai2_600SemiBold',
    color: Colors.primary.DEFAULT,
  },
}); 