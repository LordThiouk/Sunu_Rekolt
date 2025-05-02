import { useEffect } from 'react';
import { useSegments, useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function Root() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    
    if (!session && !inAuthGroup) {
      // Redirect to login if not logged in
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      // Redirect to home if logged in
      router.replace('/(tabs)/');
    }
  }, [session, loading, segments]);

  return null;
}