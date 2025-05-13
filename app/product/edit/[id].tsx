import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import TextInput from '@/components/TextInput';
import Button from '@/components/Button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Product, ProductCategory, PRODUCT_CATEGORIES, PRODUCT_UNITS } from '@/types';
import Colors from '@/constants/Colors';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

export default function EditProductScreen() {
  const { id: productId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState(PRODUCT_UNITS[0]);
  const [category, setCategory] = useState<ProductCategory>(PRODUCT_CATEGORIES[0]);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null); // To store existing image URL
  const [newImageUri, setNewImageUri] = useState<string | null>(null); // To store URI of newly picked image
  
  const [loading, setLoading] = useState(false); // For overall form submission
  const [fetchingProduct, setFetchingProduct] = useState(true); // For initial data fetch
  const [uploadingImage, setUploadingImage] = useState(false); // For image upload process

  const fetchProductDetails = useCallback(async () => {
    if (!productId) {
      Alert.alert("Erreur", "ID du produit manquant.");
      router.back();
      return;
    }
    setFetchingProduct(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) throw error;
      if (!data) throw new Error("Produit non trouvé.");

      setProduct(data);
      setName(data.name);
      setDescription(data.description);
      setPrice(data.price.toString());
      setQuantity(data.quantity.toString());
      setUnit(data.unit);
      setCategory(data.category as ProductCategory);
      setCurrentImageUrl(data.image_url);

    } catch (error: any) {
      console.error("Error fetching product details:", error);
      Alert.alert("Erreur", error.message || "Impossible de charger les détails du produit.");
      router.back();
    } finally {
      setFetchingProduct(false);
    }
  }, [productId, router]);

  useFocusEffect(
    useCallback(() => {
      fetchProductDetails();
    }, [fetchProductDetails])
  );

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setNewImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };

  const uploadImage = async (uri: string): Promise<string> => {
    console.log('[uploadImageB64] Starting upload for URI:', uri);
    if (!uri) {
        throw new Error('Image URI is invalid.');
    }
    try {
      setUploadingImage(true);
      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg'; // Added toLowerCase and default
      const farmerIdForPath = product?.farmerId || user?.id; 
      if (!farmerIdForPath) throw new Error("ID de l'agriculteur non disponible pour le chemin de l'image.");

      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `products/${farmerIdForPath}/${fileName}`;
      console.log('[uploadImageB64] Target file path:', filePath);

      // Read image as base64 string
      console.log('[uploadImageB64] Reading file as base64...');
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      console.log('[uploadImageB64] Base64 string created. Length:', base64.length);

      if (!base64 || base64.length === 0) {
        console.error('[uploadImageB64] Error: Base64 string is empty.');
        throw new Error('Le fichier image est vide ou n\'a pas pu être lu en base64.');
      }

      // Convert base64 to ArrayBuffer
      console.log('[uploadImageB64] Decoding base64 to ArrayBuffer...');
      const arrayBuffer = decode(base64);
      console.log(`[uploadImageB64] ArrayBuffer created. Byte Length: ${arrayBuffer.byteLength}`);

      if (arrayBuffer.byteLength === 0) {
        console.error('[uploadImageB64] Error: ArrayBuffer size is 0.');
        throw new Error('L\'ArrayBuffer de l\'image est vide.');
      }

      // Determine content type (heuristic, improve if needed)
      let contentType = 'image/jpeg'; // Default
      if (fileExt === 'png') contentType = 'image/png';
      else if (fileExt === 'jpg' || fileExt === 'jpeg') contentType = 'image/jpeg';
      else if (fileExt === 'webp') contentType = 'image/webp';
      // Add more types if necessary
      console.log('[uploadImageB64] Determined content type:', contentType);

      // Log user IDs for RLS check verification
      console.log(`[uploadImageB64] Current auth.uid(): ${user?.id}, Farmer ID in path: ${farmerIdForPath}`);
      
      // Upload the ArrayBuffer to Supabase Storage
      console.log('[uploadImageB64] Uploading ArrayBuffer to Supabase...');
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, arrayBuffer, { 
            contentType: contentType,
            upsert: false
        });

      if (uploadError) {
        console.error('[uploadImageB64] Supabase upload error:', uploadError);
        throw uploadError; 
      }
      console.log('[uploadImageB64] Supabase upload successful:', uploadData);

      // Get public URL AFTER successful upload
      console.log('[uploadImageB64] Getting public URL...');
      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(filePath);
       if (!urlData || !urlData.publicUrl) {
            console.error('[uploadImageB64] Failed to get public URL after upload.');
            throw new Error('Impossible d\'obtenir l\'URL publique après le téléversement.');
       }
      const publicUrl = urlData.publicUrl;
      console.log('[uploadImageB64] Public URL obtained:', publicUrl);

      // Delete the OLD image only AFTER the new one is successfully uploaded and URL obtained
      const oldImageUrl = product?.image_url; 
      if (oldImageUrl && oldImageUrl !== publicUrl) { 
          try {
              const urlParts = oldImageUrl.split('/product-images/');
              let oldImagePath: string | null = null;
              if (urlParts.length > 1 && oldImageUrl.includes('/storage/v1/object/public/product-images/')) {
                  oldImagePath = urlParts[1];
              }
              
              if (oldImagePath) {
                console.log('[uploadImageB64] Attempting to remove old image at path:', oldImagePath);
                const { error: removeError } = await supabase.storage.from('product-images').remove([oldImagePath]);
                if (removeError) {
                    console.warn('[uploadImageB64] Failed to remove old image, continuing anyway:', removeError);
                } else {
                    console.log('[uploadImageB64] Old image removed successfully.');
                }
              } else {
                console.log('[uploadImageB64] Old image URL is not a standard Supabase product image path, skipping removal:', oldImageUrl);
              }
          } catch (removeEx) {
             console.warn('[uploadImageB64] Error during old image removal:', removeEx);
          }
      }

      return publicUrl;
    } catch (error) {
      console.error('[uploadImageB64] Overall error in uploadImage:', error);
      throw new Error(`Échec du téléversement de l\'image: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleUpdateProduct = async () => {
    if (!name || !description || !price || !quantity || !unit || !category) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires.');
      return;
    }
    if (!product) {
      Alert.alert('Erreur', 'Données du produit non chargées.');
      return;
    }

    setLoading(true);
    try {
      let imageUrl = currentImageUrl; // Keep current image by default

      if (newImageUri) { // If a new image was picked, upload it
        imageUrl = await uploadImage(newImageUri);
      }

      const updates = {
        name,
        description,
        price: parseFloat(price),
        quantity: parseFloat(quantity),
        unit,
        category,
        image_url: imageUrl,
        // farmer_id and is_approved are typically not changed by the farmer during an edit
        // is_approved might be reset if edits require re-approval, depends on business logic
      };

      const { error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', productId);

      if (error) throw error;

      Alert.alert(
        'Produit mis à jour',
        'Les modifications de votre produit ont été enregistrées.',
        [{ text: 'OK', onPress: () => router.replace('/(tabs)/my-products') }]
      );
    } catch (error: any) {
      console.error('Error updating product:', error);
      Alert.alert('Erreur', error.message || 'Une erreur est survenue lors de la mise à jour du produit.');
    } finally {
      setLoading(false);
    }
  };
  
  const clearImagePreview = () => {
    setNewImageUri(null); 
    // Do not clear currentImageUrl here, as it's the fallback
  };

  if (fetchingProduct) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator size="large" color={Colors.primary.DEFAULT} />
          <Text>Chargement du produit...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Determine which image to display: new one if picked, otherwise current one
  const displayImageUri = newImageUri || currentImageUrl;

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100} // Adjust as needed
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Modifier le Produit</Text>
            <Text style={styles.subtitle}>Mettez à jour les détails de votre produit.</Text>
          </View>

          <View style={styles.imageSection}>
            {displayImageUri ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: displayImageUri }} style={styles.imagePreview} />
                <TouchableOpacity style={styles.removeImageButton} onPress={newImageUri ? clearImagePreview : pickImage}>
                  <Feather name={newImageUri ? "x" : "edit-2"} size={20} color={Colors.neutral.white} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                <Feather name="camera" size={40} color={Colors.neutral[400]} />
                <Text style={styles.imagePickerText}>Changer la photo</Text>
              </TouchableOpacity>
            )}
             {/* Button to explicitly change image even if one exists */}
            {displayImageUri && !newImageUri && (
                 <TouchableOpacity style={styles.changeImageButton} onPress={pickImage}>
                    <Feather name="edit-2" size={16} color={Colors.primary.DEFAULT} style={{marginRight: 5}}/>
                    <Text style={styles.changeImageButtonText}>Changer l'image</Text>
                </TouchableOpacity>
            )}
          </View>

          <View style={styles.form}>
            <TextInput
              label="Nom du produit"
              value={name}
              onChangeText={setName}
              placeholder="Ex: Tomates fraîches"
            />
            <TextInput
              label="Description"
              value={description}
              onChangeText={setDescription}
              placeholder="Décrivez votre produit..."
              multiline
              numberOfLines={4}
            />
            <View style={styles.row}>
              <TextInput
                label="Prix (FCFA)"
                value={price}
                onChangeText={setPrice}
                placeholder="Ex: 1000"
                keyboardType="numeric"
                style={styles.halfInput}
              />
              <TextInput
                label="Quantité"
                value={quantity}
                onChangeText={setQuantity}
                placeholder="Ex: 50"
                keyboardType="numeric"
                style={styles.halfInput}
              />
            </View>
            <View style={styles.selectContainer}>
              <Text style={styles.selectLabel}>Unité</Text>
              <View style={styles.optionsContainer}>
                {PRODUCT_UNITS.map((unitOption) => (
                  <TouchableOpacity
                    key={unitOption}
                    style={[
                      styles.optionButton,
                      unit === unitOption && styles.optionButtonSelected,
                    ]}
                    onPress={() => setUnit(unitOption)}
                  >
                    <Text style={[ styles.optionText, unit === unitOption && styles.optionTextSelected ]}>
                      {unitOption}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.selectContainer}>
              <Text style={styles.selectLabel}>Catégorie</Text>
              <View style={styles.optionsContainer}>
                {PRODUCT_CATEGORIES.map((categoryOption) => (
                  <TouchableOpacity
                    key={categoryOption}
                    style={[
                      styles.optionButton,
                      category === categoryOption && styles.optionButtonSelected,
                    ]}
                    onPress={() => setCategory(categoryOption)}
                  >
                    <Text style={[ styles.optionText, category === categoryOption && styles.optionTextSelected ]}>
                      {categoryOption === 'vegetables' ? 'Légumes' : 
                       categoryOption === 'fruits' ? 'Fruits' : 
                       categoryOption === 'grains' ? 'Céréales' : 
                       categoryOption === 'livestock' ? 'Élevage' : 
                       categoryOption === 'dairy' ? 'Laitier' : 'Autres'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <Button
              title={loading || uploadingImage ? 'Mise à jour en cours...' : 'Mettre à jour le produit'}
              onPress={handleUpdateProduct}
              disabled={loading || uploadingImage || fetchingProduct}
              loading={loading || uploadingImage}
              style={styles.submitButton}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
  },
  container: { // General container, used for loading state
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centered: { // For full screen loader
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  scrollContent: {
    padding: 20, // Increased padding
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 26, // Slightly larger
    fontFamily: 'BalooBhai2_600SemiBold',
    color: Colors.primary.DEFAULT,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'BalooBhai2_400Regular',
    color: Colors.neutral[600],
    textAlign: 'center',
  },
  imageSection: {
    marginBottom: 24,
    alignItems: 'center', // Center image picker/preview
  },
  imagePicker: {
    height: 200,
    width: '100%', // Take full width
    borderWidth: 2,
    borderColor: Colors.neutral[300],
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.neutral[50], // Lighter background
  },
  imagePickerText: {
    marginTop: 8,
    fontSize: 16,
    fontFamily: 'BalooBhai2_400Regular',
    color: Colors.neutral[600],
  },
  imagePreviewContainer: {
    position: 'relative',
    height: 220, // Slightly larger preview
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10, // Space for change button
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 10, // Adjusted
    right: 10, // Adjusted
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    width: 36, // Standardized
    height: 36, // Standardized
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: Colors.neutral[100],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    marginTop: 8,
  },
  changeImageButtonText: {
    fontSize: 14,
    fontFamily: 'BalooBhai2_500Medium',
    color: Colors.primary.DEFAULT,
  },
  form: {
    // No specific styles needed for the form container itself if scrollContent has padding
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16, // Add margin to row itself
  },
  halfInput: {
    flex: 0.485, // Adjusted for slightly more gap
  },
  selectContainer: {
    marginBottom: 20, // Increased margin
  },
  selectLabel: {
    fontSize: 16, // Standardized
    fontFamily: 'BalooBhai2_500Medium', // Match TextInput label style
    color: Colors.neutral[700], // Match TextInput label style
    marginBottom: 10, // Increased margin
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    // Removed negative margin, manage spacing with button margin
  },
  optionButton: {
    backgroundColor: Colors.neutral[100], // Lighter default
    paddingHorizontal: 15, // Adjusted padding
    paddingVertical: 10, // Adjusted padding
    borderRadius: 20, // More rounded
    margin: 5, // Spacing between buttons
    borderWidth: 1,
    borderColor: Colors.neutral[300],
  },
  optionButtonSelected: {
    backgroundColor: Colors.primary.DEFAULT,
    borderColor: Colors.primary.DEFAULT,
  },
  optionText: {
    fontFamily: 'BalooBhai2_500Medium',
    color: Colors.neutral[700],
  },
  optionTextSelected: {
    color: Colors.neutral.white,
    fontFamily: 'BalooBhai2_600SemiBold',
  },
  submitButton: {
    marginTop: 24, // Increased margin
    paddingVertical: 14, // Larger touch target
  },
}); 