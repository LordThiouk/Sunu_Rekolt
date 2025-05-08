import React from 'react';
import { View, Text, Image, TouchableOpacity, SafeAreaView, StatusBar, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';

const WelcomeScreen = () => {
  const router = useRouter();
  
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" />
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
        
        <View style={{ 
          flex: 1, 
          padding: 24, 
          justifyContent: 'space-between',
          paddingTop: 40,
          paddingBottom: 30,
          position: 'relative', // Ensures content is above the overlay
        }}>
          {/* Top content: Title and subtitle */}
          <View style={{ alignItems: 'center' }}>
            <Text style={{ 
              fontSize: 28, 
              fontWeight: 'bold', 
              color: '#2a7d2a', 
              textAlign: 'center',
              fontFamily: 'BalooBhai2_400Regular'
            }}>
              Sunu Rekolt
            </Text>
            <Text style={{ 
              fontSize: 24, 
              fontFamily: 'BalooBhai2_400Regular',
              marginTop: 8, 
              color: '#2a7d2a', 
              textAlign: 'center' 
            }}>
              🌱
            </Text>
            <Text style={{ 
              fontSize: 16, 
              marginTop: 12, 
              color: '#4a4a4a', 
              textAlign: 'center',
              paddingHorizontal: 20,
              fontFamily: 'BalooBhai2_400Regular'
            }}>
              Connecter les agriculteurs et acheteurs au Sénégal
            </Text>
          </View>
          
          {/* Middle content: Illustration */}
          <View style={{ alignItems: 'center', marginVertical: 30 }}>
            <View style={{
              backgroundColor: '#FFF0E0',
              borderRadius: 12,
              padding: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            }}>
              <Image
                source={require('@/assets/images/farmer-illustration.png')}
                style={{ width: 280, height: 280, borderRadius: 8 }}
                resizeMode="cover"
              />
            </View>
          </View>
          
          {/* Bottom content: Buttons */}
          <View>
            <TouchableOpacity
              style={{
                backgroundColor: '#2a7d2a',
                paddingVertical: 16,
                borderRadius: 12,
                alignItems: 'center',
                marginBottom: 16,
                elevation: 2,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.2,
                shadowRadius: 2,
              }}
              onPress={() => router.push('/(auth)/register')}
            >
              <Text style={{ 
                color: 'white', 
                fontSize: 16, 
                fontWeight: '600',
                fontFamily: 'BalooBhai2_400Regular'
              }}>
                Créer un compte
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={{
                backgroundColor: 'white',
                paddingVertical: 16,
                borderRadius: 12,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#2a7d2a',
              }}
              onPress={() => router.push('/(auth)/login')}
            >
              <Text style={{ 
                color: '#2a7d2a', 
                fontSize: 16, 
                fontWeight: '600',
                fontFamily: 'BalooBhai2_400Regular'
              }}>
                Se connecter
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

export default WelcomeScreen; 