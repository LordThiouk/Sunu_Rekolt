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
  Alert,
  ImageBackground,
  SafeAreaView,
  ActivityIndicator
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
    <SafeAreaView style={{ flex: 1 }}>
      <ImageBackground 
        source={require('@/assets/images/pattern-bg.png')}
        style={{ flex: 1 }}
      >
        {/* Semi-transparent overlay for green tint */}
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(240, 255, 240, 0.85)',
        }} />
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.logoContainer}>
              <View style={styles.iconContainer}>
                <Image 
                  source={require('@/assets/images/icon-white-svg.png')} 
                  style={styles.icon}
                />
              </View>
              <Text style={styles.title}>Connexion</Text>
            </View>

            <View style={styles.formContainer}>
              {error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <Text style={styles.inputLabel}>Numéro de téléphone</Text>
              <View style={styles.phoneInputContainer}>
                <View style={styles.countryCodeContainer}>
                  <Text style={styles.countryFlag}>🇸🇳</Text>
                  <Text style={styles.countryCode}>+221</Text>
                </View>
                <TextInput
                  value={phone}
                  onChangeText={(text) => {
                    setPhone(text);
                    setError('');
                  }}
                  placeholder="77 123 45 67"
                  keyboardType="phone-pad"
                  style={styles.phoneInput}
                  inputStyle={styles.inputText}
                />
              </View>

              <Text style={styles.inputLabel}>Mot de passe</Text>
              <TextInput
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setError('');
                }}
                placeholder="Votre mot de passe"
                secureTextEntry
                icon={<Feather name="lock" size={20} color={Colors.neutral[600]} />}
                style={styles.passwordInput}
                inputStyle={styles.inputText}
              />

              <TouchableOpacity style={styles.forgotPasswordContainer}>
                <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.loginButtonText}>Se connecter</Text>
                )}
              </TouchableOpacity>

              <View style={styles.signupContainer}>
                <Text style={styles.signupText}>
                  Nouveau sur Sunu Rekolt ?{' '}
                  <Text 
                    style={styles.signupLink}
                    onPress={() => router.push('/(auth)/register')}
                  >
                    Créer un compte
                  </Text>
                </Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#212121',
    textAlign: 'center',
    fontFamily: 'BalooBhai2_600SemiBold',
  },
  formContainer: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 16,
    color: '#424242',
    marginBottom: 8,
    fontFamily: 'BalooBhai2_400Regular',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  countryCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
  },
  countryFlag: {
    marginRight: 8,
    fontSize: 16,
  },
  countryCode: {
    fontSize: 16,
    color: '#212121',
    fontFamily: 'BalooBhai2_400Regular',
  },
  phoneInput: {
    flex: 1,
    marginBottom: 0,
  },
  passwordInput: {
    marginBottom: 8,
  },
  inputText: {
    fontFamily: 'BalooBhai2_400Regular',
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#059669',
    fontSize: 14,
    fontFamily: 'BalooBhai2_400Regular',
  },
  loginButton: {
    backgroundColor: '#059669',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'BalooBhai2_400Regular',
  },
  signupContainer: {
    alignItems: 'center',
  },
  signupText: {
    fontSize: 14,
    color: '#424242',
    textAlign: 'center',
    fontFamily: 'BalooBhai2_400Regular',
  },
  signupLink: {
    color: '#059669',
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 236, 236, 0.8)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error.DEFAULT,
  },
  errorText: {
    color: Colors.error.DEFAULT,
    fontSize: 14,
    fontFamily: 'BalooBhai2_400Regular',
  },
});