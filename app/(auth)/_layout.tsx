import { Stack } from 'expo-router';
import Colors from '@/constants/Colors';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.primary.DEFAULT,
        },
        headerTintColor: Colors.neutral.white,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerBackTitle: 'Retour',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Bienvenue', headerShown: false }} />
      <Stack.Screen name="login" options={{ title: 'Connexion', headerShown: false }} />
      <Stack.Screen name="register" options={{ title: 'Inscription', headerShown: false }} />
    </Stack>
  );
}