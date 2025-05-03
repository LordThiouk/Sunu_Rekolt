import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { User, UserRole } from '@/types';
import { router } from 'expo-router';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (phone: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (phone: string, password: string, role: UserRole, name: string, location?: string, farmSize?: number) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    // Check for active session on component mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isMounted.current) {
        setSession(session);
        if (session) {
          fetchUserProfile(session.user.id);
        }
        setLoading(false);
      }
    });

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (isMounted.current) {
        setSession(session);
        if (session) {
          await fetchUserProfile(session.user.id);
          // Redirect to tabs after successful login
          router.replace('/(tabs)/' as any);
        } else {
          setUser(null);
          // Redirect to login when session is lost
          router.replace('/(auth)/login' as any);
        }
        setLoading(false);
      }
    });

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
      isMounted.current = false;
    };
  }, []);

  async function fetchUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        throw error;
      }

      if (data && isMounted.current) {
        console.log('[AuthContext] fetchUserProfile: Fetched profile data:', JSON.stringify(data, null, 2));
        setUser(data as User);
        // Log the role specifically after setting user state
        // Use a slight delay to ensure state update might have propagated if needed
        setTimeout(() => {
           console.log(`[AuthContext] fetchUserProfile: User state SHOULD now have role: ${user?.role}`);
        }, 0);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  }

  const signIn = async (phone: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        phone,
        password,
      });

      if (!error && data.session) {
        // Session will be handled by the auth state change listener
        return { error: null };
      }

      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (phone: string, password: string, role: UserRole, name: string, location?: string, farmSize?: number) => {
    try {
      const { data: { user }, error } = await supabase.auth.signUp({
        phone,
        password,
      });

      if (error) throw error;

      if (user) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: user.id,
              phone,
              role,
              name,
              location,
              farm_size: farmSize,
              created_at: new Date(),
            },
          ]);

        if (profileError) throw profileError;
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      // Redirection will be handled by the auth state change listener
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};