import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase'; // Corrected path
import Constants from 'expo-constants'; // Import Constants

const EXPO_PUSH_TOKEN_KEY = 'expoPushToken';

// Function to register for push notifications
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    console.log('Requesting push notification permissions...');
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    alert('Failed to get push token for push notification! Please enable notifications in your settings.');
    console.log('Push notification permission not granted.');
    return null;
  }

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      console.error("EAS Project ID (Constants.expoConfig.extra.eas.projectId) not found. Cannot get push token reliably.");
      // alert('Project ID not found. Push notifications might not work correctly.'); // Optional: alert user
      // Depending on strictness, you might want to return null here,
      // but getExpoPushTokenAsync might still work for dev clients without it explicitly.
      // However, it's best practice for EAS builds.
    }
    
    console.log(`Attempting to get push token with projectId: ${projectId}`);
    const pushTokenData = await Notifications.getExpoPushTokenAsync({
      projectId: projectId, // Explicitly pass projectId
    });
    token = pushTokenData.data;
    console.log('Expo Push Token obtained:', token);

    // Save the token to AsyncStorage
    if (token) {
      await AsyncStorage.setItem(EXPO_PUSH_TOKEN_KEY, token);
      console.log('Push token saved to AsyncStorage.');

      // Save the token to Supabase user profile
      const { data: { user } } = await supabase.auth.getUser();
      if (user) { // Check if user exists before trying to update
        console.log(`Saving push token to Supabase for user: ${user.id}`);
        const { error } = await supabase
          .from('profiles')
          .update({ expo_push_token: token, updated_at: new Date().toISOString() })
          .eq('id', user.id);

        if (error) {
          console.error('Error saving push token to Supabase:', error.message);
          // Optionally, alert the user or retry, but don't block on this for now
        } else {
          console.log('Push token successfully saved to Supabase.');
        }
      } else {
        console.warn('No authenticated user found. Cannot save push token to Supabase profile yet.');
      }
    } else {
      console.warn('Expo push token was null or undefined after getExpoPushTokenAsync.');
    }
  } catch (e: any) { // Catch specific error type if known, else any
    console.error('Failed to get or process Expo push token:', e.message || e);
    alert('Failed to get push token for push notification! An error occurred.');
    return null;
  }
  
  return token;
}

// Optional: A function to get the stored token if needed elsewhere
export async function getStoredExpoPushToken(): Promise<string | null> {
  return AsyncStorage.getItem(EXPO_PUSH_TOKEN_KEY);
} 