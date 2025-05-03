import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Order, UserRole } from '@/types';
import Button from '@/components/Button'; // Assuming Button is in components
import Colors from '@/constants/Colors';
import { CreditCard } from 'lucide-react-native'; // Add required icons

// Props definition
interface OrderCardProps {
  order: Order;
  userRole: UserRole;
  currentUserId: string;
  onUpdateStatus: (orderId: string, newStatus: Order['status']) => void;
  isUpdating: boolean;
}

// OrderCard Component Definition
export default function OrderCard({ 
  order,
  userRole,
  currentUserId,
  onUpdateStatus,
  isUpdating
}: OrderCardProps) {
  const router = useRouter();

  // Internal helper functions (copied from profile.tsx)
  const getStatusStyle = (status: Order['status']) => {
    // Use styles defined below in this file
    switch (status) {
      case 'paid': return styles.orderStatusPaid;
      case 'delivering': return styles.orderStatusDelivering;
      case 'delivered': return styles.orderStatusDelivered;
      case 'received': return styles.orderStatusReceived;
      case 'cancelled': return styles.orderStatusCancelled;
      default: return styles.orderStatusPending;
    }
  };

  const getStatusTextStyle = (status: Order['status']) => {
    // Use styles defined below in this file
    switch (status) {
      case 'paid': return styles.orderStatusTextPaid;
      case 'delivering': return styles.orderStatusTextDelivering;
      case 'delivered': return styles.orderStatusTextDelivered;
      case 'received': return styles.orderStatusTextReceived;
      case 'cancelled': return styles.orderStatusTextCancelled;
      default: return styles.orderStatusTextPending;
    }
  };
  
  const getStatusText = (status: Order['status']) => {
     switch (status) {
       case 'paid': return 'Payé';
       case 'delivering': return 'En livraison';
       case 'delivered': return 'Livré';
       case 'received': return 'Reçu';
       case 'cancelled': return 'Annulé';
       default: return 'En attente';
     }
  };

  const getPaymentText = (method: Order['paymentMethod']) => {
     // Assuming paymentMethod is stored like 'mobile_money' or 'cash'
     return method === 'mobile_money' ? 'Mobile Money' : 'Espèces'; // Adjust if needed
  };

  const isOrderReceived = userRole === 'farmer' && order.buyerId !== currentUserId;
  const isOrderPlaced = order.buyerId === currentUserId;

  const renderActionButtons = () => {
    // Farmer actions
    if (isOrderReceived) {
      if (order.status === 'paid') {
        return (
          <Button 
            title="Marquer en livraison"
            onPress={() => onUpdateStatus(order.id, 'delivering')}
            variant="outline"
            size="small"
            disabled={isUpdating}
            loading={isUpdating}
            style={styles.actionButton}
          />
        );
      }
      if (order.status === 'delivering') {
        return (
          <Button 
            title="Marquer comme livré"
            onPress={() => onUpdateStatus(order.id, 'delivered')}
            variant="primary"
            size="small"
            disabled={isUpdating}
            loading={isUpdating}
            style={styles.actionButton}
          />
        );
      }
    }

    // Buyer actions
    if (isOrderPlaced) {
      if (order.status === 'delivered') {
        return (
          <Button 
            title="Confirmer réception"
            onPress={() => onUpdateStatus(order.id, 'received')}
            variant="primary"
            size="small"
            disabled={isUpdating}
            loading={isUpdating}
            style={styles.actionButton}
          />
        );
      }
      if (['paid', 'delivering', 'delivered'].includes(order.status)) {
          return (
             <Button 
                title="Demander remboursement"
                onPress={() => Alert.alert("Fonctionnalité à venir", "La demande de remboursement sera bientôt disponible.")}
                variant="outline"
                size="small"
                disabled={isUpdating}
                style={styles.actionButton}
             />
          );
      }
    }
    return null; 
  };

  const handleCardPress = () => {
    if (userRole === 'farmer' && isOrderReceived) {
      router.push(`/farmer-order-detail/${order.id}` as any);
    } else {
      router.push({
        pathname: '/(tabs)/order-confirmation',
        params: { orderId: order.id }
      });
    }
  };

  const isValidDate = order.createdAt && !isNaN(new Date(order.createdAt).getTime());

  return (
    <TouchableOpacity onPress={handleCardPress} activeOpacity={0.7}>
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderNumber}>Commande #{order.id.slice(0, 8)}</Text>
          <View style={[styles.orderStatus, getStatusStyle(order.status)]}>
            <Text style={[styles.orderStatusText, getStatusTextStyle(order.status)]}>
              {getStatusText(order.status)}
            </Text>
          </View>
        </View>
        <View style={styles.orderInfo}>
          <Text style={styles.orderDate}>
            {isValidDate ? new Date(order.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Date invalide'}
          </Text>
          <Text style={styles.orderItemsCount}>
            {/* Note: order.items might not be available depending on where OrderCard is used.
                The parent component needs to pass the items count or the full items array if this is needed.
                For now, assuming items might not be present. Adjust if needed. */}
            {/* {order.items?.length || 0} {order.items?.length === 1 ? 'article' : 'articles'} */}
             {/* Placeholder - Parent should pass item count if needed */} 
          </Text>
        </View>
        <View style={styles.orderFooter}>
          <CreditCard size={16} color={Colors.neutral[600]} />
          <Text style={styles.paymentMethod}>{getPaymentText(order.paymentMethod)}</Text>
          <Text style={styles.orderTotal}>{order.total.toLocaleString()} CFA</Text>
        </View>
        <View style={styles.actionContainer}>
          {renderActionButtons()}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// Styles copied from profile.tsx
const styles = StyleSheet.create({
  orderCard: {
    backgroundColor: Colors.neutral.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: Colors.neutral.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral[800],
  },
  orderStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: Colors.neutral[200],
  },
  orderStatusPending: {
     backgroundColor: Colors.neutral[200],
  },
  orderStatusPaid: {
    backgroundColor: Colors.success.light,
  },
  orderStatusDelivering: {
      backgroundColor: Colors.warning.light,
  },
  orderStatusDelivered: {
    backgroundColor: Colors.primary[100],
  },
  orderStatusReceived: {
      backgroundColor: Colors.primary.DEFAULT,
  },
  orderStatusCancelled: {
    backgroundColor: Colors.error.light,
  },
  orderStatusText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.neutral[700],
  },
  orderStatusTextPending: {
     color: Colors.neutral[700],
  },
  orderStatusTextPaid: {
    color: Colors.success.DEFAULT,
  },
  orderStatusTextDelivering: {
      color: Colors.warning.dark,
  },
  orderStatusTextDelivered: {
    color: Colors.primary.DEFAULT,
  },
  orderStatusTextReceived: {
      color: Colors.neutral.white,
  },
  orderStatusTextCancelled: {
    color: Colors.error.DEFAULT,
  },
  orderInfo: {
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderDate: {
    fontSize: 14,
    color: Colors.neutral[600],
  },
  orderItemsCount: {
    fontSize: 14,
    color: Colors.neutral[700],
    fontWeight: '500',
  },
  orderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[200],
    paddingTop: 12,
  },
  paymentMethod: {
    fontSize: 14,
    color: Colors.neutral[600],
    marginLeft: 8,
    flex: 1,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary.DEFAULT,
  },
  actionContainer: {
     marginTop: 16, 
     paddingTop: 12,
     borderTopWidth: 1,
     borderTopColor: Colors.neutral[200],
     alignItems: 'flex-end',
  },
  actionButton: {
     minWidth: 150,
     paddingVertical: 8,
  },
}); 