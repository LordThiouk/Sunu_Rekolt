import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  Alert
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Créer un compte</Text>
          <Text style={styles.subtitle}>
            Rejoignez Sunu Rekolt pour connecter directement avec les acteurs du marché agricole
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            label="Nom complet"
            value={name}
            onChangeText={setName}
            placeholder="Votre nom complet"
            icon={<Feather name="user" size={20} color={Colors.neutral[600]} />}
          />

          <TextInput
            label="Numéro de téléphone"
            value={phone}
            onChangeText={setPhone}
            placeholder="Exemple: 77 123 45 67"
            keyboardType="phone-pad"
            icon={<Feather name="phone" size={20} color={Colors.neutral[600]} />}
          />

          <View style={styles.roleToggle}>
            <Text style={styles.roleLabel}>Je suis:</Text>
            <View style={styles.roleButtons}>
              <Button
                title="Agriculteur"
                onPress={() => setRole('farmer')}
                variant={role === 'farmer' ? 'primary' : 'outline'}
                size="small"
                style={styles.roleButton}
              />
              <Button
                title="Acheteur"
                onPress={() => setRole('buyer')}
                variant={role === 'buyer' ? 'primary' : 'outline'}
                size="small"
                style={styles.roleButton}
              />
            </View>
          </View>

          {role === 'farmer' && (
            <>
              <TextInput
                label="Localisation"
                value={location}
                onChangeText={setLocation}
                placeholder="Votre région/département"
                icon={<Feather name="map-pin" size={20} color={Colors.neutral[600]} />}
              />

              <TextInput
                label="Superficie de l'exploitation (ha)"
                value={farmSize}
                onChangeText={setFarmSize}
                placeholder="Exemple: 5.5"
                keyboardType="numeric"
                icon={<Feather name="crop" size={20} color={Colors.neutral[600]} />}
              />
            </>
          )}

          <TextInput
            label="Mot de passe"
            value={password}
            onChangeText={setPassword}
            placeholder="Choisir un mot de passe"
            secureTextEntry
            icon={<Feather name="lock" size={20} color={Colors.neutral[600]} />}
          />

          <TextInput
            label="Confirmer le mot de passe"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirmer votre mot de passe"
            secureTextEntry
            icon={<Feather name="lock" size={20} color={Colors.neutral[600]} />}
          />

          <Button
            title="S'inscrire"
            onPress={handleRegister}
            loading={loading}
            style={styles.registerButton}
          />
          
          <Button
            title="Déjà un compte? Se connecter"
            onPress={() => router.replace('/(auth)/login')}
            variant="ghost"
            style={styles.loginButton}
          />
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
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
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
  roleToggle: {
    marginBottom: 16,
  },
  roleLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: Colors.neutral[800],
    fontWeight: '500',
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
  },
  registerButton: {
    marginTop: 16,
  },
  loginButton: {
    marginTop: 16,
  },
});