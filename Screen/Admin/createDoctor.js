import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
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
import { userAPI, specialtyAPI } from '../../src/Services/conexion';
import { useAuth } from '../../src/Context/AuthContext';

// Componente principal para crear un nuevo doctor
export default function CreateDoctor({ navigation }) {
  const { isAdmin } = useAuth();

  // Estados del formulario
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password_confirmation, setPasswordConfirmation] = useState('');
  const [specialty_id, setSpecialtyId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [specialties, setSpecialties] = useState([]);
  const [loadingSpecialties, setLoadingSpecialties] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false); // Estado para acceso denegado

  // useEffect para verificar permisos y cargar especialidades
  useEffect(() => {
    if (!isAdmin()) {
      setAccessDenied(true);
      NotificationService.showError('Acceso denegado', 'No tienes permisos para crear doctores.');
      return;
    }
    loadSpecialties();
  }, []);

  // Función para obtener las especialidades desde el backend
  const loadSpecialties = async () => {
    try {
      const response = await specialtyAPI.getSpecialties(); // Llamada a la API
      if (response.data.success) {
        setSpecialties(response.data.data); // Guarda las especialidades
      }
    } catch (error) {
      console.log('Error loading specialties:', error); // Muestra error en consola
    } finally {
      setLoadingSpecialties(false); // Quita el estado de carga
    }
  };

  // Función para validar el formulario
  const validateForm = () => {
    // Valida campos vacíos
    if (!name.trim() || !surname.trim()) {
      NotificationService.showError('Error', 'Nombre y apellido son obligatorios');
      return false;
    }

    // Valida correo electrónico
    if (!email.trim()) {
      NotificationService.showError('Error', 'El correo electrónico es obligatorio');
      return false;
    }

    // Verifica formato del correo electrónico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      NotificationService.showError('Error', 'El formato del correo electrónico no es válido');
      return false;
    }

    // Verifica que la contraseña no esté vacía
    if (!password) {
      NotificationService.showError('Error', 'La contraseña es obligatoria');
      return false;
    }

    // Verifica longitud mínima de la contraseña
    if (password.length < 6) {
      NotificationService.showError('Error', 'La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    // Verifica que las contraseñas coincidan
    if (password !== password_confirmation) {
      NotificationService.showError('Error', 'Las contraseñas no coinciden');
      return false;
    }

    // Verifica que haya seleccionado una especialidad
    if (!specialty_id) {
      NotificationService.showError('Error', 'Debe seleccionar una especialidad');
      return false;
    }

    return true; 
  };

  // Función para manejar la creación del doctor
  const handleCreateDoctor = async () => {
    if (!validateForm()) return; // Si la validación falla, detiene el proceso

    setIsLoading(true); // Activa el indicador de carga
    try {
      // Llamada a la API para crear usuario con rol doctor
      const response = await userAPI.createUser({
        name: name.trim(),
        surname: surname.trim(),
        email: email.trim(),
        password: password,
        password_confirmation: password_confirmation,
        role: 'doctor',
        specialty_id: specialty_id
      });

      // Si la creación fue exitosa
      if (response.data.success) {
        NotificationService.showSuccess('¡Éxito!', 'El doctor ha sido creado correctamente');
        navigation.goBack(); // Vuelve a la pantalla anterior
      } else {
        NotificationService.showError('Error', response.data.message || 'No se pudo crear el doctor');
      }
    } catch (error) {
      // Manejo de errores
      console.log('Create doctor error:', error.response?.data || error.message);
      const errores = error.response?.data?.errors;
      if (errores) {
        const mensajes = Object.values(errores).flat().join("\n");
        NotificationService.showError('Error de validación', mensajes);
      } else {
        const message = error.response?.data?.message || "No se pudo crear el doctor. Verifique los datos.";
        NotificationService.showError('Error', message);
      }
    } finally {
      setIsLoading(false); // Desactiva el indicador de carga
    }
  };

  // Render del componente
  if (accessDenied) {
    return (
      <View style={[GlobalStyles.container, GlobalStyles.center]}>
        <Ionicons name="shield-outline" size={64} color={Colors.error} />
        <Text style={[GlobalStyles.text, { color: Colors.error, marginTop: 16, textAlign: 'center' }]}>
          Acceso denegado
        </Text>
        <Text style={[GlobalStyles.textSmall, { color: Colors.textSecondary, textAlign: 'center' }]}>
          No tienes permisos para crear doctores.
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
        {/* Encabezado */}
        <View style={[GlobalStyles.card, GlobalStyles.backgroundPastelBlue]}>
          <View style={[GlobalStyles.center]}>
            <Ionicons name="medical" size={50} color={Colors.primary} style={{ marginBottom: 16 }} />
            <Text style={[GlobalStyles.title, { marginBottom: 8 }]}>
              Crear Doctor
            </Text>
            <Text style={[GlobalStyles.text, { textAlign: 'center', color: Colors.textSecondary }]}>
              Registra un nuevo médico en el sistema
            </Text>
          </View>
        </View>

        {/* Formulario */}
        <View style={GlobalStyles.card}>
          <Text style={[GlobalStyles.subtitle, { marginBottom: 16 }]}>
            Información del doctor
          </Text>

          {/* Campo: Nombre */}
          <View style={{ marginBottom: 16 }}>
            <Text style={[GlobalStyles.textSmall, { marginBottom: 8, fontWeight: '600' }]}>
              Nombre
            </Text>
            <TextInput
              placeholder="Nombre del doctor"
              value={name}
              onChangeText={setName}
              style={GlobalStyles.input}
              placeholderTextColor={Colors.textLight}
            />
          </View>

          {/* Campo: Apellido */}
          <View style={{ marginBottom: 16 }}>
            <Text style={[GlobalStyles.textSmall, { marginBottom: 8, fontWeight: '600' }]}>
              Apellido
            </Text>
            <TextInput
              placeholder="Apellido del doctor"
              value={surname}
              onChangeText={setSurname}
              style={GlobalStyles.input}
              placeholderTextColor={Colors.textLight}
            />
          </View>

          {/* Campo: Correo electrónico */}
          <View style={{ marginBottom: 16 }}>
            <Text style={[GlobalStyles.textSmall, { marginBottom: 8, fontWeight: '600' }]}>
              Correo electrónico
            </Text>
            <TextInput
              placeholder="doctor@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={GlobalStyles.input}
              placeholderTextColor={Colors.textLight}
            />
          </View>

          {/* Campo: Contraseña */}
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

          {/* Campo: Confirmar contraseña */}
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

          {/* Campo: Especialidad médica */}
          {/* Selector de especialidad médica */}
                  <View style={{ marginBottom: 20 }} key="specialty-selector">
                    <Text style={[GlobalStyles.textSmall, { marginBottom: 8, fontWeight: '600' }]}>
                      Especialidad médica *
                    </Text>
                    <View style={[GlobalStyles.input, { paddingVertical: 0 }]}>
                      <Picker
                        selectedValue={specialty_id}
                        onValueChange={(itemValue) => setSpecialtyId(itemValue)}
                        style={{ height: 50, color: Colors.textPrimary }}
                        itemStyle={{ color: Colors.textPrimary }}
                      >
                        <Picker.Item label="Selecciona una especialidad" value="" />
                        {specialties.map((specialty) => (
                          <Picker.Item key={`specialty-${specialty.id}`} label={specialty.name} value={specialty.id} />
                        ))}
                      </Picker>
                    </View>
                  </View>
        </View>

        {/* Botón para crear doctor */}
        <View style={GlobalStyles.card}>
          <TouchableOpacity
            style={[
              GlobalStyles.buttonPrimary,
              { opacity: isLoading ? 0.7 : 1 } // Cambia opacidad si está cargando
            ]}
            onPress={handleCreateDoctor}
            disabled={isLoading} // Desactiva botón mientras se ejecuta la acción
          >
            {isLoading ? (
              // Indicador de carga
              <ActivityIndicator color={Colors.backgroundCard} />
            ) : (
              // Contenido del botón normal
              <View style={[GlobalStyles.row, GlobalStyles.center]}>
                <Ionicons name="add" size={20} color={Colors.backgroundCard} style={{ marginRight: 8 }} />
                <Text style={GlobalStyles.buttonText}>
                  Crear Doctor
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
