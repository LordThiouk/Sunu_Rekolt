import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useNotifications } from '@/hooks/useNotifications';
import { Notification } from '@/lib/api/notifications';
import { useAuth } from '@/context/AuthContext';

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [markingAllAsRead, setMarkingAllAsRead] = useState(false);
  const { 
    notifications, 
    loading, 
    loadNotifications, 
    markNotificationAsRead,
    markAllNotificationsAsRead,
    unreadCount
  } = useNotifications();

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Handle notification press
  const handleNotificationPress = (notification: Notification) => {
    // console.log('--- Notification Clicked ---');
    // console.log('Notification Object:', JSON.stringify(notification, null, 2)); 

    if (!notification.is_read) {
      markNotificationAsRead(notification.id);
    }
    
    const mainType = notification.type; // This will be 'new_order', 'product_approved_farmer', etc.
    let entityId: string | null | undefined = null;
    let pathToNavigate: string | null = null;

    // console.log('Main Notification Type:', mainType);
    // console.log('Current User Role:', user?.role);

    switch (mainType) {
      case 'new_order': 
        entityId = notification.related_order_id; 
        // console.log('Case: "new_order" matched. Order ID:', entityId);
        if (entityId) { 
          if (user && user.role === 'farmer') {
            pathToNavigate = `/(tabs)/farmer-order-detail/${entityId}`;
            // console.log('User is farmer, Path set to (farmer order detail):', pathToNavigate);
          } else if (user && user.role === 'buyer') {
            // Buyer's equivalent order detail screen
            // TODO: Replace with actual buyer order detail screen path if different
            pathToNavigate = `/(tabs)/order-detail/${entityId}`; 
            // console.log('User is buyer, Path set to (order detail - placeholder):', pathToNavigate);
          } else {
            // Fallback for other roles or if user role is not determined but type is new_order and ID exists
            pathToNavigate = `/(tabs)/farmer-order-detail/${entityId}`;
            // console.log('Fallback/Admin view for new_order, Path set to (order detail):', pathToNavigate);
          }
        } else {
          // console.warn('New order notification is missing related_order_id');
          router.back();
          return;
        }
        break;
      
      case 'product_approved_farmer': 
        entityId = notification.related_product_id;
        if (entityId) {
          pathToNavigate = `/(tabs)/catalog/${entityId}`;
          // console.log('Path set to (product detail): ', pathToNavigate);
        } else {
          router.back();
          return;
        }
        break;

      // Cases for buyer order status updates
      case 'order_paid':
      case 'order_delivering':
      case 'order_delivered':
      case 'please_review_order': 
        entityId = notification.related_order_id;
        if (entityId && user && user.role === 'buyer') {
          // TODO: Replace `/(tabs)/order-detail/` with the actual path for buyer order details
          pathToNavigate = `/(tabs)/order-detail/${entityId}`;
          // console.log(`Buyer, order status ${mainType}, Path: ${pathToNavigate}`);
        } else if (entityId && user && user.role === 'farmer' && mainType === 'order_delivered') {
          // Farmer might want to see details of an order they delivered
          pathToNavigate = `/(tabs)/farmer-order-detail/${entityId}`;
          // console.log(`Farmer, order delivered, Path: ${pathToNavigate}`);
        }
        else {
          // console.warn(`Order status notification for ${mainType} but no valid path for user role or missing ID.`);
          router.back(); return;
        }
        break;
        
      case 'payment_received': // Typically for Farmer
        entityId = notification.related_order_id;
        if (entityId && user && user.role === 'farmer') {
          pathToNavigate = `/(tabs)/farmer-order-detail/${entityId}`;
          // console.log(`Farmer, payment_received for order ${entityId}, Path: ${pathToNavigate}`);
        } else {
           router.back(); return;
        }
        break;

      // ... other cases based on your UserAlertType ...

      default:
        // console.warn(`Unhandled notification main type: ${mainType}`);
        router.back(); 
        return;
    }

    if (pathToNavigate) {
      // console.log('Attempting to navigate to:', pathToNavigate);
      try {
        router.push(pathToNavigate as any); 
      } catch (error) {
        // console.error('Navigation error for path:', pathToNavigate, error);
        Alert.alert("Erreur de navigation", "Impossible d'ouvrir la page de destination.");
        router.back(); 
      }
    } else {
      // console.log('Fallback: Path could not be constructed, attempting router.back()');
      router.back(); 
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      setMarkingAllAsRead(true);
      const success = await markAllNotificationsAsRead();
      
      if (success) {
        // Show success toast or message if desired
      } else {
        Alert.alert(
          "Erreur",
          "Impossible de marquer toutes les notifications comme lues. Veuillez réessayer."
        );
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      Alert.alert(
        "Erreur",
        "Une erreur s'est produite. Veuillez réessayer."
      );
    } finally {
      setMarkingAllAsRead(false);
    }
  };

  // Function to get icon based on notification type
  const getNotificationIcon = (type: Notification['type'], importance: Notification['importance']) => {
    let iconName = 'bell';
    let iconColor = Colors.primary.DEFAULT;
    
    switch (type) {
      case 'order_related':
        iconName = 'shopping-bag';
        break;
      case 'payment_related':
        iconName = 'credit-card';
        break;
      case 'review_related':
        iconName = 'star';
        break;
      case 'system':
        iconName = 'alert-circle';
        break;
    }
    
    // Change color based on importance
    if (importance === 'critical') {
      iconColor = Colors.error.DEFAULT;
    } else if (importance === 'high') {
      iconColor = Colors.warning.DEFAULT;
    }
    
    return { iconName, iconColor };
  };

  // Render a notification item
  const renderNotification = ({ item }: { item: Notification }) => {
    const { iconName, iconColor } = getNotificationIcon(item.type, item.importance);
    const date = new Date(item.created_at).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          !item.is_read && styles.unreadNotification
        ]}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={styles.iconContainer}>
          <Feather name={iconName as any} size={22} color={iconColor} />
        </View>
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <Text style={styles.notificationMessage}>{item.message}</Text>
          <Text style={styles.notificationTime}>{date}</Text>
        </View>
        {!item.is_read && <View style={styles.unreadIndicator} />}
      </TouchableOpacity>
    );
  };

  // Render header with mark all as read button
  const renderHeader = () => {
    if (unreadCount === 0) return null;
    
    return (
      <View style={styles.headerContainer}>
        <TouchableOpacity 
          style={styles.markAllButton}
          onPress={handleMarkAllAsRead}
          disabled={markingAllAsRead}
        >
          {markingAllAsRead ? (
            <ActivityIndicator size="small" color={Colors.primary.DEFAULT} />
          ) : (
            <>
              <Feather name="check-circle" size={16} color={Colors.primary.DEFAULT} style={styles.markAllIcon} />
              <Text style={styles.markAllText}>Tout marquer comme lu</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  // Render empty state
  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Feather name="bell-off" size={50} color={Colors.neutral[400]} />
      <Text style={styles.emptyText}>Aucune notification</Text>
      <Text style={styles.emptySubtext}>
        Les notifications sur les commandes, paiements et avis apparaîtront ici.
      </Text>
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Notifications',
          headerStyle: {
            backgroundColor: Colors.primary.DEFAULT,
          },
          headerTintColor: Colors.neutral.white,
        }}
      />
      <View style={styles.container}>
        {loading && !markingAllAsRead ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary.DEFAULT} />
          </View>
        ) : (
          <FlatList
            data={notifications}
            renderItem={renderNotification}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={renderEmptyComponent}
            onRefresh={loadNotifications}
            refreshing={loading}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.neutral[100],
    borderRadius: 20,
  },
  markAllIcon: {
    marginRight: 4,
  },
  markAllText: {
    color: Colors.primary.DEFAULT,
    fontFamily: 'BalooBhai2_500Medium',
    fontSize: 14,
  },
  notificationItem: {
    backgroundColor: Colors.neutral.white,
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadNotification: {
    backgroundColor: Colors.primary[100],
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontFamily: 'BalooBhai2_600SemiBold',
    fontSize: 16,
    color: Colors.neutral[900],
    marginBottom: 4,
  },
  notificationMessage: {
    fontFamily: 'BalooBhai2_400Regular',
    fontSize: 14,
    color: Colors.neutral[700],
    marginBottom: 8,
  },
  notificationTime: {
    fontFamily: 'BalooBhai2_400Regular',
    fontSize: 12,
    color: Colors.neutral[500],
  },
  unreadIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary.DEFAULT,
    alignSelf: 'flex-start',
    marginTop: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    minHeight: 300,
  },
  emptyText: {
    fontFamily: 'BalooBhai2_600SemiBold',
    fontSize: 18,
    color: Colors.neutral[700],
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontFamily: 'BalooBhai2_400Regular',
    fontSize: 14,
    color: Colors.neutral[500],
    textAlign: 'center',
    lineHeight: 20,
  },
}); 