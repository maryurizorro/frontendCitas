import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
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
import { authAPI, specialtyAPI } from '../../src/Services/conexion';

export default function RegistrarScreen({ navigation }) {
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password_confirmation, setPasswordConfirmation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { login } = useAuth();

  const validateForm = () => {
    if (!name || !surname || !email || !password || !password_confirmation) {
      NotificationService.showError('Error', 'Por favor completa todos los campos');
      return false;
    }

    if (password !== password_confirmation) {
      NotificationService.showError('Error', 'Las contraseñas no coinciden');
      return false;
    }

    if (password.length < 6) {
      NotificationService.showError('Error', 'La contraseña debe tener al menos 6 caracteres');
      return false;
    }


    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await authAPI.register(
        name,
        surname,
        email,
        password,
        password_confirmation,
        'patient', // Only patients can register
        null // No specialty for patients
      );

      if (response.data.success) {
        await login(response.data.usuario, response.data.token);
        NotificationService.showSuccess('¡Registro exitoso!', 'Tu cuenta ha sido creada correctamente');
      } else {
        NotificationService.showError('Error', response.data.message || 'No se pudo completar el registro');
      }
    } catch (error) {
      console.log("Error en el registro:", error.response?.data || error.message);

      const errores = error.response?.data?.errors;
      if (errores) {
        const mensajes = Object.values(errores).flat().join("\n");
        NotificationService.showError('Error de validación', mensajes);
      } else {
        const message = error.response?.data?.message || "No se pudo completar el registro. Verifique los datos.";
        NotificationService.showError('Error', message);
      }
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
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[GlobalStyles.card, { width: '100%', maxWidth: 400, alignSelf: 'center' }]}>
          {/* Logo/Icono */}
          <View style={[GlobalStyles.center, { marginBottom: 20 }]}>
            <View style={[GlobalStyles.backgroundPastelPink, { 
              width: 60, 
              height: 60, 
              borderRadius: 30, 
              ...GlobalStyles.center 
            }]}>
              <Ionicons name="person-add" size={30} color={Colors.secondary} />
            </View>
          </View>

          <Text style={GlobalStyles.title}>Crear Cuenta</Text>
          <Text style={[GlobalStyles.text, { textAlign: 'center', marginBottom: 30 }]}>
            Únete a nuestra plataforma de citas médicas
          </Text>

          {/* Nombre y Apellido en fila */}
          <View style={[GlobalStyles.row, { marginBottom: 16 }]}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={[GlobalStyles.textSmall, { marginBottom: 8, fontWeight: '600' }]}>
                Nombre
              </Text>
              <TextInput
                placeholder="Nombre"
                value={name}
                onChangeText={setName}
                style={GlobalStyles.input}
                placeholderTextColor={Colors.textLight}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={[GlobalStyles.textSmall, { marginBottom: 8, fontWeight: '600' }]}>
                Apellido
              </Text>
              <TextInput
                placeholder="Apellido"
                value={surname}
                onChangeText={setSurname}
                style={GlobalStyles.input}
                placeholderTextColor={Colors.textLight}
              />
            </View>
          </View>

          {/* Email */}
          <View style={{ marginBottom: 16 }}>
            <Text style={[GlobalStyles.textSmall, { marginBottom: 8, fontWeight: '600' }]}>
              Correo electrónico
            </Text>
            <TextInput
              placeholder="tu@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={GlobalStyles.input}
              placeholderTextColor={Colors.textLight}
            />
          </View>

          {/* Contraseña */}
          <View style={{ marginBottom: 16 }}>
            <Text style={[GlobalStyles.textSmall, { marginBottom: 8, fontWeight: '600' }]}>
              Contraseña
            </Text>
            <View style={{ position: 'relative' }}>
              <TextInput
                placeholder="Mínimo 6 caracteres"
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

          {/* Confirmar Contraseña */}
          <View style={{ marginBottom: 16 }}>
            <Text style={[GlobalStyles.textSmall, { marginBottom: 8, fontWeight: '600' }]}>
              Confirmar contraseña
            </Text>
            <View style={{ position: 'relative' }}>
              <TextInput
                placeholder="Repite tu contraseña"
                value={password_confirmation}
                onChangeText={setPasswordConfirmation}
                secureTextEntry={!showConfirmPassword}
                style={GlobalStyles.input}
                placeholderTextColor={Colors.textLight}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{ position: 'absolute', right: 16, top: 16 }}
              >
                <Ionicons 
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color={Colors.textLight} 
                />
              </TouchableOpacity>
            </View>
          </View>


          {/* Register Button */}
          <TouchableOpacity
            style={[GlobalStyles.buttonPrimary, { opacity: isLoading ? 0.7 : 1 }]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.backgroundCard} />
            ) : (
              <Text style={GlobalStyles.buttonText}>Crear Cuenta</Text>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <View style={[GlobalStyles.center, { marginTop: 20 }]}>
            <Text style={GlobalStyles.textSmall}>
              ¿Ya tienes una cuenta?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={[GlobalStyles.textSmall, { color: Colors.primary, fontWeight: '600' }]}>
                Inicia sesión aquí
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
