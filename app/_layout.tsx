import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { BalooBhai2_400Regular, BalooBhai2_500Medium, BalooBhai2_600SemiBold, BalooBhai2_700Bold } from '@expo-google-fonts/baloo-bhai-2';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { NotificationProvider } from '@/context/NotificationContext';
import * as Notifications from 'expo-notifications';
import { router, Href } from 'expo-router';

// Keep splash screen visible while loading fonts
SplashScreen.preventAutoHideAsync();

// Initialize Notifications Handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.MAX, 
    sound: 'default',
    // Adding these as they seem required by the type definition
    shouldShowBanner: true, // For iOS, banner presentation
    shouldShowList: true,   // For iOS, notification center
  }),
});

export default function RootLayout() {
  useFrameworkReady();

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    BalooBhai2_400Regular,
    BalooBhai2_500Medium, 
    BalooBhai2_600SemiBold,
    BalooBhai2_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      // Hide splash screen once fonts are loaded or if there was an error
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    // Listener for when a notification is received while the app is foregrounded
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received while foregrounded:', notification);
    });

    // Listener for when a user taps on or interacts with a notification (works when app is foregrounded, backgrounded, or killed)
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response received:', response);
      const notificationData = response.notification.request.content.data;
      
      let targetPath: Href = "/(tabs)/" as Href;

      if (notificationData && typeof notificationData.screen === 'string') {
        const screenPathString = notificationData.screen as string; // Treat as string for validation
        if (screenPathString && screenPathString.startsWith('/')) {
          targetPath = screenPathString as Href; // Cast back to Href for router
        }
        const params = notificationData.params as Record<string, any> | undefined;
        
        setTimeout(() => {
          try {
            if (params) {
              // When using an object for push, pathname should be a string literal if possible,
              // or cast to any if truly dynamic and Href object causes issues.
              // For now, let's assume targetPath (which is Href) is acceptable directly here if it's a string-like Href.
              if (typeof targetPath === 'string') {
                // Casting pathname to any to bypass strict Href object typing issues with dynamic paths
                router.push({ pathname: targetPath as any, params });
              } else if (targetPath && typeof targetPath === 'object' && targetPath.pathname) {
                // Casting pathname to any
                 router.push({ pathname: targetPath.pathname as any, params: {...targetPath.params, ...params} });
              } else {
                console.warn("targetPath is not a valid string or Href object for navigation with params");
                router.push("/(tabs)/" as Href);
              }
            } else {
              router.push(targetPath);
            }
          } catch (e) {
            console.error("Failed to navigate from notification:", e);
            router.push("/(tabs)/" as Href);
          }
        }, 100);

      } else {
        // Navigate to default if no specific screen data
        setTimeout(() => {
          try {
            router.push(targetPath); // targetPath is already defaulted to "/(tabs)/"
          } catch (e) {
            console.error("Failed to navigate from notification (default path):", e);
          }
        }, 100);
      }
    });

    return () => {
      // Use .remove() on the subscription object itself
      if (notificationListener) {
        notificationListener.remove();
      }
      if (responseListener) {
        responseListener.remove();
      }
    };
  }, []);

  // Return null if fonts are still loading
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AuthProvider>
      <NotificationProvider>
        <CartProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" options={{ title: 'Page non trouvée' }} />
          </Stack>
          <StatusBar style="auto" />
        </CartProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}