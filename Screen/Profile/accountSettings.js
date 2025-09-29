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
  View,
  ProgressBarAndroid,
  Dimensions
} from 'react-native';
import { Colors } from '../../src/Components/Colors';
import { NotificationService } from '../../src/Components/NotificationService';
import { GlobalStyles } from '../../src/Components/Styles';
import { useAuth } from '../../src/Context/AuthContext';
import { userAPI } from '../../src/Services/conexion';

export default function AccountSettings({ navigation }) {
  const { user, login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Form fields
  const [name, setName] = useState(user?.name || '');
  const [surname, setSurname] = useState(user?.surname || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');

  // Profile completeness
  const [profileCompleteness, setProfileCompleteness] = useState(0);


  // Track original values for change detection
  const [originalValues, setOriginalValues] = useState({
    name: user?.name || '',
    surname: user?.surname || '',
    email: user?.email || ''
  });

  useEffect(() => {
    // Check if there are changes
    const currentValues = { name, surname, email };
    const changed = JSON.stringify(currentValues) !== JSON.stringify(originalValues) ||
                   (user?.role === 'admin' && (password || passwordConfirmation));
    setHasChanges(changed);
  }, [name, surname, email, password, passwordConfirmation, originalValues, user?.role]);

  useEffect(() => {
    // Calculate profile completeness
    let completeness = 0;
    if (name.trim()) completeness += 25;
    if (surname.trim()) completeness += 25;
    if (email.trim()) completeness += 25;
    if (user?.specialty || user?.role !== 'doctor') completeness += 25; // Specialty for doctors, or full for others
    setProfileCompleteness(completeness);
  }, [name, surname, email, user]);


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

    if (user?.role === 'admin' && password) {
      if (password.length < 6) {
        NotificationService.showError('Error', 'La contraseña debe tener al menos 6 caracteres');
        return false;
      }

      if (password !== passwordConfirmation) {
        NotificationService.showError('Error', 'Las contraseñas no coinciden');
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const updateData = {
        name: name.trim(),
        surname: surname.trim(),
        email: email.trim()
      };

      if (user?.role === 'admin' && password) {
        updateData.password = password;
        updateData.password_confirmation = passwordConfirmation;
        updateData.current_password = currentPassword;
      }

      const response = await userAPI.updateProfile(updateData);

      if (response.data.success) {
        // Update auth context with new user data
        const updatedUser = response.data.data;
        await login(updatedUser, null); // Keep existing token

        // Update original values
        setOriginalValues({
          name: updatedUser.name,
          surname: updatedUser.surname,
          email: updatedUser.email
        });

        // Clear password fields
        setCurrentPassword('');
        setPassword('');
        setPasswordConfirmation('');

        NotificationService.showSuccess('¡Éxito!', 'Los cambios han sido guardados correctamente');
        navigation.goBack();
      } else {
        NotificationService.showError('Error', response.data.message || 'No se pudieron guardar los cambios');
      }
    } catch (error) {
      console.log('Update profile error:', error.response?.data || error.message);
      const errores = error.response?.data?.errors;
      if (errores) {
        const mensajes = Object.values(errores).flat().join("\n");
        NotificationService.showError('Error de validación', mensajes);
      } else {
        const message = error.response?.data?.message || "No se pudieron guardar los cambios. Verifique los datos.";
        NotificationService.showError('Error', message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleText = (role) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'doctor': return 'Doctor';
      case 'patient': return 'Paciente';
      default: return role;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return Colors.error;
      case 'doctor': return Colors.success;
      case 'patient': return Colors.primary;
      default: return Colors.textSecondary;
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
            <Ionicons name="settings" size={50} color={Colors.primary} style={{ marginBottom: 16 }} />
            <Text style={[GlobalStyles.title, { marginBottom: 8 }]}>
              ¡Bienvenido, {user?.name}!
            </Text>
            <View style={{
              backgroundColor: getRoleColor(user?.role),
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              marginBottom: 8
            }}>
              <Text style={[GlobalStyles.textSmall, { color: 'white', fontWeight: '600' }]}>
                {getRoleText(user?.role)}
              </Text>
            </View>
            <Text style={[GlobalStyles.text, { textAlign: 'center', color: Colors.textSecondary }]}>
              Configuración de cuenta - Edita tu información personal
            </Text>
          </View>
        </View>

        {/* Profile Completeness */}
        <View style={GlobalStyles.card}>
          <Text style={[GlobalStyles.subtitle, { marginBottom: 16 }]}>
            Estado del perfil
          </Text>

          <View style={[GlobalStyles.row, GlobalStyles.spaceBetween, { marginBottom: 8 }]}>
            <Text style={[GlobalStyles.text, { fontWeight: '600' }]}>
              Completitud del perfil
            </Text>
            <Text style={[GlobalStyles.textSmall, { color: Colors.textSecondary }]}>
              {profileCompleteness}%
            </Text>
          </View>
          <View style={{
            height: 8,
            backgroundColor: Colors.backgroundLight,
            borderRadius: 4,
            overflow: 'hidden',
            marginBottom: 16
          }}>
            <View style={{
              height: '100%',
              width: `${profileCompleteness}%`,
              backgroundColor: profileCompleteness === 100 ? Colors.success : Colors.primary,
              borderRadius: 4
            }} />
          </View>
        </View>

        {/* Editable Fields */}
        <View style={GlobalStyles.card}>
          <Text style={[GlobalStyles.subtitle, { marginBottom: 16 }]}>
            Información personal
          </Text>

          {/* Name */}
          <View style={{ marginBottom: 16 }}>
            <Text style={[GlobalStyles.textSmall, { marginBottom: 8, fontWeight: '600' }]}>
              Nombre
            </Text>
            <TextInput
              placeholder="Tu nombre"
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
              placeholder="Tu apellido"
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
              placeholder="tu@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={GlobalStyles.input}
              placeholderTextColor={Colors.textLight}
            />
          </View>

          {/* Admin Password Fields */}
          {user?.role === 'admin' && (
            <>
              <Text style={[GlobalStyles.subtitle, { marginTop: 24, marginBottom: 16 }]}>
                Cambiar contraseña
              </Text>

              {/* Current Password */}
              <View style={{ marginBottom: 16 }}>
                <Text style={[GlobalStyles.textSmall, { marginBottom: 8, fontWeight: '600' }]}>
                  Contraseña actual
                </Text>
                <TextInput
                  placeholder="Ingresa tu contraseña actual"
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry
                  style={GlobalStyles.input}
                  placeholderTextColor={Colors.textLight}
                />
              </View>

              {/* New Password */}
              <View style={{ marginBottom: 16 }}>
                <Text style={[GlobalStyles.textSmall, { marginBottom: 8, fontWeight: '600' }]}>
                  Nueva contraseña
                </Text>
                <TextInput
                  placeholder="Mínimo 6 caracteres"
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
                  Confirmar nueva contraseña
                </Text>
                <TextInput
                  placeholder="Repite la nueva contraseña"
                  value={passwordConfirmation}
                  onChangeText={setPasswordConfirmation}
                  secureTextEntry
                  style={GlobalStyles.input}
                  placeholderTextColor={Colors.textLight}
                />
              </View>
            </>
          )}
        </View>

        {/* Read-only Information */}
        <View style={GlobalStyles.card}>
          <Text style={[GlobalStyles.subtitle, { marginBottom: 16 }]}>
            Información de cuenta
          </Text>

          {/* Role - Prominent Display */}
          <View style={[GlobalStyles.center, { marginBottom: 20 }]}>
            <Text style={[GlobalStyles.textSmall, { color: Colors.textSecondary, marginBottom: 8 }]}>
              Tu rol actual
            </Text>
            <View style={{
              backgroundColor: getRoleColor(user?.role),
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderRadius: 25,
              flexDirection: 'row',
              alignItems: 'center'
            }}>
              <Ionicons
                name={user?.role === 'doctor' ? 'medical' : user?.role === 'admin' ? 'shield' : 'person'}
                size={20}
                color="white"
                style={{ marginRight: 8 }}
              />
              <Text style={[GlobalStyles.text, { color: 'white', fontWeight: '600' }]}>
                {getRoleText(user?.role)}
              </Text>
            </View>
          </View>

          {/* Specialty for Doctors */}
          {user?.role === 'doctor' && user?.specialty && (
            <View style={[GlobalStyles.row, { alignItems: 'center', marginBottom: 16 }]}>
              <View style={[GlobalStyles.backgroundPastelBlue, {
                width: 40,
                height: 40,
                borderRadius: 20,
                ...GlobalStyles.center,
                marginRight: 16
              }]}>
                <Ionicons name="medical" size={20} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[GlobalStyles.textSmall, { color: Colors.textSecondary }]}>
                  Especialidad médica
                </Text>
                <Text style={[GlobalStyles.text, { fontWeight: '600' }]}>
                  {user.specialty.name}
                </Text>
              </View>
            </View>
          )}

          {/* Member Since */}
          <View style={[GlobalStyles.row, { alignItems: 'center' }]}>
            <View style={[GlobalStyles.backgroundPastelGreen, {
              width: 40,
              height: 40,
              borderRadius: 20,
              ...GlobalStyles.center,
              marginRight: 16
            }]}>
              <Ionicons name="calendar" size={20} color={Colors.success} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[GlobalStyles.textSmall, { color: Colors.textSecondary }]}>
                Miembro desde
              </Text>
              <Text style={[GlobalStyles.text, { fontWeight: '600' }]}>
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('es-ES') : 'N/A'}
              </Text>
            </View>
          </View>
        </View>


        {/* Admin: User Management */}
        {user?.role === 'admin' && (
          <View style={GlobalStyles.card}>
            <Text style={[GlobalStyles.subtitle, { marginBottom: 16 }]}>
              Gestión de usuarios
            </Text>

            <TouchableOpacity
              style={[GlobalStyles.buttonPrimary, { marginBottom: 12 }]}
              onPress={() => navigation.navigate('CreateDoctor')}
            >
              <View style={[GlobalStyles.row, GlobalStyles.center]}>
                <Ionicons name="medical" size={20} color={Colors.backgroundCard} style={{ marginRight: 8 }} />
                <Text style={GlobalStyles.buttonText}>
                  Crear nuevo doctor
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[GlobalStyles.buttonSecondary, { marginBottom: 16 }]}
              onPress={() => navigation.navigate('CreateAdmin')}
            >
              <View style={[GlobalStyles.row, GlobalStyles.center]}>
                <Ionicons name="shield" size={20} color={Colors.textSecondary} style={{ marginRight: 8 }} />
                <Text style={[GlobalStyles.buttonTextSecondary]}>
                  Crear nuevo administrador
                </Text>
              </View>
            </TouchableOpacity>

            <Text style={[GlobalStyles.textSmall, { color: Colors.textSecondary, textAlign: 'center' }]}>
              Como administrador, puedes crear cuentas de doctores y otros administradores
            </Text>
          </View>
        )}

        {/* Tips */}
        <View style={[GlobalStyles.card, GlobalStyles.backgroundPastelYellow]}>
          <View style={[GlobalStyles.row, { alignItems: 'flex-start' }]}>
            <Ionicons name="bulb" size={24} color={Colors.warning} style={{ marginRight: 12, marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={[GlobalStyles.text, { fontWeight: '600', marginBottom: 8 }]}>
                Tips para tu cuenta
              </Text>
              <Text style={[GlobalStyles.textSmall, { color: Colors.textSecondary, lineHeight: 20 }]}>
                • Mantén tu correo actualizado para recibir notificaciones importantes{'\n'}
                • Usa una contraseña segura si eres administrador{'\n'}
                • Revisa regularmente tu información personal
              </Text>
            </View>
          </View>
        </View>

        {/* Save Button */}
        <View style={GlobalStyles.card}>
          <TouchableOpacity
            style={[
              GlobalStyles.buttonPrimary,
              { opacity: hasChanges && !isLoading ? 1 : 0.5 }
            ]}
            onPress={handleSave}
            disabled={!hasChanges || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.backgroundCard} />
            ) : (
              <Text style={GlobalStyles.buttonText}>
                Guardar cambios
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}