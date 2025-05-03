import { Tabs } from 'expo-router';
import { Chrome as Home, Store, ShoppingBag, User } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { useCart } from '@/context/CartContext';
import { Text, View, StyleSheet } from 'react-native';

export default function TabLayout() {
  const { count } = useCart();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary.DEFAULT,
        tabBarInactiveTintColor: Colors.neutral[500],
        tabBarStyle: {
          backgroundColor: Colors.neutral.white,
          borderTopColor: Colors.neutral[200],
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: Colors.primary.DEFAULT,
        },
        headerTintColor: Colors.neutral.white,
        headerTitleStyle: {
          fontWeight: '600',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Catalogue',
          tabBarLabel: 'Catalogue',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: 'Boutique',
          tabBarLabel: 'Boutique',
          tabBarIcon: ({ color, size }) => <Store size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Panier',
          tabBarLabel: 'Panier',
          tabBarIcon: ({ color, size }) => (
            <View>
              <ShoppingBag size={size} color={color} />
              {count > 0 && (
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeText}>
                    {count > 99 ? '99+' : count}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
      
      {/* Hidden screens */}
      <Tabs.Screen
        name="catalog/[id]"
        options={{
          href: null,
          headerShown: true,
          title: 'Détail Produit',
        }}
      />
      <Tabs.Screen
        name="product/add"
        options={{
          href: null,
          headerShown: true,
          title: 'Ajouter Produit',
        }}
      />
      <Tabs.Screen
        name="payment"
        options={{
          href: null,
          headerShown: true,
          title: 'Paiement',
        }}
      />
      <Tabs.Screen
        name="order-confirmation"
        options={{
          href: null,
          headerShown: true,
          title: 'Confirmation de commande',
        }}
      />
      {/* Explicitly hide farmer detail screen/directory */}
      <Tabs.Screen
        name="farmer-order-detail/[id]" // Target the dynamic file route
        options={{
          href: null, // Hide from tab bar
          headerShown: false, // Keep header management within the screen itself
        }}
      />
    </Tabs>
  );
}

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
    fontWeight: '700',
  },
});