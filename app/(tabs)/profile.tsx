import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert, // Keep Alert for placeholders
  ActivityIndicator, // Keep for loading state
  Platform, // Added Platform for styles
} from 'react-native';
import { Image } from 'expo-image'; // Use expo-image
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons'; // Import Feather
import { useAuth } from '@/context/AuthContext';
import Colors from '@/constants/Colors';
import { User } from '@/types'; // Import User type
// Button component is no longer needed directly here unless for another purpose

// Define platform-specific values before StyleSheet.create
// const headerPaddingTop = Platform.OS === 'android' ? 40 : 20; // Temporarily commented out

// Define styles before the component uses them
const styles = StyleSheet.create({
  container_simplified: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  userName_simplified: {
    fontSize: 20,
    fontFamily: 'BalooBhai2_600SemiBold',
    color: Colors.neutral[900],
    marginBottom: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.neutral[50],
  },
  errorText: {
    fontSize: 16,
    color: Colors.error.DEFAULT,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'BalooBhai2_400Regular',
  },
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50], 
  },
  scrollContent: {
    paddingBottom: 40, 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40, // Temporarily hardcoded for Android diagnostic
    paddingBottom: 15,
    backgroundColor: Colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'BalooBhai2_600SemiBold',
    color: Colors.neutral[900],
  },
  userInfoSection: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: Colors.neutral.white,
    marginHorizontal: 15,
    borderRadius: 10,
    marginTop: 20,
    elevation: 2, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
    backgroundColor: Colors.neutral[200], // Placeholder bg
  },
  userName: {
    fontSize: 20,
    fontFamily: 'BalooBhai2_600SemiBold',
    color: Colors.neutral[900],
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 15, // Padding within the user info box for rows
  },
  infoIcon: {
    marginRight: 10,
  },
  infoText: {
    fontSize: 15,
    fontFamily: 'BalooBhai2_400Regular',
    color: Colors.neutral[700],
  },
  bioRow: {
    // For potential specific styling for bio if needed
    paddingVertical: 5,
  },
  bioText: {
    flexShrink: 1, // Allow bio text to shrink if needed
    lineHeight: 20, 
  },
  fieldPictureSection: {
    marginTop: 15,
    paddingHorizontal: 15,
    width: '100%', // Take full width of the userInfoSection
    alignItems: 'center',
  },
  fieldPictureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    alignSelf: 'flex-start', // Align header to the left
  },
  fieldPictureLabel: {
    fontSize: 15,
    fontFamily: 'BalooBhai2_500Medium',
    color: Colors.neutral[900],
    marginLeft: 5, // Space after icon
  },
  fieldPicture: {
    width: '90%', // Relative to parent
    aspectRatio: 16 / 9,
    borderRadius: 8,
    backgroundColor: Colors.neutral[200],
    alignSelf: 'center', 
  },
  actionList: {
    marginTop: 25,
    marginHorizontal: 15,
    backgroundColor: Colors.neutral.white,
    borderRadius: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    overflow: 'hidden', // Ensures border radius is respected by TouchableOpacity ripples
  },
  actionRowStyle: { // Renamed to avoid conflict if ActionRow component has its own style prop named 'actionRow'
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  actionIconBackground: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  actionLabel: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'BalooBhai2_400Regular',
    color: Colors.neutral[900],
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    marginHorizontal: 15,
    backgroundColor: Colors.error.light,
    borderRadius: 8,
    marginTop: 30,
  },
  signOutText: {
    fontSize: 16,
    fontFamily: 'BalooBhai2_500Medium',
    color: Colors.error.DEFAULT,
    marginLeft: 10,
  },
});

// Define the ActionRow component inline or keep if already defined elsewhere
interface ActionRowProps {
  iconName: keyof typeof Feather.glyphMap; // Use Feather icon names
  label: string;
  onPress: () => void;
}
// Use styles.actionRowStyle for the ActionRow component to avoid naming confusion
const ActionRow: React.FC<ActionRowProps> = ({ iconName, label, onPress }) => (
  <TouchableOpacity style={styles.actionRowStyle} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.actionIconBackground}>
      <Feather name={iconName} size={20} color={Colors.primary.DEFAULT} /> {/* Use Feather */}
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
    <Feather name="chevron-right" size={20} color={Colors.neutral[400]} /> {/* Use Feather */}
  </TouchableOpacity>
);

// Helper function to translate role
const translateRole = (role: 'farmer' | 'buyer' | 'admin' | undefined) => {
  switch (role) {
    case 'farmer': return 'Agriculteur';
    case 'buyer': return 'Acheteur';
    case 'admin': return 'Administrateur';
    default: return 'Indéfini';
  }
};

export default function ProfileScreen() {
  const { user, signOut, loading: authLoading } = useAuth();
  const router = useRouter();

  console.log('[ProfileScreen] Auth Loading:', authLoading, 'User:', user ? user.id : 'No User');

  if (authLoading) { // Only check authLoading initially
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary.DEFAULT} />
        <Text>Loading profile...</Text>
      </View>
    );
  }

  if (!user) { // After loading, if no user, show a message
    return (
      <View style={styles.loadingContainer}> 
        <Text style={styles.errorText}>Utilisateur non trouvé. Veuillez vous reconnecter.</Text>
        <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
            <Feather name="log-out" size={20} color={Colors.error.DEFAULT} />
            <Text style={styles.signOutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Simplified render for testing
  return (
    <View style={styles.container_simplified}>
      <Text style={styles.userName_simplified}>Profil de: {user.name || 'Utilisateur'}</Text>
      <Text>ID: {user.id}</Text>
      <Text>Role: {translateRole(user.role)}</Text>
      <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
        <Feather name="log-out" size={20} color={Colors.error.DEFAULT} />
        <Text style={styles.signOutText}>Se déconnecter</Text>
      </TouchableOpacity>
       {((): null => { console.log(`[ProfileScreen Render Log - Simplified] User: ${user?.name}`); return null; })()}
    </View>
  );

  /* Original Content Commented Out
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
       {((): null => { console.log(`[ProfileScreen Render Log] AvatarURL: ${user?.avatarUrl}, FieldPicURL: ${user?.fieldPictureUrl}`); return null; })()}
       
       <View style={styles.header}>
           <Text style={styles.headerTitle}>Mon Profil</Text>
           <TouchableOpacity onPress={handleSettings}>
               <Feather name="settings" size={24} color={Colors.neutral[600]} /> 
           </TouchableOpacity>
       </View>

       <View style={styles.userInfoSection}>
            {user.avatarUrl ? (
                <Image
                    key={user.avatarUrl}
                    style={styles.avatar}
                    source={{ uri: user.avatarUrl }}
                    contentFit="cover"
                    transition={100}
                    onError={(error) => console.error('Avatar Image Load Error:', error.error)}
                />
            ) : (
                 <Image
                     key="placeholder-avatar"
                     style={styles.avatar}
                     source={require('../../assets/images/default-avatar.png')}
                     contentFit="cover"
                 />
            )}
            <Text style={styles.userName}>{user.name || 'Utilisateur'}</Text>

            <View style={styles.infoRow}>
                 <Feather name="phone" size={16} color={Colors.neutral[500]} style={styles.infoIcon} /> 
                 <Text style={styles.infoText}>{user.phone}</Text>
            </View>

            <View style={styles.infoRow}>
                <Feather name="briefcase" size={16} color={Colors.neutral[500]} style={styles.infoIcon} />
                <Text style={styles.infoText}>{translateRole(user.role)}</Text>
           </View>

            {user.location && (
                <View style={styles.infoRow}>
                    <Feather name="map-pin" size={16} color={Colors.neutral[500]} style={styles.infoIcon} />
                    <Text style={styles.infoText}>{user.location}</Text>
                </View>
            )}

            {user.role === 'farmer' && user.bio && (
                 <View style={[styles.infoRow, styles.bioRow]}> 
                     <Feather name="file-text" size={16} color={Colors.neutral[500]} style={styles.infoIcon} /> 
                     <Text style={[styles.infoText, styles.bioText]} numberOfLines={3} ellipsizeMode="tail">{user.bio}</Text> 
                 </View>
            )}

            {user.role === 'farmer' && user.fieldPictureUrl && (
                 <View style={styles.fieldPictureSection}>
                    <View style={styles.fieldPictureHeader}>
                       <Feather name="image" size={16} color={Colors.neutral[600]} style={styles.infoIcon} />
                       <Text style={styles.fieldPictureLabel}>Photo des Champs</Text>
                    </View>
                    <Image
                        key={user.fieldPictureUrl}
                        style={styles.fieldPicture}
                        source={{ uri: user.fieldPictureUrl }}
                        placeholder={require('../../assets/images/default-field.png')}
                        contentFit="cover"
                        transition={100}
                        onError={(error) => console.error('Field Picture Image Load Error:', error.error)}
                    />
                </View>
           )}
        </View>

        <View style={styles.actionList}>
            <ActionRow iconName="user" label="Modifier le profil" onPress={handleEditProfile} />
            <ActionRow iconName="clock" label="Historique des commandes" onPress={handleOrderHistory} />
            <ActionRow iconName="bell" label="Notifications" onPress={handleNotifications} />
            <ActionRow iconName="shield" label="Confidentialité" onPress={handlePrivacy} />
        </View>

       <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Feather name="log-out" size={20} color={Colors.error.DEFAULT} />
            <Text style={styles.signOutText}>Se déconnecter</Text>
          </TouchableOpacity>

      </ScrollView>
  );
  */
}