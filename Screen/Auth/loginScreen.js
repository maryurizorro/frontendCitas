import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { Colors } from '../../src/Components/Colors';
import { NotificationService } from '../../src/Components/NotificationService';
import { GlobalStyles } from '../../src/Components/Styles';
import { useAuth } from '../../src/Context/AuthContext';
import { authAPI } from '../../src/Services/conexion';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      NotificationService.showError('Error', 'Por favor completa todos los campos');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authAPI.login(email, password);
      
      if (response.data.success) {
        await login(response.data.usuario, response.data.token);
        NotificationService.showSuccess('¡Bienvenido!', 'Inicio de sesión exitoso');
      } else {
        NotificationService.showError('Error', 'Credenciales incorrectas');
      }
    } catch (error) {
      console.log('Login error:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || 'Error al iniciar sesión';
      NotificationService.showError('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={GlobalStyles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={GlobalStyles.containerCentered}
        showsVerticalScrollIndicator={false}
      >
        <View style={[GlobalStyles.card, { width: '100%', maxWidth: 400 }]}>
          {/* Logo/Icono */}
          <View style={[GlobalStyles.center, { marginBottom: 30 }]}>
            <View style={[GlobalStyles.backgroundPastelPurple, { 
              width: 80, 
              height: 80, 
              borderRadius: 40, 
              ...GlobalStyles.center 
            }]}>
              <Ionicons name="medical" size={40} color={Colors.primary} />
            </View>
          </View>

          <Text style={GlobalStyles.title}>Iniciar Sesión</Text>
          <Text style={[GlobalStyles.text, { textAlign: 'center', marginBottom: 30 }]}>
            Accede a tu cuenta para gestionar tus citas médicas
          </Text>

          {/* Email Input */}
          <View style={{ marginBottom: 16 }}>
            <Text style={[GlobalStyles.textSmall, { marginBottom: 8, fontWeight: '600' }]}>
              Correo electrónico
            </Text>
            <View style={{ position: 'relative' }}>
              <TextInput
                placeholder="tu@email.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                style={GlobalStyles.input}
                placeholderTextColor={Colors.textLight}
              />
              <Ionicons 
                name="mail-outline" 
                size={20} 
                color={Colors.textLight} 
                style={{ position: 'absolute', right: 16, top: 16 }}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={{ marginBottom: 24 }}>
            <Text style={[GlobalStyles.textSmall, { marginBottom: 8, fontWeight: '600' }]}>
              Contraseña
            </Text>
            <View style={{ position: 'relative' }}>
              <TextInput
                placeholder="Tu contraseña"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                style={GlobalStyles.input}
                placeholderTextColor={Colors.textLight}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 16, top: 16 }}
              >
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color={Colors.textLight} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[GlobalStyles.buttonPrimary, { opacity: isLoading ? 0.7 : 1 }]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.backgroundCard} />
            ) : (
              <Text style={GlobalStyles.buttonText}>Iniciar Sesión</Text>
            )}
          </TouchableOpacity>


          {/* Register Link */}
          <View style={[GlobalStyles.center, { marginTop: 12 }]}>
            <Text style={GlobalStyles.textSmall}>
              ¿No tienes una cuenta?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={[GlobalStyles.textSmall, { color: Colors.primary, fontWeight: '600' }]}>
                Regístrate aquí
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
