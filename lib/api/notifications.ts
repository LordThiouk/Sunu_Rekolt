import { supabase } from '@/lib/supabase';

// Define all possible string literal types from your user_alert_type ENUM in the database
export type UserAlertType = 
  | 'new_order'
  | 'payment_received'
  | 'new_review_posted'
  | 'product_approved_farmer'
  | 'order_paid'
  | 'order_delivering'
  | 'order_delivered'
  | 'please_review_order'
  | 'refund_status_changed'
  | 'product_pending_admin'
  | 'new_payment_admin'
  | 'refund_request_admin'
  | 'new_user_admin'
  | string; // Fallback for any other string, or be more strict with only the above

// Define notification type based on the user_alerts table
export type Notification = {
  id: string;
  user_id: string;
  actor_id?: string | null; // from your log
  title: string;
  message: string;
  type: UserAlertType; // Use the UserAlertType union
  importance: 'critical' | 'high' | 'medium' | 'low';
  is_read: boolean;
  created_at: string;

  // Specific related IDs from the database table user_alerts
  related_order_id?: string | null;
  related_product_id?: string | null;
  related_review_id?: string | null;
  related_refund_id?: string | null;
  related_user_id?: string | null;

  // Generic fields that might be populated by a mapping layer later if desired
  // For now, the component will use the specific IDs above and the main 'type'
  related_entity_id?: string | null; 
  related_entity_type?: string | null;
};

/**
 * Fetch notifications for the current user
 * @param userId User ID
 * @param limit Number of notifications to fetch
 * @param offset Offset for pagination
 * @returns Notifications array or null on error
 */
export const fetchNotifications = async (
  userId: string, 
  limit: number = 20, 
  offset: number = 0
): Promise<{ data: Notification[] | null; error: Error | null }> => {
  try {
    const { data, error } = await supabase
      .from('user_alerts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error('Error fetching notifications:', error);
      return { data: null, error };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Exception in fetchNotifications:', error);
    return { data: null, error: error as Error };
  }
};

/**
 * Get count of unread notifications
 * @param userId User ID
 * @returns Count of unread notifications or null on error
 */
export const getUnreadCount = async (
  userId: string
): Promise<{ count: number | null; error: Error | null }> => {
  try {
    const { count, error } = await supabase
      .from('user_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    
    if (error) {
      console.error('Error getting unread count:', error);
      return { count: null, error };
    }
    
    return { count, error: null };
  } catch (error) {
    console.error('Exception in getUnreadCount:', error);
    return { count: null, error: error as Error };
  }
};

/**
 * Mark a notification as read
 * @param notificationId Notification ID
 * @returns Success status
 */
export const markAsRead = async (
  notificationId: string
): Promise<{ success: boolean; error: Error | null }> => {
  try {
    const { error } = await supabase
      .from('user_alerts')
      .update({ is_read: true })
      .eq('id', notificationId);
    
    if (error) {
      console.error('Error marking notification as read:', error);
      return { success: false, error };
    }
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Exception in markAsRead:', error);
    return { success: false, error: error as Error };
  }
};

/**
 * Mark all notifications as read for a user
 * @param userId User ID
 * @returns Success status
 */
export const markAllAsRead = async (
  userId: string
): Promise<{ success: boolean; error: Error | null }> => {
  try {
    const { error } = await supabase
      .from('user_alerts')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    
    if (error) {
      console.error('Error marking all notifications as read:', error);
      return { success: false, error };
    }
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Exception in markAllAsRead:', error);
    return { success: false, error: error as Error };
  }
}; 