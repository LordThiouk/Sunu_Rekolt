import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/Button'; // Assuming Button component exists
import Colors from '@/constants/Colors';
import { User as UserIcon, Phone as PhoneIcon, MapPin as MapPinIcon, Tractor as TractorIcon } from 'lucide-react-native'; // Assuming TractorIcon exists or use another appropriate icon
import { decode } from 'base64-arraybuffer'; // Needed for base64 conversion

const BUCKET_NAME = 'user-uploads';

export default function EditProfileScreen() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [farmSize, setFarmSize] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedAvatarUri, setSelectedAvatarUri] = useState<string | null>(null);
  const [selectedFieldPictureUri, setSelectedFieldPictureUri] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setLocation(user.location || '');
      setFarmSize(user.farmSize?.toString() || '');
      setBio(user.bio || '');
      setLoading(false);
    } else {
       // Handle case where user is not loaded yet or is null
       setLoading(false);
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) {
      Alert.alert('Erreur', 'Utilisateur non trouvé.');
      return;
    }
    if (!name.trim()) {
      Alert.alert('Erreur', 'Le nom ne peut pas être vide.');
      return;
    }

    // Farm size validation (if farmer)
    let numericFarmSize: number | null = null;
    if (user.role === 'farmer') {
        if (farmSize.trim()) {
           numericFarmSize = parseFloat(farmSize.replace(',', '.'));
           if (isNaN(numericFarmSize) || numericFarmSize < 0) {
              Alert.alert('Erreur', 'La taille de l\'exploitation doit être un nombre positif.');
              return;
            }
        } else {
            numericFarmSize = null;
        }
    }

    setSaving(true);
    setUploading(true); // Indicate potentially lengthy operation
    Keyboard.dismiss();

    let avatarUploadUrl: string | null = null;
    let fieldPictureUploadUrl: string | null = null;
    let uploadErrorOccurred = false;

    try {
        // --- Upload Images First ---
        if (selectedAvatarUri) {
           console.log('Attempting to upload avatar...');
           avatarUploadUrl = await uploadImage(selectedAvatarUri, user.id, 'avatar');
           if (!avatarUploadUrl) uploadErrorOccurred = true;
           else console.log('Avatar upload finished, URL:', avatarUploadUrl);
        }
        
        if (!uploadErrorOccurred && selectedFieldPictureUri && user.role === 'farmer') {
            console.log('Attempting to upload field picture...');
            fieldPictureUploadUrl = await uploadImage(selectedFieldPictureUri, user.id, 'field');
            if (!fieldPictureUploadUrl) uploadErrorOccurred = true;
            else console.log('Field picture upload finished, URL:', fieldPictureUploadUrl);
        }

        setUploading(false); // Uploading part finished

        // If an upload error occurred, stop the save process
        if (uploadErrorOccurred) {
             console.log('Save process stopped due to image upload error.');
             setSaving(false);
             return; // Error already alerted in uploadImage
        }

        // --- Prepare Profile Updates ---
       const updates: { 
           name: string; 
           location?: string | null; 
           farm_size?: number | null; 
           bio?: string | null; 
           avatar_url?: string | null; 
           field_picture_url?: string | null; 
       } = {
           name: name.trim(),
       };

       // Only include farmer fields if the role is farmer
       if (user.role === 'farmer') {
           updates.location = location.trim() || null;
           updates.farm_size = numericFarmSize;
           updates.bio = bio.trim() || null;
       }
       // Add uploaded image URLs ONLY if they were successfully uploaded in THIS save attempt
       if (avatarUploadUrl) updates.avatar_url = avatarUploadUrl;
       if (fieldPictureUploadUrl) updates.field_picture_url = fieldPictureUploadUrl;

       // Filter out fields that haven't changed
       const changedUpdates: Partial<typeof updates> = {};
       if (updates.name !== user.name) changedUpdates.name = updates.name;
       // Only add avatar_url to changedUpdates if it was successfully uploaded *and* is different from current
       if (updates.avatar_url && updates.avatar_url !== user.avatarUrl) changedUpdates.avatar_url = updates.avatar_url;

       if (user.role === 'farmer') {
           if (updates.location !== user.location) changedUpdates.location = updates.location;
           const currentFarmSize = user.farmSize ?? null;
           if (numericFarmSize !== currentFarmSize) changedUpdates.farm_size = numericFarmSize;
           if (updates.bio !== user.bio) changedUpdates.bio = updates.bio;
            // Only add field_picture_url if uploaded and different
           if (updates.field_picture_url && updates.field_picture_url !== user.fieldPictureUrl) changedUpdates.field_picture_url = updates.field_picture_url;
       }

       // Check if anything changed (text fields OR successfully uploaded images)
       if (Object.keys(changedUpdates).length === 0) {
            Alert.alert('Info', 'Aucune modification détectée.');
            setSaving(false);
            setSelectedAvatarUri(null);
            setSelectedFieldPictureUri(null);
            return;
       }

       // --- Update Profile Table ---
     console.log('Updating profile with changes:', changedUpdates);
     const { error } = await supabase
       .from('profiles')
       .update(changedUpdates)
       .eq('id', user.id);

     if (error) throw error;

     Alert.alert('Succès', 'Profil mis à jour.');
      // Reset selected images after successful save
      setSelectedAvatarUri(null);
      setSelectedFieldPictureUri(null);
      // TODO: Update AuthContext state with new user data (including URLs) & navigate back

   } catch (error) {
     const message = error instanceof Error ? error.message : 'Une erreur inconnue est survenue.';
     console.error('Error saving profile:', error);
     Alert.alert('Erreur', `Impossible de sauvegarder le profil: ${message}`);
   } finally {
     setSaving(false);
     setUploading(false); // Ensure uploading is always reset
   }
 };

  const handleSelectImage = async (type: 'avatar' | 'field') => {
    if (!user) return;

    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Désolé, nous avons besoin des permissions de la galerie pour choisir une image.');
      return;
    }

    try {
      setUploading(true); // Indicate activity
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === 'avatar' ? [1, 1] : [16, 9], // Square for avatar, wide for field
        quality: 0.7, // Lower quality slightly for faster uploads
        base64: true, // Request base64 for easier upload
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (type === 'avatar') {
          setSelectedAvatarUri(asset.uri); // Keep local URI for display
        } else if (type === 'field') {
          setSelectedFieldPictureUri(asset.uri); // Keep local URI for display
        }
        // Base64 is now in asset.base64, URI is in asset.uri
      } 
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner une image.');
    } finally {
      setUploading(false); // End activity
    }
  };

  // Helper function to upload image
  const uploadImage = async (uri: string, userId: string, type: 'avatar' | 'field'): Promise<string | null> => {
    try {
        // Extract file extension
        const fileExt = uri.split('.').pop()?.toLowerCase() ?? 'jpeg';
        const path = `${type}s/${userId}/${Date.now()}.${fileExt}`;
        const contentType = `image/${fileExt}`; // Basic content type

        // Fetch the image data as a blob
        // Note: `fetch` requires network access. Consider `expo-file-system` for reading local files if needed.
        const response = await fetch(uri);
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
        }
        const blob = await response.blob();

        console.log(`Uploading image to bucket: ${BUCKET_NAME}, path: ${path}, type: ${contentType}`);

        // Upload to Supabase Storage
        const { data, error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(path, blob, {
                contentType,
                upsert: true, // Overwrite if somehow the exact same timestamp exists
                cacheControl: '3600' // Optional: Cache for 1 hour
            });

        if (uploadError) {
            console.error('Error uploading image:', uploadError);
            throw uploadError;
        }

        if (!data?.path) {
             console.error('Upload succeeded but path is missing in response:', data);
             throw new Error("L\'upload a réussi mais le chemin du fichier est manquant.");
        }

        console.log('Upload successful, getting public URL for path:', data.path);

        // Get public URL
        const { data: publicUrlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(data.path);

        if (!publicUrlData?.publicUrl) {
            console.error('Error getting public URL, data:', publicUrlData);
            throw new Error("Impossible d'obtenir l'URL publique de l'image.");
        }

        console.log('Public URL obtained:', publicUrlData.publicUrl);
        return publicUrlData.publicUrl;

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Une erreur inconnue est survenue lors de l\'upload.';
        console.error(`Image Upload Error (${type}):`, message);
        Alert.alert('Erreur d\'upload', `Impossible de téléverser l\'image ${type}: ${message}`);
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary.DEFAULT} />
      </View>
    );
  }

  if (!user) {
     return (
       <View style={styles.loadingContainer}>
         <Text style={styles.errorText}>Impossible de charger les informations utilisateur.</Text>
       </View>
     );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Modifier le profil</Text>

        {/* Profile Picture Section */}
        <View style={styles.imagePickerContainer}>
            <Text style={styles.imageLabel}>Photo de profil</Text>
            <TouchableOpacity onPress={() => handleSelectImage('avatar')} disabled={saving || uploading}>
                 <Image
                    style={styles.profileImage}
                    source={{ uri: selectedAvatarUri || user?.avatarUrl || undefined }}
                    placeholder={require('@/assets/images/default-avatar.png')} // Use a placeholder asset
                    contentFit="cover"
                    transition={100}
                 />
                 {/* Add an overlay or icon to indicate edit? */}
            </TouchableOpacity>
            <Button 
                title="Modifier la photo" 
                onPress={() => handleSelectImage('avatar')} 
                variant="outline"
                size="small"
                style={styles.imageButton}
                disabled={saving || uploading}
            />
        </View>

        {/* Name Input */}
        <View style={styles.inputGroup}>
          <UserIcon size={18} color={Colors.neutral[500]} style={styles.inputIcon} />
          <Text style={styles.label}>Nom complet</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Votre nom complet"
            autoCapitalize="words"
            textContentType="name"
            editable={!saving}
          />
        </View>

        {/* Phone (Read-only) */}
        <View style={styles.inputGroup}>
           <PhoneIcon size={18} color={Colors.neutral[500]} style={styles.inputIcon} />
           <Text style={styles.label}>Numéro de téléphone</Text>
           <Text style={styles.readOnlyText}>{user.phone}</Text>
        </View>

        {/* Location Input (Farmer Only) */}
        {user.role === 'farmer' && (
          <View style={styles.inputGroup}>
            <MapPinIcon size={18} color={Colors.neutral[500]} style={styles.inputIcon} />
            <Text style={styles.label}>Localisation (Ville/Village)</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Ex: Dakar, Thiès..."
              autoCapitalize="words"
              textContentType="addressCity"
              editable={!saving}
            />
          </View>
        )}

        {/* Farm Size Input (Farmer Only) */}
        {user.role === 'farmer' && (
          <View style={styles.inputGroup}>
            <TractorIcon size={18} color={Colors.neutral[500]} style={styles.inputIcon} />
            <Text style={styles.label}>Taille de l'exploitation (hectares)</Text>
            <TextInput
              style={styles.input}
              value={farmSize}
              onChangeText={setFarmSize}
              placeholder="Ex: 2.5"
              keyboardType="numeric"
              editable={!saving}
            />
          </View>
        )}

        {/* Bio Input (Farmer Only) */}
        {user.role === 'farmer' && (
            <View style={styles.inputGroup}>
                 {/* Optional: Add an icon for bio e.g., Feather name="file-text" */}
                <Text style={styles.label}>Bio / Description</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    value={bio}
                    onChangeText={setBio}
                    placeholder="Décrivez votre activité, vos spécialités..."
                    multiline={true}
                    numberOfLines={4}
                    editable={!saving}
                />
            </View>
        )}

        {/* Field Picture Section (Farmer Only) */}
        {user.role === 'farmer' && (
             <View style={styles.imagePickerContainer}>
                <Text style={styles.imageLabel}>Photo des champs</Text>
                <TouchableOpacity onPress={() => handleSelectImage('field')} disabled={saving || uploading}>
                    <Image
                        style={styles.fieldImage}
                        source={{ uri: selectedFieldPictureUri || user?.fieldPictureUrl || undefined }}
                        placeholder={require('@/assets/images/default-field.png')} // Use a placeholder asset
                        contentFit="cover"
                        transition={100}
                    />
                    {/* Add an overlay or icon to indicate edit? */}
                </TouchableOpacity>
                 <Button 
                    title="Modifier la photo" 
                    onPress={() => handleSelectImage('field')} 
                    variant="outline"
                    size="small"
                    style={styles.imageButton}
                    disabled={saving || uploading}
                 />
            </View>
        )}

        {/* Save Button */}
        <Button
          title="Sauvegarder les modifications"
          onPress={handleSave}
          loading={saving}
          disabled={saving}
          style={styles.saveButton}
          variant='primary' // Or your default save button style
        />
      </ScrollView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  scrollContent: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.neutral[50],
  },
  errorText: {
     color: Colors.error.DEFAULT,
     fontSize: 16,
     textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.neutral[800],
    marginBottom: 24,
    textAlign: 'center',
  },
  imagePickerContainer: {
      alignItems: 'center',
      marginBottom: 24,
  },
  imageLabel: {
      fontSize: 14,
      color: Colors.neutral[600],
      marginBottom: 8,
  },
  profileImage: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: Colors.neutral[200],
      marginBottom: 12,
  },
  fieldImage: {
      width: '100%',
      height: 150,
      borderRadius: 8,
      backgroundColor: Colors.neutral[200],
      marginBottom: 12,
  },
  imageButton: {
     minWidth: 150, // Adjust as needed
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: Colors.neutral[600],
    marginBottom: 8,
    marginLeft: 28, // Space for icon
  },
  input: {
    backgroundColor: Colors.neutral.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    fontSize: 16,
    color: Colors.neutral[800],
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    paddingLeft: 40, // Space for icon inside
  },
  textArea: {
      height: 100,
      textAlignVertical: 'top',
      paddingTop: 12,
      paddingLeft: 16,
  },
  inputIcon: {
     position: 'absolute',
     left: 12,
     top: 38, // Adjust based on label height + padding/margins
     zIndex: 1,
  },
  readOnlyText: {
     fontSize: 16,
     color: Colors.neutral[500], // Dimmed color for read-only
     paddingVertical: 12,
     paddingHorizontal: 16,
     paddingLeft: 40,
     backgroundColor: Colors.neutral[100], // Slightly different background
     borderRadius: 8,
     borderWidth: 1,
     borderColor: Colors.neutral[200],
  },
  saveButton: {
    marginTop: 16,
  },
}); 