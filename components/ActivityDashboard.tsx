import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';
import Colors from '@/constants/Colors';
import { Feather } from '@expo/vector-icons';

interface MonthlyOrderStat {
  month: string; // Format might differ from RPC, adjust if needed
  count: number;
}

interface TopProductStat {
  name: string;
  totalSold: number;
}

interface ActivityStats {
  totalOrders: number; // We can derive this from monthly stats
  totalProducts: number;
  monthlyOrders: MonthlyOrderStat[];
  topProduct: TopProductStat | null;
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
      console.log(`[ActivityDashboard] Fetching stats for farmer: ${farmerId}`);

      // --- 1. Fetch total products (Correct) ---
      console.log(`[ActivityDashboard] Fetching total products...`);
      const { count: totalProducts, error: productsError } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('farmer_id', farmerId);

      if (productsError) throw productsError;
      console.log(`[ActivityDashboard] Total products found: ${totalProducts}`);

      // --- 2. Fetch monthly sales using RPC --- 
      console.log(`[ActivityDashboard] Fetching monthly sales via RPC...`);
      const { data: monthlySalesData, error: monthlySalesError } = await supabase
        .rpc('get_farmer_monthly_sales', {
           farmer_id: farmerId,
           start_date: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString() // Approx 6 months ago
        });
        
      if (monthlySalesError) {
         console.error("[ActivityDashboard] Error fetching monthly sales:", monthlySalesError);
         throw monthlySalesError;
      }
      console.log("[ActivityDashboard] Monthly sales data:", monthlySalesData);
      
      const formattedMonthlyOrders: MonthlyOrderStat[] = (monthlySalesData || []).map((row: any) => ({
          month: new Date(row.month).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' }),
          count: Number(row.total_orders) || 0 // Ensure count is a number
      })).sort((a: any, b: any) => new Date(a.month).getTime() - new Date(b.month).getTime()); // Sort chronologically if needed by chart
      
      const totalOrdersFromStats = formattedMonthlyOrders.reduce((sum, month) => sum + month.count, 0);

      // --- 3. Fetch top product using RPC ---
      console.log(`[ActivityDashboard] Fetching top product via RPC...`);
      const { data: topProductData, error: topProductError } = await supabase
        .rpc('get_farmer_top_products', {
            farmer_id: farmerId,
            limit_count: 1
        });

      if (topProductError) {
          console.error("[ActivityDashboard] Error fetching top product:", topProductError);
          throw topProductError;
      }
      console.log("[ActivityDashboard] Top product data:", topProductData);
      
      let topProductResult: TopProductStat | null = null;
      if (topProductData && topProductData.length > 0) {
          const top = topProductData[0];
          topProductResult = {
             name: top.product_name,
             totalSold: Number(top.total_quantity) || 0 // Ensure quantity is a number
          };
      }

      console.log("[ActivityDashboard] Setting final stats state...");
      setStats({
        totalOrders: totalOrdersFromStats, // Calculated from monthly data
        totalProducts: totalProducts || 0,
        monthlyOrders: formattedMonthlyOrders,
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
            <Feather name="shopping-bag" size={24} color={Colors.primary.DEFAULT} />
          </View>
          <Text style={styles.statValue}>{stats.totalOrders}</Text>
          <Text style={styles.statLabel}>Commandes Payées (6m)</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.iconContainer, { backgroundColor: Colors.secondary[50] }]}>
            <Feather name="box" size={24} color={Colors.secondary.DEFAULT} />
          </View>
          <Text style={styles.statValue}>{stats.totalProducts}</Text>
          <Text style={styles.statLabel}>Produits ajoutés</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Feather name="trending-up" size={20} color={Colors.neutral[700]} />
          <Text style={styles.sectionTitle}>Évolution des Commandes Payées</Text>
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
            <Feather name="award" size={20} color={Colors.neutral[700]} />
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