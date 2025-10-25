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
  // Estados para almacenar los datos del formulario
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password_confirmation, setPasswordConfirmation] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Controla el indicador de carga
  const [showPassword, setShowPassword] = useState(false); // Alterna visibilidad de contraseña
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // Alterna visibilidad de confirmación
  const { login } = useAuth(); // Función para guardar sesión del usuario

  const validateForm = () => {
    if (!name || !surname || !email || !password || !password_confirmation) {
      NotificationService.showError('Error', 'Por favor completa todos los campos');
      return false;
    }

    if (password !== password_confirmation) {
      NotificationService.showError('Error', 'Las contraseñas no coinciden');
      return false;
    }

    // Revisa longitud mínima de la contraseña
    if (password.length < 6) {
      NotificationService.showError('Error', 'La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    return true;
  };

  // Función para registrar un nuevo usuario
  const handleRegister = async () => {
    if (!validateForm()) return; // Si falla la validación, se detiene

    setIsLoading(true); // Muestra el indicador de carga
    try {
      // Llama al endpoint de registro en el backend
      const response = await authAPI.register(
        name,
        surname,
        email,
        password,
        password_confirmation,
        'patient', // Solo se permite registrar pacientes
        null // Sin especialidad (solo aplica a doctores)
      );

      // Si el backend responde con éxito
      if (response.data.success) {
        await login(response.data.usuario, response.data.token); // Guarda usuario y token
        NotificationService.showSuccess('¡Registro exitoso!', 'Tu cuenta ha sido creada correctamente');
      } else {
        // Si el backend responde con error lógico
        NotificationService.showError('Error', response.data.message || 'No se pudo completar el registro');
      }
    } catch (error) {
      // Captura errores del servidor o de red
      console.log("Error en el registro:", error.response?.data || error.message);

      const errores = error.response?.data?.errors;
      if (errores) {
        // Si hay errores de validación, los muestra todos
        const mensajes = Object.values(errores).flat().join("\n");
        NotificationService.showError('Error de validación', mensajes);
      } else {
        // Si hay un error general del servidor
        const message = error.response?.data?.message || "No se pudo completar el registro. Verifique los datos.";
        NotificationService.showError('Error', message);
      }
    } finally {
      setIsLoading(false); // Quita el indicador de carga
    }
  };

  return (
    // Evita que el teclado cubra los campos en iOS y Android
    <KeyboardAvoidingView 
      style={GlobalStyles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Scroll permite moverse si hay muchos campos o el teclado aparece */}
      <ScrollView 
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Contenedor del formulario */}
        <View style={[GlobalStyles.card, { width: '100%', maxWidth: 400, alignSelf: 'center' }]}>

          {/* Logo o ícono superior */}
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

          {/* Título y descripción del formulario */}
          <Text style={GlobalStyles.title}>Crear Cuenta</Text>
          <Text style={[GlobalStyles.text, { textAlign: 'center', marginBottom: 30 }]}>
            Únete a nuestra plataforma de citas médicas
          </Text>

          {/* Inputs: Nombre y Apellido lado a lado */}
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

          {/* Input: Correo electrónico */}
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

          {/* Input: Contraseña */}
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
              {/* Botón para mostrar/ocultar contraseña */}
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

          {/* Input: Confirmar contraseña */}
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
              {/* Botón para mostrar/ocultar confirmación */}
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

          {/* Botón para crear cuenta */}
          <TouchableOpacity
            style={[GlobalStyles.buttonPrimary, { opacity: isLoading ? 0.7 : 1 }]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.backgroundCard} /> // Muestra spinner de carga
            ) : (
              <Text style={GlobalStyles.buttonText}>Crear Cuenta</Text>
            )}
          </TouchableOpacity>

          {/* Enlace para ir al login si ya tiene cuenta */}
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
