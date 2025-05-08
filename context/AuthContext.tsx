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
  updateUser: (updates: Partial<User>) => void;
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
    // Helper function to determine redirect path based on user role
    const getRedirectPath = (userRole: UserRole | undefined): string => {
      if (userRole === 'farmer') {
        return '/(tabs)/farmer-dashboard';
      } else if (userRole === 'buyer') {
        return '/(tabs)/index'; // Catalogue screen for buyer
      } else {
        // Default for admin (handled by web) or if role is undefined briefly
        return '/(tabs)/'; 
      }
    };

    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      if (isMounted.current) {
        setSession(currentSession);
        if (currentSession) {
          const fetchedUser = await fetchUserProfile(currentSession.user.id);
          // Redirect based on fetched user role if already logged in
          if (fetchedUser) {
            const path = getRedirectPath(fetchedUser.role);
            console.log(`[AuthContext] Role: ${fetchedUser.role}, Initial redirect to: ${path}`);
            // Only redirect if not already on a valid path
            if (router.canGoBack()) router.dismissAll();
            router.replace(path as any);
          }
        } else {
          // No session, ensure user is on auth screen
           if (router.canGoBack()) router.dismissAll();
           router.replace('/(auth)' as any);
        }
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      if (isMounted.current) {
        setSession(currentSession);
        if (currentSession) {
          const fetchedUser = await fetchUserProfile(currentSession.user.id);
          if (fetchedUser) {
            const path = getRedirectPath(fetchedUser.role);
            console.log(`[AuthContext] Role: ${fetchedUser.role}, Redirecting to: ${path}`);
            if (router.canGoBack()) router.dismissAll();
            router.replace(path as any);
          } else {
            // Failed to fetch profile, redirect to a safe place like login
            console.error('[AuthContext] Failed to fetch profile after auth change, redirecting to login.');
            if (router.canGoBack()) router.dismissAll();
            router.replace('/(auth)/login' as any);
          }
        } else {
          setUser(null);
          console.log('[AuthContext] No session, redirecting to auth.');
          if (router.canGoBack()) router.dismissAll();
          router.replace('/(auth)' as any); // Go to welcome/auth index
        }
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function fetchUserProfile(userId: string): Promise<User | null> {
    try {
      setLoading(true); // Added to indicate profile fetching activity
      const { data, error, status } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && status !== 406) { // 406 means no rows found, which is okay if profile is being created
        console.error('[AuthContext] fetchUserProfile supabase error:', error);
        throw error;
      }

      if (data && isMounted.current) {
        console.log('[AuthContext] fetchUserProfile: Fetched profile data:', JSON.stringify(data, null, 2));
        setUser(data as User);
        return data as User;
      } else {
        console.warn('[AuthContext] fetchUserProfile: No data returned or component unmounted');
        return null;
      }
    } catch (error) {
      console.error('[AuthContext] Error fetching user profile:', error);
      setUser(null); // Clear user on error
      return null;
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }

  const signIn = async (phone: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        phone,
        password,
      });
      // onAuthStateChange will handle session and profile fetching
      return { error };
    } catch (error) {
      return { error: error as Error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (phone: string, password: string, role: UserRole, name: string, location?: string, farmSize?: number) => {
    setLoading(true);
    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        phone,
        password,
      });

      if (signUpError) throw signUpError;

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: authData.user.id,
              phone,
              role,
              name,
              location,
              farm_size: farmSize,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(), // Ensure updated_at is also set
            },
          ])
          .select(); // Important to select to confirm insert and potentially get back data

        if (profileError) {
          console.error('[AuthContext] Error creating profile:', profileError);
          // Potentially delete the auth user if profile creation fails
          // await supabase.auth.deleteUser(authData.user.id); // Be cautious with this
          throw profileError;
        }
        // At this point, onAuthStateChange should trigger, fetch the new profile, and redirect.
        // No explicit redirect here to avoid race conditions with onAuthStateChange.
      }
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      // onAuthStateChange will handle redirection to auth screens
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = (updates: Partial<User>) => {
    if (isMounted.current) {
        setUser(prevUser => {
            if (!prevUser) return null;
            const updatedUser = { ...prevUser, ...updates };
            console.log('[AuthContext] updateUser: Updating user state:', JSON.stringify(updatedUser, null, 2));
            return updatedUser;
        });
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
        updateUser,
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