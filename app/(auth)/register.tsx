import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  Alert,
  TouchableOpacity,
  Image,
  ImageBackground,
  SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import TextInput from '@/components/TextInput';
import Button from '@/components/Button';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';
import Colors from '@/constants/Colors';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('farmer');
  const [location, setLocation] = useState('');
  const [farmSize, setFarmSize] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  
  const router = useRouter();
  const { signUp } = useAuth();

  const handleRegister = async () => {
    // Basic validation
    if (!name || !phone || !password || !confirmPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
      return;
    }

    if (role === 'farmer' && !location) {
      Alert.alert('Erreur', 'La localisation est requise pour les agriculteurs.');
      return;
    }
    
    if (!acceptedTerms) {
      Alert.alert('Erreur', 'Vous devez accepter les conditions générales d\'utilisation.');
      return;
    }

    try {
      setLoading(true);
      const formattedPhone = formatPhoneNumber(phone);
      const { error } = await signUp(
        formattedPhone, 
        password, 
        role,
        name,
        location,
        farmSize ? parseFloat(farmSize) : undefined
      );
      
      if (error) throw error;
      
      Alert.alert(
        'Compte créé avec succès',
        'Vous pouvez maintenant vous connecter avec vos identifiants.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
      );
    } catch (error: any) {
      Alert.alert('Erreur d\'inscription', error.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneNumber = (phoneNumber: string) => {
    // Ensure the number has the country code
    if (!phoneNumber.startsWith('+')) {
      return '+221' + phoneNumber.replace(/^0/, '');
    }
    return phoneNumber;
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
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Image 
                  source={require('@/assets/images/icon-white-svg.png')} 
                  style={styles.icon}
                />
              </View>
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.title}>Créer un compte</Text>
              
              <View style={styles.roleToggleContainer}>
                <TouchableOpacity 
                  style={[
                    styles.roleButton, 
                    role === 'farmer' && styles.activeRoleButton
                  ]}
                  onPress={() => setRole('farmer')}
                >
                  <Text style={[
                    styles.roleButtonText,
                    role === 'farmer' && styles.activeRoleButtonText
                  ]}>
                    Agriculteur
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.roleButton, 
                    role === 'buyer' && styles.activeRoleButton
                  ]}
                  onPress={() => setRole('buyer')}
                >
                  <Text style={[
                    styles.roleButtonText,
                    role === 'buyer' && styles.activeRoleButtonText
                  ]}>
                    Acheteur
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Nom complet</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Votre nom complet"
                icon={<Feather name="user" size={20} color={Colors.neutral[600]} />}
                style={styles.input}
                inputStyle={styles.inputText}
              />

              <Text style={styles.inputLabel}>Numéro de téléphone</Text>
              <View style={styles.phoneInputContainer}>
                <View style={styles.countryCodeContainer}>
                  <Text style={styles.countryFlag}>🇸🇳</Text>
                  <Text style={styles.countryCode}>+221</Text>
                </View>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="77 123 45 67"
                  keyboardType="phone-pad"
                  style={styles.phoneInput}
                  inputStyle={styles.inputText}
                />
              </View>

              <Text style={styles.inputLabel}>Mot de passe</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Votre mot de passe"
                secureTextEntry
                icon={<Feather name="lock" size={20} color={Colors.neutral[600]} />}
                style={styles.input}
                inputStyle={styles.inputText}
              />

              <Text style={styles.inputLabel}>Confirmation du mot de passe</Text>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirmer votre mot de passe"
                secureTextEntry
                icon={<Feather name="lock" size={20} color={Colors.neutral[600]} />}
                style={styles.input}
                inputStyle={styles.inputText}
              />

              {role === 'farmer' && (
                <>
                  <Text style={styles.inputLabel}>Localisation</Text>
                  <TextInput
                    value={location}
                    onChangeText={setLocation}
                    placeholder="Votre région/département"
                    icon={<Feather name="map-pin" size={20} color={Colors.neutral[600]} />}
                    style={styles.input}
                    inputStyle={styles.inputText}
                  />

                  <Text style={styles.inputLabel}>Superficie de l'exploitation (ha)</Text>
                  <TextInput
                    value={farmSize}
                    onChangeText={setFarmSize}
                    placeholder="Exemple: 5.5"
                    keyboardType="numeric"
                    icon={<Feather name="crop" size={20} color={Colors.neutral[600]} />}
                    style={styles.input}
                    inputStyle={styles.inputText}
                  />
                </>
              )}

              <View style={styles.termsContainer}>
                <TouchableOpacity 
                  style={styles.checkbox} 
                  onPress={() => setAcceptedTerms(!acceptedTerms)}
                >
                  {acceptedTerms && <Feather name="check" size={16} color="#059669" />}
                </TouchableOpacity>
                <Text style={styles.termsText}>
                  J'accepte les{' '}
                  <Text style={styles.termsLink}>Conditions Générales d'Utilisation</Text>
                </Text>
              </View>

              <TouchableOpacity
                style={styles.registerButton}
                onPress={handleRegister}
                disabled={loading}
              >
                <Text style={styles.registerButtonText}>Continuer</Text>
              </TouchableOpacity>

              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>
                  Déjà un compte ?{' '}
                  <Text 
                    style={styles.loginLink}
                    onPress={() => router.replace('/(auth)/login')}
                  >
                    Se connecter
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
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#059669',
    textAlign: 'center',
    fontFamily: 'BalooBhai2_600SemiBold',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  formContainer: {
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#212121',
    textAlign: 'center',
    fontFamily: 'BalooBhai2_600SemiBold',
    marginBottom: 20,
  },
  roleToggleContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeRoleButton: {
    backgroundColor: '#059669',
  },
  roleButtonText: {
    color: '#4B5563',
    fontSize: 16,
    fontFamily: 'BalooBhai2_400Regular',
  },
  activeRoleButtonText: {
    color: 'white',
    fontWeight: '600',
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
  input: {
    marginBottom: 20,
  },
  inputText: {
    fontFamily: 'BalooBhai2_400Regular',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#059669',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  termsText: {
    fontSize: 14,
    color: '#424242',
    fontFamily: 'BalooBhai2_400Regular',
  },
  termsLink: {
    color: '#059669',
    fontWeight: '600',
  },
  registerButton: {
    backgroundColor: '#059669',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'BalooBhai2_400Regular',
  },
  loginContainer: {
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#424242',
    textAlign: 'center',
    fontFamily: 'BalooBhai2_400Regular',
  },
  loginLink: {
    color: '#059669',
    fontWeight: '600',
  },
});