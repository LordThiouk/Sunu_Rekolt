import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { Session, User as SupabaseAuthUser } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { User, UserRole } from '@/types';
import { router, Href, usePathname } from 'expo-router';
import { registerForPushNotificationsAsync } from '@/lib/services/notificationService';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: User | null;
  loading: boolean;
  updateUser: (updates: Partial<User>) => Promise<User | null | undefined>;
  isAdmin: boolean;
  signOut: () => Promise<{ error: any; }>;
  signIn: (phone: string, password: string) => Promise<void>;
  signUp: (phone: string, password: string, name: string, role: UserRole, location?: string, farm_size?: number, termsAccepted?: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const isMounted = useRef(true);
  const currentPathname = usePathname();
  const [initialRedirectDone, setInitialRedirectDone] = useState(false);

  const fetchUserProfile = useCallback(async (userId: string): Promise<User | null> => {
    if (!isMounted.current) return null;
    try {
      const { data, error, status } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && status !== 406) {
        console.error("Error fetching profile in fetchUserProfile:", error);
        return null;
      }
      return data as User | null;
    } catch (error) { 
      console.error("Catching error in fetchUserProfile:", error);
      return null;
    }
  }, []);

  // Effect for initial session and profile loading
  useEffect(() => {
    isMounted.current = true;
    const fetchInitialData = async () => {
      if (!isMounted.current) return;
      setLoading(true);
      try {
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (currentSession && isMounted.current) {
          setSession(currentSession);
          const fetchedProfile = await fetchUserProfile(currentSession.user.id);
          if (isMounted.current) {
            setProfile(fetchedProfile);
            if (fetchedProfile) {
              setIsAdmin(fetchedProfile.role === 'admin');
              registerForPushNotificationsAsync().catch(err => {
                console.error("Failed to register for push notifications on session load:", err);
              });
              // Initial redirect only if not done yet
              if (!initialRedirectDone) {
                const redirectPathTarget = getRedirectPath(fetchedProfile.role);
                console.log(`[AuthContext] Initial load redirect to: ${redirectPathTarget}`);
                if (router.canGoBack()) router.dismissAll(); 
                router.replace(redirectPathTarget);
                setInitialRedirectDone(true);
              }
            } else {
              setIsAdmin(false);
              console.warn("[AuthContext] User session exists but no profile found on initial load.");
              if (!initialRedirectDone && typeof currentPathname === 'string' && !currentPathname.startsWith('/(auth)')) {
                if (router.canGoBack()) router.dismissAll();
                router.replace('/(auth)' as Href); 
                setInitialRedirectDone(true); // Mark redirect as done even for auth fallback
              }
            }
          }
        } else if (isMounted.current) { // No active session
          setSession(null);
          setProfile(null);
          setIsAdmin(false);
          if (!initialRedirectDone && typeof currentPathname === 'string' && !currentPathname.startsWith('/(auth)')) {
            if (router.canGoBack()) router.dismissAll();
            router.replace('/(auth)' as Href); 
            setInitialRedirectDone(true);
          }
        }
      } catch (e) {
        if (isMounted.current) {
          console.error('[AuthContext] Error fetching session and profile:', e);
          setProfile(null);setSession(null);setIsAdmin(false);
          if (!initialRedirectDone && typeof currentPathname === 'string' && !currentPathname.startsWith('/(auth)')) {
             if (router.canGoBack()) router.dismissAll(); router.replace('/(auth)' as Href); setInitialRedirectDone(true);
          }
        }
      } finally {
        if (isMounted.current) setLoading(false);
      }
    };
    fetchInitialData();
    return () => { isMounted.current = false; };
  }, [fetchUserProfile]); // Only runs on mount and if fetchUserProfile changes (it shouldn't)

  // Effect for Auth State Changes
  useEffect(() => {
    isMounted.current = true; // Ensure mounted is true when subscription might fire
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, currentAuthStateSession) => {
      if (!isMounted.current) return;
      console.log("[AuthContext] Auth state changed. Event:", _event, "Session:", !!currentAuthStateSession);
      setLoading(true);
      setSession(currentAuthStateSession);
      setInitialRedirectDone(false); // Reset redirect flag on auth state change, new login might need it

      if (currentAuthStateSession) {
        const fetchedProfile = await fetchUserProfile(currentAuthStateSession.user.id);
        if (isMounted.current) {
          setProfile(fetchedProfile);
          if (fetchedProfile) {
            setIsAdmin(fetchedProfile.role === 'admin');
            registerForPushNotificationsAsync().catch(err => {
              console.error("Failed to register for push notifications on auth state change:", err);
            });
            // Redirect on new login/auth state change if redirect not yet done for this new state
            // This check needs to be careful not to interfere with user navigation after initial redirect
            const redirectPathTarget = getRedirectPath(fetchedProfile.role);
            console.log(`[AuthContext] AuthStateChange redirect to: ${redirectPathTarget}, current: ${currentPathname}`);
            if (router.canGoBack()) router.dismissAll(); 
            router.replace(redirectPathTarget);
            setInitialRedirectDone(true); // Mark redirect done for this auth session
            
          } else { // No profile on auth change
            setIsAdmin(false);
            console.warn("[AuthContext] No profile on auth state change. Current path:", currentPathname);
            if (typeof currentPathname === 'string' && !currentPathname.startsWith('/(auth)')) {
               if (router.canGoBack()) router.dismissAll(); 
               router.replace('/(auth)' as Href); 
               setInitialRedirectDone(true);
            }
          }
        }
      } else { // No session from AuthStateChange (logout)
        if (isMounted.current) {
          setProfile(null);
          setIsAdmin(false);
          console.log("[AuthContext] Logout detected, redirecting to auth.");
          if (router.canGoBack()) router.dismissAll(); 
          router.replace('/(auth)' as Href); 
          setInitialRedirectDone(true); // Set to true as auth is the target state
        }
      }
      if (isMounted.current) setLoading(false);
    });
    return () => { 
        isMounted.current = false; // Set on cleanup
        authListener.subscription.unsubscribe(); 
    };
  }, [fetchUserProfile]); // currentPathname removed from dependencies here

  const getRedirectPath = (role?: UserRole): Href => {
    if (role === 'farmer') return '/(tabs)/farmer-dashboard' as Href;
    if (role === 'buyer') return '/(tabs)/index' as Href;
    return '/(auth)' as Href;
  };

  const signIn = async (phone: string, password: string) => {
    setLoading(true);
    // setInitialRedirectDone(false); // Reset before sign-in attempt
    const { error } = await supabase.auth.signInWithPassword({ phone, password });
    if (error) {
      console.error("Error in signIn:", error.message);
      alert(error.message);
      setLoading(false);
    }
    // setLoading(false) will be handled by onAuthStateChange effect
  };

  const signUp = async (phone: string, password: string, name: string, role: UserRole, location?: string, farm_size?: number, termsAccepted?: boolean) => {
    setLoading(true);
    // setInitialRedirectDone(false); // Reset before sign-up attempt
    const { data: { user: authUser, session: authSession }, error: signUpError } = await supabase.auth.signUp({
      phone, password,
      options: { data: { role } }, 
    });

    if (signUpError) {
      console.error("Error in signUp:", signUpError.message);
      alert(signUpError.message);
      setLoading(false);
      return;
    }
    if (!authUser) {
        alert("Sign up successful, but no user data returned. Please try logging in.");
        setLoading(false);
        router.replace('/(auth)/login' as Href);
        return;
    }
    const { error: profileError } = await supabase.from('profiles').insert({
      id: authUser.id, phone: authUser.phone, name, role, location, farm_size, terms_accepted: termsAccepted, updated_at: new Date().toISOString(),
    });
    if (profileError) {
      console.error("Error creating profile:", profileError.message);
      alert("Sign up successful, but error creating profile: " + profileError.message);
    } else {
      console.log("Sign up and profile creation successful for user:", authUser.id);
    }
    // setLoading(false) will be handled by onAuthStateChange effect
  };

  const updateUser = useCallback(async (updatedProfileData: Partial<User>): Promise<User | null | undefined> => {
    if (!profile?.id) {
      console.error("Cannot update user, no profile or profile ID found.");
      return;
    }
    if (!isMounted.current) return null;
    try {
      const payload = { ...updatedProfileData, updated_at: new Date().toISOString() };
      const { data, error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', profile.id)
        .select()
        .single();
      if (error) throw error;
      if (data && isMounted.current) {
        setProfile(data as User);
        return data as User;
      }
    } catch (error) {
      console.error("Error updating user profile in AuthContext:", error);
      throw error;
    }
    return null;
  }, [profile]);

  const value = {
    session, user: profile, profile, loading, updateUser, isAdmin,
    signOut: () => supabase.auth.signOut(), // This will trigger onAuthStateChange
    signIn, signUp,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};