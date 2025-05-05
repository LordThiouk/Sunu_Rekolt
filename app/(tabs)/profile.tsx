import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert, // Keep Alert for placeholders
  ActivityIndicator, // Keep for loading state
} from 'react-native';
import { Image } from 'expo-image'; // Use expo-image
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons'; // Import Feather
import { useAuth } from '@/context/AuthContext';
import Colors from '@/constants/Colors';
import { User } from '@/types'; // Import User type
// Button component is no longer needed directly here unless for another purpose

// Define the ActionRow component inline or keep if already defined elsewhere
interface ActionRowProps {
  iconName: keyof typeof Feather.glyphMap; // Use Feather icon names
  label: string;
  onPress: () => void;
}
const ActionRow: React.FC<ActionRowProps> = ({ iconName, label, onPress }) => (
  <TouchableOpacity style={styles.actionRow} onPress={onPress} activeOpacity={0.7}>
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

  const handleEditProfile = () => {
    router.push('/(tabs)/edit-profile');
  };

  const handleOrderHistory = () => {
    // TODO: Navigate to a dedicated order history screen
    // For now, placeholder:
    // router.push('/(tabs)/order-history'); // Create this file later
     Alert.alert("Historique", "Navigation vers l'historique des commandes (à implémenter).");
  };

  const handleNotifications = () => {
    Alert.alert("Notifications", "Fonctionnalité à implémenter.");
  };

  const handlePrivacy = () => {
    Alert.alert("Confidentialité", "Navigation vers les paramètres de confidentialité (à implémenter).");
  };

   const handleSettings = () => {
     Alert.alert("Paramètres", "Navigation vers les paramètres généraux (à implémenter).");
  };

  const handleSignOut = () => {
    signOut();
  };

  if (authLoading || !user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary.DEFAULT} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
       {/* ---- ADD RENDER LOG ---- */}
       {((): null => { console.log(`[ProfileScreen Render Log] AvatarURL: ${user?.avatarUrl}, FieldPicURL: ${user?.fieldPictureUrl}`); return null; })()}
       
       {/* Header */}
       <View style={styles.header}>
           <Text style={styles.headerTitle}>Mon Profil</Text>
           <TouchableOpacity onPress={handleSettings}>
               <Feather name="settings" size={24} color={Colors.neutral[600]} /> {/* Feather */}
           </TouchableOpacity>
       </View>

       {/* User Info */}
       <View style={styles.userInfoSection}>
            {/* Conditionally render Image based on context user.avatarUrl */}
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
                 // Show placeholder if no avatarUrl
                 <Image
                     key="placeholder-avatar"
                     style={styles.avatar}
                     source={require('../../assets/images/default-avatar.png')}
                     contentFit="cover"
                 />
            )}
            <Text style={styles.userName}>{user.name || 'Utilisateur'}</Text>

            {/* Phone */}
            <View style={styles.infoRow}>
                 <Feather name="phone" size={16} color={Colors.neutral[500]} style={styles.infoIcon} /> {/* Feather */}
                 <Text style={styles.infoText}>{user.phone}</Text>
            </View>

            {/* Role */}
            <View style={styles.infoRow}>
                <Feather name="briefcase" size={16} color={Colors.neutral[500]} style={styles.infoIcon} /> {/* Feather */}
                <Text style={styles.infoText}>{translateRole(user.role)}</Text>
           </View>

            {/* Location (Conditional) */}
            {user.location && (
                <View style={styles.infoRow}>
                    <Feather name="map-pin" size={16} color={Colors.neutral[500]} style={styles.infoIcon} /> {/* Feather */}
                    <Text style={styles.infoText}>{user.location}</Text>
                </View>
            )}

            {/* Bio (Conditional for Farmer) */}
            {user.role === 'farmer' && user.bio && (
                 <View style={[styles.infoRow, styles.bioRow]}> {/* Add optional specific style */}
                     <Feather name="file-text" size={16} color={Colors.neutral[500]} style={styles.infoIcon} /> {/* Feather - file-text for Bio */}
                     <Text style={[styles.infoText, styles.bioText]} numberOfLines={3} ellipsizeMode="tail">{user.bio}</Text> {/* Limit lines */}
                 </View>
            )}

            {/* Field Picture (Conditional - Use context user) */}
            {user.role === 'farmer' && user.fieldPictureUrl && (
                 // Restore Original Content:
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

       {/* Action List - Handlers use context user or localUser as appropriate */}
        <View style={styles.actionList}>
            <ActionRow iconName="user" label="Modifier le profil" onPress={handleEditProfile} />
            <ActionRow iconName="clock" label="Historique des commandes" onPress={handleOrderHistory} /> {/* Feather - clock for History */}
            <ActionRow iconName="bell" label="Notifications" onPress={handleNotifications} />
            <ActionRow iconName="shield" label="Confidentialité" onPress={handlePrivacy} />
        </View>

       {/* Sign Out Button */}
       {/* Use a TouchableOpacity for custom styling instead of Button component */}
       <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Feather name="log-out" size={20} color={Colors.error.DEFAULT} /> {/* Feather */}
            <Text style={styles.signOutText}>Se déconnecter</Text>
          </TouchableOpacity>

      </ScrollView>
  );
}

// --- Add new Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50], // Light background
  },
  scrollContent: {
    paddingBottom: 40, // Space at the bottom
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.neutral[50],
  },
   errorText: { // Added error text style
     color: Colors.error.DEFAULT,
     fontSize: 16,
     textAlign: 'center',
   },
  // Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20, // Adjust as needed for status bar height
    paddingBottom: 10,
    backgroundColor: Colors.neutral.white, // White background for header area maybe? Or keep transparent
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600', // Semibold
    color: Colors.neutral[800],
  },
  // User Info Styles
  userInfoSection: {
    alignItems: 'center',
    paddingVertical: 20, // Reduced padding slightly
    paddingHorizontal: 20, // Added horizontal padding for text alignment
    backgroundColor: Colors.neutral.white,
    marginBottom: 10,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.neutral[200],
    marginBottom: 16,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.neutral[900],
    marginBottom: 8, // Increased margin
  },
   // NEW: Style for info rows (Phone, Role, Location)
   infoRow: {
     flexDirection: 'row',
     alignItems: 'center',
     marginTop: 6, // Space between rows
     // Removed phoneContainer style as this replaces it
  },
   infoIcon: {
       marginRight: 8,
   },
   infoText: {
     fontSize: 14,
     color: Colors.neutral[600],
   },
   // NEW: Optional specific styles for Bio row/text
   bioRow: {
       alignItems: 'flex-start', // Align icon to top if text wraps
   },
   bioText: {
       flexShrink: 1, // Allow text to shrink and wrap if needed
       lineHeight: 18, // Adjust line height for readability
   },
   // NEW: Styles for Field Picture Section
   fieldPictureSection: {
       width: '100%', // Take full width for centering
       marginTop: 20, // Space above field picture section
       paddingTop: 15,
       borderTopWidth: 1,
       borderTopColor: Colors.neutral[100],
       alignItems: 'center', // Center the image
   },
   fieldPictureHeader: {
       flexDirection: 'row',
       alignItems: 'center',
       marginBottom: 10,
   },
   fieldPictureLabel: {
       fontSize: 14,
       color: Colors.neutral[600],
       fontWeight: '500',
   },
   fieldPicture: {
       width: '90%', // Make image slightly less than full width
       height: 150, // Keep height or adjust as needed
       borderRadius: 8,
       backgroundColor: Colors.neutral[200], // Placeholder bg
   },
  // Action List Styles
  actionList: {
    backgroundColor: Colors.neutral.white,
    borderRadius: 8, // Optional: adds rounded corners if list isn't edge-to-edge
    marginHorizontal: 10, // Add margin if not edge-to-edge
    overflow: 'hidden', // Needed for borderRadius
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100], // Lighter separator
  },
   actionIconBackground: { // Optional: Circle background for icons
     width: 36,
     height: 36,
     borderRadius: 18,
     backgroundColor: Colors.primary[50], // Light primary color background
     justifyContent: 'center',
     alignItems: 'center',
     marginRight: 16,
  },
  actionLabel: {
    flex: 1,
    fontSize: 16,
    color: Colors.neutral[700],
  },
  // Sign Out Button Styles
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.error.light, // Light red background (FIXED: Use light shade)
    borderRadius: 8,
    paddingVertical: 14,
    marginHorizontal: 20, // Give some horizontal margin
    marginTop: 30, // Space above the button
  },
  signOutText: {
    fontSize: 16,
    color: Colors.error.DEFAULT, // Red text
    fontWeight: '600',
    marginLeft: 8,
  },
});