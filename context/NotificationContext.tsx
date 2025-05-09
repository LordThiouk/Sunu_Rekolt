import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext'; // To get the current user
import { RealtimeChannel } from '@supabase/supabase-js';

// Assuming your user_alerts table has at least these fields.
// Match this with your actual table structure from the migration.
export interface UserAlert {
  id: string; // or number, depending on your DB schema (uuid is string)
  user_id: string;
  title: string;
  message: string;
  type: string; // e.g., 'order_related', 'system'
  related_entity_id?: string | null;
  is_read: boolean;
  created_at: string;
  importance_level?: string | null; // 'high', 'medium', 'low'
  data?: Record<string, any> | null; // For deep-linking or extra info
}

interface NotificationContextState {
  notifications: UserAlert[];
  unreadCount: number;
  markAsRead: (notificationId: string) => Promise<void>; // string or number based on ID type
  markAllAsRead: () => Promise<void>;
  loading: boolean;
}

const NotificationContext = createContext<NotificationContextState | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<UserAlert[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  const fetchInitialNotifications = useCallback(async (userId: string) => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error, count } = await supabase
        .from('user_alerts')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setNotifications(data as UserAlert[]);
        const unread = data.filter(alert => !alert.is_read).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Error fetching initial notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchInitialNotifications(user.id);

      // Clean up previous channel if exists
      if (channel) {
        supabase.removeChannel(channel);
        setChannel(null);
      }

      const newChannel = supabase
        .channel(`user_alerts:${user.id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'user_alerts', filter: `user_id=eq.${user.id}` },
          (payload) => {
            console.log('New notification received via Realtime:', payload.new);
            const newAlert = payload.new as UserAlert;
            setNotifications(prevNotifications => [newAlert, ...prevNotifications]);
            if (!newAlert.is_read) {
              setUnreadCount(prevCount => prevCount + 1);
            }
            // Here you could also trigger a local notification if the app is in background/killed
            // using Notifications.scheduleNotificationAsync from expo-notifications, if desired.
          }
        )
        .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
            console.log('Subscribed to user_alerts channel for user:', user.id);
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT'){
            console.error('Realtime channel error:', status, err);
          } else {
            console.log('Realtime channel status:', status);
          }
        });
      setChannel(newChannel);

      return () => {
        if (newChannel) {
          supabase.removeChannel(newChannel).then(() => console.log('Unsubscribed from user_alerts channel.'));
          setChannel(null);
        }
      };
    } else {
      // User signed out, remove channel if it exists
      if (channel) {
        supabase.removeChannel(channel).then(() => console.log('User signed out, unsubscribed from user_alerts channel.'));
        setChannel(null);
        setNotifications([]);
        setUnreadCount(0);
      }
    }
  }, [user?.id, fetchInitialNotifications]); // Rerun when user.id changes

  const markAsRead = async (notificationId: string) => {
    // ... implementation to update DB and then state
    try {
        const { data, error } = await supabase
            .from('user_alerts')
            .update({ is_read: true, updated_at: new Date().toISOString() })
            .eq('id', notificationId)
            .eq('is_read', false) // Only update if not already read
            .select();

        if (error) throw error;

        if (data && data.length > 0) {
            setNotifications(prev => 
                prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1)); // Ensure count doesn't go below 0
        }
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user?.id || unreadCount === 0) return;
    try {
        const { error } = await supabase
            .from('user_alerts')
            .update({ is_read: true, updated_at: new Date().toISOString() })
            .eq('user_id', user.id)
            .eq('is_read', false);
        
        if (error) throw error;

        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, loading }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}; 