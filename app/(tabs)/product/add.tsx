import React, { useState } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import TextInput from '@/components/TextInput';
import Button from '@/components/Button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { ProductCategory, PRODUCT_CATEGORIES, PRODUCT_UNITS } from '@/types';
import Colors from '@/constants/Colors';

export default function AddProductScreen() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState(PRODUCT_UNITS[0]);
  const [category, setCategory] = useState<ProductCategory>(PRODUCT_CATEGORIES[0]);
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const router = useRouter();
  const { user } = useAuth();

  // Ensure user is a farmer
  if (user?.role !== 'farmer') {
    Alert.alert('Erreur', 'Seuls les agriculteurs peuvent ajouter des produits');
    router.back();
    return null;
  }

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      setUploadingImage(true);
      
      // Get file name and extension
      const fileExt = uri.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      // Convert image to blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, blob);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddProduct = async () => {
    // Basic validation
    if (!name || !description || !price || !quantity || !unit || !category) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (!image) {
      Alert.alert('Erreur', 'Veuillez ajouter une image du produit');
      return;
    }

    try {
      setLoading(true);

      // Upload image first
      const imageUrl = await uploadImage(image);

      // Add product to database
      const { error } = await supabase.from('products').insert({
        name,
        description,
        price: parseFloat(price),
        quantity: parseFloat(quantity),
        unit,
        category,
        image_url: imageUrl,
        farmer_id: user?.id,
        is_approved: false, // Requires admin approval
      });

      if (error) throw error;

      Alert.alert(
        'Produit ajouté',
        'Votre produit a été soumis et est en attente de validation par l\'administrateur.',
        [{ text: 'OK', onPress: () => router.replace('/(tabs)/profile') }]
      );
    } catch (error: any) {
      console.error('Error adding product:', error);
      Alert.alert('Erreur', error.message || 'Une erreur est survenue lors de l\'ajout du produit');
    } finally {
      setLoading(false);
    }
  };

  const clearImage = () => {
    setImage(null);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Ajouter un produit</Text>
          <Text style={styles.subtitle}>
            Remplissez les détails de votre produit agricole à vendre
          </Text>
        </View>

        <View style={styles.imageSection}>
          {image ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: image }} style={styles.imagePreview} />
              <TouchableOpacity style={styles.removeImageButton} onPress={clearImage}>
                <Feather name="x" size={24} color={Colors.neutral.white} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              <Feather name="camera" size={40} color={Colors.neutral[400]} />
              <Text style={styles.imagePickerText}>Ajouter une photo</Text>
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
              label="Prix (CFA)"
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
                  <Text
                    style={[
                      styles.optionText,
                      unit === unitOption && styles.optionTextSelected,
                    ]}
                  >
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
                  <Text
                    style={[
                      styles.optionText,
                      category === categoryOption && styles.optionTextSelected,
                    ]}
                  >
                    {categoryOption === 'vegetables'
                      ? 'Légumes'
                      : categoryOption === 'fruits'
                      ? 'Fruits'
                      : categoryOption === 'grains'
                      ? 'Céréales'
                      : categoryOption === 'livestock'
                      ? 'Élevage'
                      : categoryOption === 'dairy'
                      ? 'Laitier'
                      : 'Autres'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Button
            title={loading ? 'Ajout en cours...' : 'Ajouter le produit'}
            onPress={handleAddProduct}
            disabled={loading || uploadingImage}
            loading={loading || uploadingImage}
            style={styles.submitButton}
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
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary.DEFAULT,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.neutral[600],
  },
  imageSection: {
    marginBottom: 24,
  },
  imagePicker: {
    height: 200,
    borderWidth: 2,
    borderColor: Colors.neutral[300],
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.neutral[100],
  },
  imagePickerText: {
    marginTop: 8,
    fontSize: 16,
    color: Colors.neutral[600],
  },
  imagePreviewContainer: {
    position: 'relative',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {},
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 0.48,
  },
  selectContainer: {
    marginBottom: 16,
  },
  selectLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: Colors.neutral[800],
    fontWeight: '500',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  optionButton: {
    backgroundColor: Colors.neutral[200],
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    margin: 4,
  },
  optionButtonSelected: {
    backgroundColor: Colors.primary.DEFAULT,
  },
  optionText: {
    color: Colors.neutral[700],
    fontWeight: '500',
  },
  optionTextSelected: {
    color: Colors.neutral.white,
  },
  submitButton: {
    marginTop: 16,
  },
});