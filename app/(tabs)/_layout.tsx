import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Text, View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useNotifications } from '@/context/NotificationContext';
import { Href } from 'expo-router';

// Header styling
const styles = StyleSheet.create({
  badgeContainer: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: Colors.secondary.DEFAULT,
    borderRadius: 12,
    paddingHorizontal: 4,
    paddingVertical: 2,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: Colors.neutral.white,
    fontSize: 10,
    fontFamily: 'BalooBhai2_600SemiBold',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'BalooBhai2_600SemiBold',
    color: Colors.neutral.white,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: Colors.error.DEFAULT,
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  notificationBadgeText: {
    color: Colors.neutral.white,
    fontSize: 8,
    fontFamily: 'BalooBhai2_600SemiBold',
  },
});

export default function TabLayout() {
  const { count } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const { unreadCount } = useNotifications();

  // Handle notification icon press
  const handleNotificationPress = () => {
    router.push('/(tabs)/notifications' as Href);
  };

  // Header options that will be applied to all screens
  const commonHeaderOptions = {
    headerTitle: () => (
      <View style={styles.headerContainer}>
        <View style={styles.headerLeft}>
          <Image 
            source={require('@/assets/images/icon-white-svg.png')} 
            style={{ width: 24, height: 24, marginRight: 8 }} 
          />
          <Text style={styles.headerTitle}>Sunu Rekolt</Text>
        </View>
        <TouchableOpacity onPress={handleNotificationPress}>
          <View style={styles.iconWrapper}>
            <Feather name="bell" size={18} color="#fff" />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    ),
    headerTitleAlign: 'center' as const,
    headerStyle: {
      backgroundColor: Colors.primary.DEFAULT,
    },
    headerTintColor: Colors.neutral.white,
  };

  // Only render if user is authenticated
  if (!user) {
    return null;
  }

  if (user.role === 'farmer') {
    return (
      <Tabs
        screenOptions={{
          ...commonHeaderOptions,
          tabBarActiveTintColor: Colors.primary.DEFAULT,
        }}
      >
        <Tabs.Screen
          name="farmer-dashboard"
          options={{
            tabBarLabel: 'Accueil',
            tabBarIcon: ({ color }) => <Feather name="home" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="my-products"
          options={{
            tabBarLabel: 'Produits',
            tabBarIcon: ({ color }) => <Feather name="package" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            tabBarLabel: 'Catalogue',
            tabBarIcon: ({ color }) => <Feather name="grid" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            tabBarLabel: 'Profil',
            tabBarIcon: ({ color }) => <Feather name="user" size={24} color={color} />,
          }}
        />
        <Tabs.Screen name="notifications" options={{ href: null }} />
        <Tabs.Screen name="catalog/[id]" options={{ href: null }} />
        <Tabs.Screen name="product/add" options={{ href: null }} />
        <Tabs.Screen name="payment" options={{ href: null }} />
        <Tabs.Screen name="order-confirmation" options={{ href: null }} />
        <Tabs.Screen name="farmer-order-detail/[id]" options={{ href: null }} />
        <Tabs.Screen name="edit-profile" options={{ href: null }} />
        <Tabs.Screen name="farmer-orders" options={{ href: null }} />
        <Tabs.Screen name="shop" options={{ href: null }} />
        <Tabs.Screen name="cart" options={{ href: null }} />
        <Tabs.Screen name="checkout" options={{ href: null }} />
        <Tabs.Screen name="product-detail" options={{ href: null }} />
      </Tabs>
    );
  }

  return (
    <Tabs
      screenOptions={{
        ...commonHeaderOptions,
        tabBarActiveTintColor: Colors.primary.DEFAULT,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: 'Catalogue',
          tabBarIcon: ({ color }) => <Feather name="grid" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="farmer-orders"
        options={{
          tabBarLabel: 'Commandes',
          tabBarIcon: ({ color }) => <Feather name="shopping-bag" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          tabBarLabel: 'Panier',
          tabBarIcon: ({ color }) => (
            <View>
              <Feather name="shopping-cart" size={24} color={color} />
              {count > 0 && (
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeText}>{count}</Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color }) => <Feather name="user" size={24} color={color} />,
        }}
      />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="catalog/[id]" options={{ href: null }} />
      <Tabs.Screen name="product/add" options={{ href: null }} />
      <Tabs.Screen name="payment" options={{ href: null }} />
      <Tabs.Screen name="order-confirmation" options={{ href: null }} />
      <Tabs.Screen name="farmer-order-detail/[id]" options={{ href: null }} />
      <Tabs.Screen name="edit-profile" options={{ href: null }} />
      <Tabs.Screen name="my-products" options={{ href: null }} />
      <Tabs.Screen name="shop" options={{ href: null }} />
      <Tabs.Screen name="farmer-dashboard" options={{ href: null }} />
      <Tabs.Screen name="checkout" options={{ href: null }} />
      <Tabs.Screen name="product-detail" options={{ href: null }} />
    </Tabs>
  );
}