import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import TextInput from '@/components/TextInput';
import Button from '@/components/Button';
import { useAuth } from '@/context/AuthContext';
import Colors from '@/constants/Colors';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { signIn } = useAuth();

  const validatePhoneNumber = (phoneNumber: string) => {
    // Remove any spaces or special characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Check if it's a valid Senegalese phone number
    // Should be 9 digits after removing the country code
    if (cleaned.length === 9) {
      return true;
    } else if (cleaned.length === 12 && cleaned.startsWith('221')) {
      return true;
    }
    return false;
  };

  const formatPhoneNumber = (phoneNumber: string) => {
    // Remove any non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // If the number starts with 221, assume it's complete
    if (cleaned.startsWith('221')) {
      return '+' + cleaned;
    }
    
    // If it's 9 digits, add the country code
    if (cleaned.length === 9) {
      return '+221' + cleaned;
    }
    
    // If it starts with 0, remove it and add country code
    if (cleaned.startsWith('0')) {
      return '+221' + cleaned.substring(1);
    }
    
    return '+221' + cleaned;
  };

  const handleLogin = async () => {
    try {
      setError(''); // Clear any previous errors
      
      if (!phone || !password) {
        setError('Veuillez remplir tous les champs');
        return;
      }

      if (!validatePhoneNumber(phone)) {
        setError('Veuillez entrer un numéro de téléphone sénégalais valide (ex: 77 123 45 67)');
        return;
      }

      if (password.length < 6) {
        setError('Le mot de passe doit contenir au moins 6 caractères');
        return;
      }

      setLoading(true);
      const formattedPhone = formatPhoneNumber(phone);
      const { error: signInError } = await signIn(formattedPhone, password);
      
      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          setError('Numéro de téléphone ou mot de passe incorrect. Veuillez vérifier vos informations.');
        } else {
          setError('Une erreur est survenue. Veuillez réessayer plus tard.');
        }
      }
      
      // Authentication state will handle redirection automatically
    } catch (error: any) {
      setError(error.message || 'Une erreur est survenue lors de la connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Image
            source={{ uri: 'https://images.pexels.com/photos/2252584/pexels-photo-2252584.jpeg' }}
            style={styles.logo}
          />
          <Text style={styles.title}>Sunu Rekolt</Text>
          <Text style={styles.subtitle}>
            Connecter les agriculteurs aux acheteurs au Sénégal
          </Text>
        </View>

        <View style={styles.form}>
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TextInput
            label="Numéro de téléphone"
            value={phone}
            onChangeText={(text) => {
              setPhone(text);
              setError(''); // Clear error when user types
            }}
            placeholder="Exemple: 77 123 45 67"
            keyboardType="phone-pad"
            icon={<Feather name="phone" size={20} color={Colors.neutral[600]} />}
          />

          <TextInput
            label="Mot de passe"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setError(''); // Clear error when user types
            }}
            placeholder="Votre mot de passe"
            secureTextEntry
            icon={<Feather name="lock" size={20} color={Colors.neutral[600]} />}
          />

          <Button
            title="Se connecter"
            onPress={handleLogin}
            loading={loading}
            style={styles.loginButton}
          />
          
          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => router.push('/(auth)/register')}
          >
            <Text style={styles.registerText}>
              Nouveau sur Sunu Rekolt? <Text style={styles.registerHighlight}>S'inscrire</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.primary.DEFAULT,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.neutral[600],
    textAlign: 'center',
    marginBottom: 16,
  },
  form: {
    width: '100%',
  },
  errorContainer: {
    backgroundColor: Colors.neutral[100],
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary.DEFAULT,
  },
  errorText: {
    color: Colors.primary.DEFAULT,
    fontSize: 14,
    lineHeight: 20,
  },
  loginButton: {
    marginTop: 8,
  },
  registerLink: {
    marginTop: 24,
    alignItems: 'center',
  },
  registerText: {
    fontSize: 16,
    color: Colors.neutral[700],
  },
  registerHighlight: {
    color: Colors.primary.DEFAULT,
    fontWeight: '600',
  },
});