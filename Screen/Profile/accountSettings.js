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
import { userAPI, appointmentAPI } from '../../src/Services/conexion';

// Pantalla principal para configuración de la cuenta
export default function AccountSettings({ navigation }) {
  // Contexto de autenticación
  const { user: authUser, login } = useAuth();

  // Estados del componente
  const [user, setUser] = useState(null); // Datos del usuario
  const [isLoading, setIsLoading] = useState(false); // Carga al guardar cambios
  const [isDeletingPast, setIsDeletingPast] = useState(false); // Carga al eliminar citas pasadas
  const [isLoadingProfile, setIsLoadingProfile] = useState(true); // Carga inicial del perfil
  const [hasChanges, setHasChanges] = useState(false); // Detectar si se modificó algo

  // Campos del formulario
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');

  // Porcentaje de completitud del perfil
  const [profileCompleteness, setProfileCompleteness] = useState(0);

  // Valores originales para detectar cambios
  const [originalValues, setOriginalValues] = useState({
    name: '',
    surname: '',
    email: ''
  });

  // Efecto: cargar el perfil del usuario al inicio
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Solicitud al backend para obtener el perfil
        const response = await userAPI.getProfile();
        if (response.data.success) {
          const profileData = response.data.data;
          setUser(profileData);

          // Rellenar los campos con los datos del usuario
          setName(profileData.name || '');
          setSurname(profileData.surname || '');
          setEmail(profileData.email || '');

          // Guardar los valores originales
          setOriginalValues({
            name: profileData.name || '',
            surname: profileData.surname || '',
            email: profileData.email || ''
          });
        }
      } catch (error) {
        // Si falla, usar los datos del contexto
        console.log('Error fetching profile:', error);
        setUser(authUser);
        setName(authUser?.name || '');
        setSurname(authUser?.surname || '');
        setEmail(authUser?.email || '');
        setOriginalValues({
          name: authUser?.name || '',
          surname: authUser?.surname || '',
          email: authUser?.email || ''
        });
      } finally {
        setIsLoadingProfile(false);
      }
    };

    if (authUser) {
      fetchProfile();
    }
  }, [authUser]);

  // Efecto: detectar cambios en los campos
  useEffect(() => {
    const currentValues = { name, surname, email };
    const changed = JSON.stringify(currentValues) !== JSON.stringify(originalValues) ||
                    (password || passwordConfirmation);
    setHasChanges(changed);
  }, [name, surname, email, password, passwordConfirmation, originalValues]);

  // Efecto: calcular porcentaje de completitud del perfil
  useEffect(() => {
    let completeness = 0;
    if (name.trim()) completeness += 25;
    if (surname.trim()) completeness += 25;
    if (email.trim()) completeness += 25;
    if (user?.specialty || user?.role !== 'doctor') completeness += 25;
    setProfileCompleteness(completeness);
  }, [name, surname, email, user]);

  // Validación del formulario antes de guardar
  const validateForm = () => {
    if (!name.trim() || !surname.trim()) {
      NotificationService.showError('Error', 'Nombre y apellido son obligatorios');
      return false;
    }

    if (!email.trim()) {
      NotificationService.showError('Error', 'El correo electrónico es obligatorio');
      return false;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      NotificationService.showError('Error', 'El formato del correo electrónico no es válido');
      return false;
    }

    // Validar contraseñas si se está cambiando
    if (password) {
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

  // Guardar cambios del perfil
  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const updateData = {
        name: name.trim(),
        surname: surname.trim(),
        email: email.trim()
      };

      // Si el usuario cambia la contraseña, agregarla al payload
      if (password) {
        updateData.password = password;
        updateData.password_confirmation = passwordConfirmation;
        if (currentPassword) {
          updateData.current_password = currentPassword;
        }
      }

      // Enviar actualización al backend
      const response = await userAPI.updateProfile(updateData);

      if (response.data.success) {
        // Actualizar usuario en el contexto
        const updatedUser = response.data.data;
        await login(updatedUser, null);

        // Guardar nuevos valores originales
        setOriginalValues({
          name: updatedUser.name,
          surname: updatedUser.surname,
          email: updatedUser.email
        });

        // Actualizar campos visibles
        setName(updatedUser.name);
        setSurname(updatedUser.surname);
        setEmail(updatedUser.email);

        // Limpiar contraseñas
        setCurrentPassword('');
        setPassword('');
        setPasswordConfirmation('');

        // Notificación verde
        NotificationService.showSuccess('Cambio exitoso', 'Los cambios han sido guardados correctamente');
      } else {
        NotificationService.showError('Error', response.data.message || 'No se pudieron guardar los cambios');
      }
    } catch (error) {
      // Manejo de errores
      console.log('Update profile error:', error.response?.data || error.message);

      const errores = error.response?.data?.errors;
      if (errores) {
        const mensajes = Object.values(errores).flat().join("\n");
        NotificationService.showError('Error de validación', mensajes);
      } else {
        const message = error.response?.data?.message || 'Ocurrió un error al guardar los cambios.';
        NotificationService.showError('Error', message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Eliminar citas pasadas del usuario
  const handleDeletePastAppointments = () => {
    Alert.alert(
      'Eliminar citas pasadas',
      '¿Estás seguro de que deseas eliminar todas tus citas pasadas? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setIsDeletingPast(true);
            try {
              const response = await appointmentAPI.deletePastAppointments();
              if (response.data.success) {
                const count = response.data.deleted_count;
                NotificationService.showSuccess(
                  '¡Éxito!',
                  `Se ${count === 1 ? 'eliminó' : 'eliminaron'} ${count} cita${count === 1 ? '' : 's'} pasada${count === 1 ? '' : 's'}`
                );
              } else {
                NotificationService.showError('Error', response.data.message || 'No se pudieron eliminar las citas');
              }
            } catch (error) {
              console.log('Delete past appointments error:', error.response?.data || error.message);
              const message = error.response?.data?.message || 'No se pudieron eliminar las citas pasadas';
              NotificationService.showError('Error', message);
            } finally {
              setIsDeletingPast(false);
            }
          }
        }
      ]
    );
  };

  // Mostrar texto según el rol
  const getRoleText = (role) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'doctor': return 'Doctor';
      case 'patient': return 'Paciente';
      default: return role;
    }
  };

  // Color del rol
  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return Colors.error;
      case 'doctor': return Colors.success;
      case 'patient': return Colors.primary;
      default: return Colors.textSecondary;
    }
  };

  // Mostrar pantalla de carga mientras se obtiene el perfil
  if (isLoadingProfile) {
    return (
      <View style={[GlobalStyles.container, GlobalStyles.center]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={[GlobalStyles.text, { marginTop: 16 }]}>
          Cargando configuración...
        </Text>
      </View>
    );
  }

  // Render principal del componente
  return (
    <KeyboardAvoidingView
      style={GlobalStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Encabezado */}
        <View style={[GlobalStyles.card, GlobalStyles.backgroundPastelBlue]}>
          <View style={[GlobalStyles.center]}>
            <Ionicons name="settings" size={50} color={Colors.primary} style={{ marginBottom: 16 }} />
            <Text style={[GlobalStyles.title, { marginBottom: 8, textAlign: 'center' }]}>
              ¡Hola, {user?.name} {user?.surname}!
            </Text>
            <Text style={[GlobalStyles.subtitle, {
              color: getRoleColor(user?.role),
              marginBottom: 8,
              fontSize: 18,
              fontWeight: '600'
            }]}>
              {getRoleText(user?.role)}
            </Text>
            <Text style={[GlobalStyles.text, { textAlign: 'center', color: Colors.textSecondary }]}>
              Configuración de cuenta - Edita tu información personal
            </Text>
          </View>
        </View>


        {/* Barra de completitud de perfil */}
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

        {/* Campos editables */}
        <View style={GlobalStyles.card}>
          <Text style={[GlobalStyles.subtitle, { marginBottom: 16 }]}>
            Información personal
          </Text>

          {/* Nombre */}
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

          {/* Apellido */}
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

          {/* Correo */}
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

          {/* Cambio de contraseña */}
          <Text style={[GlobalStyles.subtitle, { marginTop: 24, marginBottom: 16 }]}>
            Cambiar contraseña
          </Text>

          {/* Contraseña actual */}
          <View style={{ marginBottom: 16 }}>
            <Text style={[GlobalStyles.textSmall, { marginBottom: 8, fontWeight: '600' }]}>
              Contraseña actual {user?.role !== 'admin' ? '(requerida)' : '(opcional)'}
            </Text>
            <TextInput
              placeholder={user?.role === 'admin' ? "Ingresa tu contraseña actual (opcional)" : "Ingresa tu contraseña actual"}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              style={GlobalStyles.input}
              placeholderTextColor={Colors.textLight}
            />
          </View>

          {/* Nueva contraseña */}
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

          {/* Confirmar contraseña */}
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
        </View>

        {/* Información no editable */}
        <View style={GlobalStyles.card}>
          <Text style={[GlobalStyles.subtitle, { marginBottom: 16 }]}>
            Información de cuenta
          </Text>

          {/* Rol del usuario */}
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

          {/* Especialidad del doctor */}
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

          {/* Fecha de registro */}
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

        {/* Sección exclusiva para administradores */}
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

        {/* Consejos */}
        <View style={[GlobalStyles.card, GlobalStyles.backgroundPastelYellow]}>
          <View style={[GlobalStyles.row, { alignItems: 'flex-start' }]}>
            <Ionicons name="bulb" size={24} color={Colors.warning} style={{ marginRight: 12, marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={[GlobalStyles.text, { fontWeight: '600', marginBottom: 8 }]}>
                Tips para tu cuenta
              </Text>
              <Text style={[GlobalStyles.textSmall, { color: Colors.textSecondary, lineHeight: 20 }]}>
                • Mantén tu correo actualizado para recibir notificaciones importantes{'\n'}
                • Usa una contraseña segura y cámbiala regularmente{'\n'}
                • Revisa regularmente tu información personal
              </Text>
            </View>
          </View>
        </View>




        {/* Botón para guardar cambios */}
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
