import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';
import Colors from '@/constants/Colors';
import { Package, ShoppingBag, TrendingUp, Award } from 'lucide-react-native';
import { CartItem } from '@/types';

interface ActivityStats {
  totalOrders: number;
  totalProducts: number;
  monthlyOrders: { month: string; count: number }[];
  topProduct: {
    name: string;
    totalSold: number;
  } | null;
}

export default function ActivityDashboard({ farmerId }: { farmerId: string }) {
  const [stats, setStats] = useState<ActivityStats>({
    totalOrders: 0,
    totalProducts: 0,
    monthlyOrders: [],
    topProduct: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [farmerId]);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Fetch total products
      const { count: totalProducts, error: productsError } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('farmer_id', farmerId);

      if (productsError) throw productsError;

      // Fetch orders related to the farmer using a join
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          created_at,
          items,
          order_items!inner(farmer_id)
        `)
        .eq('status', 'paid')
        .eq('order_items.farmer_id', farmerId);

      if (ordersError) {
          console.error("Order fetch error details:", ordersError);
          throw ordersError;
      }

      // Process orders to get monthly stats and top product
      const monthlyStats = new Map<string, number>();
      const productSales = new Map<string, { name: string, quantity: number }>();

      orders?.forEach(order => {
        // Monthly stats
        const month = new Date(order.created_at).toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: 'long'
        });
        monthlyStats.set(month, (monthlyStats.get(month) || 0) + 1);

        // Product sales - Ensure items is an array before iterating
        const itemsArray: CartItem[] = Array.isArray(order.items) ? order.items : [];
        itemsArray.forEach((item: CartItem) => {
          // Ensure item has farmerId and it matches (though query should pre-filter)
          if (item.farmerId && item.farmerId === farmerId) {
             const existing = productSales.get(item.productId);
             productSales.set(
               item.productId,
               {
                 name: item.name,
                 quantity: (existing?.quantity || 0) + item.quantity
               }
             );
          }
        });
      });

      // Find top product
      let topProductResult = null;
      let maxSales = 0;
      productSales.forEach((saleInfo, productId) => {
        if (saleInfo.quantity > maxSales) {
          maxSales = saleInfo.quantity;
          topProductResult = { name: saleInfo.name, totalSold: saleInfo.quantity };
        }
      });

      setStats({
        totalOrders: orders?.length || 0,
        totalProducts: totalProducts || 0,
        monthlyOrders: Array.from(monthlyStats.entries())
          .map(([month, count]) => ({ month, count }))
          .sort((a, b) => {
             const [monthA, yearA] = a.month.split(' ');
             const [monthB, yearB] = b.month.split(' ');
             const dateA = new Date(`${monthA} 1, ${yearA}`);
             const dateB = new Date(`${monthB} 1, ${yearB}`);
             if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return 0;
             return dateB.getTime() - dateA.getTime();
          })
          .slice(0, 6)
          .reverse(),
        topProduct: topProductResult,
      });
    } catch (error) {
      if (error instanceof Error) {
          console.error('Error fetching activity stats:', error.message);
          if ('details' in error) {
            console.error('Activity stats error details:', (error as any).details);
          }
      } else {
          console.error('Unknown error fetching activity stats:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary.DEFAULT} />
        <Text style={styles.loadingText}>Chargement des statistiques...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={[styles.iconContainer, { backgroundColor: Colors.primary[50] }]}>
            <ShoppingBag size={24} color={Colors.primary.DEFAULT} />
          </View>
          <Text style={styles.statValue}>{stats.totalOrders}</Text>
          <Text style={styles.statLabel}>Commandes reçues</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.iconContainer, { backgroundColor: Colors.secondary[50] }]}>
            <Package size={24} color={Colors.secondary.DEFAULT} />
          </View>
          <Text style={styles.statValue}>{stats.totalProducts}</Text>
          <Text style={styles.statLabel}>Produits ajoutés</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <TrendingUp size={20} color={Colors.neutral[700]} />
          <Text style={styles.sectionTitle}>Évolution des ventes</Text>
        </View>
        <View style={styles.chart}>
          {stats.monthlyOrders.map((data, index) => (
            <View key={data.month} style={styles.chartBar}>
              <View 
                style={[
                  styles.bar,
                  { 
                    height: `${(data.count / Math.max(...stats.monthlyOrders.map(d => d.count))) * 100}%`,
                    backgroundColor: Colors.primary[index % 2 === 0 ? 'DEFAULT' : '600']
                  }
                ]} 
              />
              <Text style={styles.chartLabel}>
                {data.month.split(' ')[0].slice(0, 3)}
              </Text>
              <Text style={styles.chartValue}>{data.count}</Text>
            </View>
          ))}
        </View>
      </View>

      {stats.topProduct && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Award size={20} color={Colors.neutral[700]} />
            <Text style={styles.sectionTitle}>Produit le plus vendu</Text>
          </View>
          <View style={styles.topProduct}>
            <Text style={styles.topProductName}>{stats.topProduct.name}</Text>
            <Text style={styles.topProductSales}>
              {stats.topProduct.totalSold} unités vendues
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.neutral[600],
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: Colors.neutral.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.neutral[800],
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.neutral[600],
    textAlign: 'center',
  },
  section: {
    backgroundColor: Colors.neutral.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral[800],
    marginLeft: 8,
  },
  chart: {
    flexDirection: 'row',
    height: 200,
    alignItems: 'flex-end',
    paddingTop: 20,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '60%',
    backgroundColor: Colors.primary.DEFAULT,
    borderRadius: 4,
    minHeight: 4,
  },
  chartLabel: {
    fontSize: 12,
    color: Colors.neutral[600],
    marginTop: 8,
  },
  chartValue: {
    fontSize: 12,
    color: Colors.neutral[700],
    fontWeight: '500',
  },
  topProduct: {
    backgroundColor: Colors.primary[50],
    borderRadius: 8,
    padding: 12,
  },
  topProductName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary.DEFAULT,
    marginBottom: 4,
  },
  topProductSales: {
    fontSize: 14,
    color: Colors.neutral[700],
  },
});