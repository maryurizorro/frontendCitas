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

export default function CreateDoctor({ navigation }) {
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password_confirmation, setPasswordConfirmation] = useState('');
  const [specialty_id, setSpecialtyId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [specialties, setSpecialties] = useState([]);
  const [loadingSpecialties, setLoadingSpecialties] = useState(true);

  useEffect(() => {
    loadSpecialties();
  }, []);

  const loadSpecialties = async () => {
    try {
      const response = await specialtyAPI.getSpecialties();
      if (response.data.success) {
        setSpecialties(response.data.data);
      }
    } catch (error) {
      console.log('Error loading specialties:', error);
    } finally {
      setLoadingSpecialties(false);
    }
  };

  const validateForm = () => {
    if (!name.trim() || !surname.trim()) {
      NotificationService.showError('Error', 'Nombre y apellido son obligatorios');
      return false;
    }

    if (!email.trim()) {
      NotificationService.showError('Error', 'El correo electrónico es obligatorio');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      NotificationService.showError('Error', 'El formato del correo electrónico no es válido');
      return false;
    }

    if (!password) {
      NotificationService.showError('Error', 'La contraseña es obligatoria');
      return false;
    }

    if (password.length < 6) {
      NotificationService.showError('Error', 'La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    if (password !== password_confirmation) {
      NotificationService.showError('Error', 'Las contraseñas no coinciden');
      return false;
    }

    if (!specialty_id) {
      NotificationService.showError('Error', 'Debe seleccionar una especialidad');
      return false;
    }

    return true;
  };

  const handleCreateDoctor = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await userAPI.createUser({
        name: name.trim(),
        surname: surname.trim(),
        email: email.trim(),
        password: password,
        password_confirmation: password_confirmation,
        role: 'doctor',
        specialty_id: specialty_id
      });

      if (response.data.success) {
        NotificationService.showSuccess('¡Éxito!', 'El doctor ha sido creado correctamente');
        navigation.goBack();
      } else {
        NotificationService.showError('Error', response.data.message || 'No se pudo crear el doctor');
      }
    } catch (error) {
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
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={GlobalStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Header */}
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

        {/* Form */}
        <View style={GlobalStyles.card}>
          <Text style={[GlobalStyles.subtitle, { marginBottom: 16 }]}>
            Información del doctor
          </Text>

          {/* Name */}
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

          {/* Surname */}
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

          {/* Email */}
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

          {/* Password */}
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

          {/* Confirm Password */}
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

          {/* Specialty */}
          <View style={{ marginBottom: 16 }}>
            <Text style={[GlobalStyles.textSmall, { marginBottom: 8, fontWeight: '600' }]}>
              Especialidad médica
            </Text>
            <View style={[GlobalStyles.input, { paddingVertical: 0 }]}>
              {loadingSpecialties ? (
                <View style={{ height: 50, justifyContent: 'center', alignItems: 'center' }}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                </View>
              ) : (
                <Picker
                  selectedValue={specialty_id}
                  onValueChange={setSpecialtyId}
                  style={{ height: 50 }}
                >
                  <Picker.Item label="Seleccionar especialidad" value="" />
                  {specialties.map((s) => (
                    <Picker.Item key={s.id} label={s.name} value={s.id.toString()} />
                  ))}
                </Picker>
              )}
            </View>
          </View>
        </View>

        {/* Create Button */}
        <View style={GlobalStyles.card}>
          <TouchableOpacity
            style={[
              GlobalStyles.buttonPrimary,
              { opacity: isLoading ? 0.7 : 1 }
            ]}
            onPress={handleCreateDoctor}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.backgroundCard} />
            ) : (
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