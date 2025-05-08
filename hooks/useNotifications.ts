import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  fetchNotifications, 
  getUnreadCount,
  markAsRead, 
  markAllAsRead,
  Notification 
} from '@/lib/api/notifications';

/**
 * Custom hook for handling notifications
 */
export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Fetch all notifications for the current user
   */
  const loadNotifications = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await fetchNotifications(user.id);
      
      if (error) {
        setError(error);
        return;
      }
      
      setNotifications(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Fetch the count of unread notifications
   */
  const refreshUnreadCount = useCallback(async () => {
    if (!user) return;

    try {
      const { count, error } = await getUnreadCount(user.id);
      
      if (error) {
        console.error('Error getting unread count:', error);
        return;
      }
      
      if (count !== null) {
        setUnreadCount(count);
      }
    } catch (err) {
      console.error('Error refreshing unread count:', err);
    }
  }, [user]);

  /**
   * Mark a notification as read and update the local state
   */
  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    try {
      const { success, error } = await markAsRead(notificationId);
      
      if (error || !success) {
        console.error('Error marking notification as read:', error);
        return false;
      }
      
      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true } 
            : notification
        )
      );
      
      // Refresh unread count
      refreshUnreadCount();
      
      return true;
    } catch (err) {
      console.error('Error in markNotificationAsRead:', err);
      return false;
    }
  }, [refreshUnreadCount]);

  /**
   * Mark all notifications as read
   */
  const markAllNotificationsAsRead = useCallback(async () => {
    if (!user) return false;

    try {
      const { success, error } = await markAllAsRead(user.id);
      
      if (error || !success) {
        console.error('Error marking all notifications as read:', error);
        return false;
      }
      
      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => ({ ...notification, is_read: true }))
      );
      
      // Update unread count
      setUnreadCount(0);
      
      return true;
    } catch (err) {
      console.error('Error in markAllNotificationsAsRead:', err);
      return false;
    }
  }, [user]);

  // Load unread count on mount and when user changes
  useEffect(() => {
    if (user) {
      refreshUnreadCount();
    }
  }, [user, refreshUnreadCount]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    loadNotifications,
    refreshUnreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead
  };
}; 