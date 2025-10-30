import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
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
import { userAPI } from '../../src/Services/conexion';
import { useAuth } from '../../src/Context/AuthContext';


// Componente principal para crear administradores
export default function CreateAdmin({ navigation }) {
  const { isAdmin } = useAuth();

  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password_confirmation, setPasswordConfirmation] = useState('');

  // Estado para manejar el indicador de carga
  const [isLoading, setIsLoading] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false); // Estado para acceso denegado

  // useEffect para verificar permisos
  useEffect(() => {
    if (!isAdmin()) {
      setAccessDenied(true);
      NotificationService.showError('Acceso denegado', 'No tienes permisos para crear administradores.');
    }
  }, []);

  const validateForm = () => {

    // Valida que nombre y apellido no estén vacíos
    if (!name.trim() || !surname.trim()) {
      NotificationService.showError('Error', 'Nombre y apellido son obligatorios');
      return false;
    }

    // Valida que el email no esté vacío
    if (!email.trim()) {
      NotificationService.showError('Error', 'El correo electrónico es obligatorio');
      return false;
    }

    // Valida el formato correcto del correo electrónico con una expresión regular
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      NotificationService.showError('Error', 'El formato del correo electrónico no es válido');
      return false;
    }

    // Valida que la contraseña no esté vacía
    if (!password) {
      NotificationService.showError('Error', 'La contraseña es obligatoria');
      return false;
    }

    // Valida longitud mínima de la contraseña
    if (password.length < 6) {
      NotificationService.showError('Error', 'La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    // Valida que ambas contraseñas coincidan
    if (password !== password_confirmation) {
      NotificationService.showError('Error', 'Las contraseñas no coinciden');
      return false;
    }

    return true;
  };

  // FUNCIÓN PARA CREAR ADMINISTRADOR 
  const handleCreateAdmin = async () => {

    // Si el formulario no pasa la validación, se detiene
    if (!validateForm()) return;

    // Activa el indicador de carga
    setIsLoading(true);

    try {
      // Envía los datos al backend usando la API de usuario
      const response = await userAPI.createUser({
        name: name.trim(),
        surname: surname.trim(),
        email: email.trim(),
        password: password,
        password_confirmation: password_confirmation,
        role: 'admin', // Rol específico
        specialty_id: null // Los administradores no tienen especialidad
      });

      // Si la respuesta indica éxito, muestra notificación y regresa a la pantalla anterior
      if (response.data.success) {
        NotificationService.showSuccess('¡Éxito!', 'El administrador ha sido creado correctamente');
        navigation.goBack();
      } else {
        // Si no fue exitoso, muestra un mensaje de error
        NotificationService.showError('Error', response.data.message || 'No se pudo crear el administrador');
      }

    } catch (error) {
      // Captura errores del servidor o conexión
      console.log('Create admin error:', error.response?.data || error.message);

      // Si hay errores de validación, los muestra en pantalla
      const errores = error.response?.data?.errors;
      if (errores) {
        const mensajes = Object.values(errores).flat().join("\n");
        NotificationService.showError('Error de validación', mensajes);
      } else {
        // Si es otro tipo de error, muestra mensaje genérico
        const message = error.response?.data?.message || "No se pudo crear el administrador. Verifique los datos.";
        NotificationService.showError('Error', message);
      }

    } finally {
      // Desactiva el indicador de carga
      setIsLoading(false);
    }
  };

  // --- INTERFAZ DE USUARIO ---
  if (accessDenied) {
    return (
      <View style={[GlobalStyles.container, GlobalStyles.center]}>
        <Ionicons name="shield-outline" size={64} color={Colors.error} />
        <Text style={[GlobalStyles.text, { color: Colors.error, marginTop: 16, textAlign: 'center' }]}>
          Acceso denegado
        </Text>
        <Text style={[GlobalStyles.textSmall, { color: Colors.textSecondary, textAlign: 'center' }]}>
          No tienes permisos para crear administradores.
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={GlobalStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>

        {/* ENCABEZADO DE LA PANTALLA */}
        <View style={[GlobalStyles.card, GlobalStyles.backgroundPastelBlue]}>
          <View style={[GlobalStyles.center]}>
            <Ionicons name="shield" size={50} color={Colors.primary} style={{ marginBottom: 16 }} />
            <Text style={[GlobalStyles.title, { marginBottom: 8 }]}>
              Crear Administrador
            </Text>
            <Text style={[GlobalStyles.text, { textAlign: 'center', color: Colors.textSecondary }]}>
              Registra un nuevo administrador en el sistema
            </Text>
          </View>
        </View>

        {/* FORMULARIO DE REGISTRO */}
        <View style={GlobalStyles.card}>
          <Text style={[GlobalStyles.subtitle, { marginBottom: 16 }]}>
            Información del administrador
          </Text>

          {/* CAMPO: Nombre */}
          <View style={{ marginBottom: 16 }}>
            <Text style={[GlobalStyles.textSmall, { marginBottom: 8, fontWeight: '600' }]}>
              Nombre
            </Text>
            <TextInput
              placeholder="Nombre del administrador"
              value={name}
              onChangeText={setName}
              style={GlobalStyles.input}
              placeholderTextColor={Colors.textLight}
            />
          </View>

          {/* CAMPO: Apellido */}
          <View style={{ marginBottom: 16 }}>
            <Text style={[GlobalStyles.textSmall, { marginBottom: 8, fontWeight: '600' }]}>
              Apellido
            </Text>
            <TextInput
              placeholder="Apellido del administrador"
              value={surname}
              onChangeText={setSurname}
              style={GlobalStyles.input}
              placeholderTextColor={Colors.textLight}
            />
          </View>

          {/* CAMPO: Correo electrónico */}
          <View style={{ marginBottom: 16 }}>
            <Text style={[GlobalStyles.textSmall, { marginBottom: 8, fontWeight: '600' }]}>
              Correo electrónico
            </Text>
            <TextInput
              placeholder="admin@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={GlobalStyles.input}
              placeholderTextColor={Colors.textLight}
            />
          </View>

          {/* CAMPO: Contraseña */}
          <View style={{ marginBottom: 16 }}>
            <Text style={[GlobalStyles.textSmall, { marginBottom: 8, fontWeight: '600' }]}>
              Contraseña
            </Text>
            <TextInput
              placeholder="Contraseña (mínimo 6 caracteres)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={GlobalStyles.input}
              placeholderTextColor={Colors.textLight}
            />
          </View>

          {/* CAMPO: Confirmar contraseña */}
          <View style={{ marginBottom: 16 }}>
            <Text style={[GlobalStyles.textSmall, { marginBottom: 8, fontWeight: '600' }]}>
              Confirmar contraseña
            </Text>
            <TextInput
              placeholder="Repetir contraseña"
              value={password_confirmation}
              onChangeText={setPasswordConfirmation}
              secureTextEntry
              style={GlobalStyles.input}
              placeholderTextColor={Colors.textLight}
            />
          </View>
        </View>

        {/* BOTÓN PARA CREAR ADMINISTRADOR */}
        <View style={GlobalStyles.card}>
          <TouchableOpacity
            style={[
              GlobalStyles.buttonPrimary,
              { opacity: isLoading ? 0.7 : 1 } // Disminuye opacidad si está cargando
            ]}
            onPress={handleCreateAdmin}
            disabled={isLoading} // Desactiva el botón mientras se envía el formulario
          >
            {isLoading ? (
              // Muestra un spinner de carga si está procesando
              <ActivityIndicator color={Colors.backgroundCard} />
            ) : (
              // Muestra el texto e ícono del botón normalmente
              <View style={[GlobalStyles.row, GlobalStyles.center]}>
                <Ionicons name="add" size={20} color={Colors.backgroundCard} style={{ marginRight: 8 }} />
                <Text style={GlobalStyles.buttonText}>
                  Crear Administrador
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
