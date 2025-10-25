import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Switch,
  Button
} from 'react-native';
import { Colors } from '../../src/Components/Colors';
import { NotificationService } from '../../src/Components/NotificationService';
import { GlobalStyles } from '../../src/Components/Styles';
import { useAuth } from '../../src/Context/AuthContext';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

export default function Profile({ navigation }) {
  const { user, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // 🔔 Estados para las notificaciones
  const [permisoNotificaciones, setPermisoNotificaciones] = useState(false);
  const [loading, setLoading] = useState(true);

  // 🔍 Verificar permisos
  const checkPermisos = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    const preferencia = await AsyncStorage.getItem('notificaciones_activas');
    setPermisoNotificaciones(status === 'granted' && preferencia === 'true');
    setLoading(false);
  };

  useEffect(() => {
    checkPermisos();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      checkPermisos();
    }, [])
  );

  // 🧠 Activar o desactivar notificaciones
  const toggleSwitch = async (valor) => {
    if (valor) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        await AsyncStorage.setItem('notificaciones_activas', 'true');
        setPermisoNotificaciones(true);
        Alert.alert('✅ Notificaciones activadas');
      } else {
        await AsyncStorage.setItem('notificaciones_activas', 'false');
        setPermisoNotificaciones(false);
        Alert.alert('🚫 Permiso denegado');
      }
    } else {
      await AsyncStorage.setItem('notificaciones_activas', 'false');
      setPermisoNotificaciones(false);
      Alert.alert('🔕 Notificaciones desactivadas');
    }
  };

  // ⏰ Programar una notificación de prueba
  const programarNotificacion = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    const preferencia = await AsyncStorage.getItem('notificaciones_activas');
    if (status !== 'granted' || preferencia !== 'true') {
      Alert.alert('⚠️ No tiene permisos para recibir notificaciones');
      return;
    }

    const trigger = new Date(Date.now() + 2 * 60 * 1000); // 2 minutos
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📅 Notificación programada',
          body: 'Esta es una notificación programada para 2 minutos después.',
        },
        trigger,
      });
      Alert.alert('✅ Notificación programada para 2 minutos después');
    } catch (error) {
      Alert.alert('❌ Error al programar la notificación', error.message);
    }
  };

  // 🔴 Cerrar sesión
  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await logout();
              NotificationService.showSuccess('Sesión cerrada', 'Has cerrado sesión exitosamente');
            } catch (error) {
              NotificationService.showError('Error', 'No se pudo cerrar la sesión');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  // 🎭 Roles
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

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return 'shield-checkmark';
      case 'doctor': return 'medical';
      case 'patient': return 'person';
      default: return 'person';
    }
  };

  // 🔁 Pantalla principal
  return (
    <ScrollView style={GlobalStyles.container} showsVerticalScrollIndicator={false}>
      {/* Header del perfil */}
      <View style={[GlobalStyles.card, GlobalStyles.backgroundPastelBlue]}>
        <View style={[GlobalStyles.center, { marginBottom: 20 }]}>
          <View style={[GlobalStyles.backgroundPastelPurple, { 
            width: 100, 
            height: 100, 
            borderRadius: 50, 
            ...GlobalStyles.center 
          }]}>
            <Ionicons name={getRoleIcon(user?.role)} size={50} color={Colors.primary} />
          </View>
        </View>

        <View style={[GlobalStyles.center, { marginBottom: 16 }]}>
          <Text style={[GlobalStyles.title, { marginBottom: 8 }]}>
            {user?.name} {user?.surname}
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
          {user?.specialty && (
            <Text style={[GlobalStyles.text, { color: Colors.primary, fontWeight: '600' }]}>
              {user.specialty.name}
            </Text>
          )}
        </View>
      </View>

      {/* Información personal */}
      <View style={GlobalStyles.card}>
        <Text style={[GlobalStyles.subtitle, { marginBottom: 16 }]}>
          Información personal
        </Text>

        <View style={[GlobalStyles.row, { alignItems: 'center', marginBottom: 16 }]}>
          <View style={[GlobalStyles.backgroundPastelBlue, { 
            width: 40, height: 40, borderRadius: 20, ...GlobalStyles.center, marginRight: 16
          }]}>
            <Ionicons name="mail" size={20} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[GlobalStyles.textSmall, { color: Colors.textSecondary }]}>
              Correo electrónico
            </Text>
            <Text style={[GlobalStyles.text, { fontWeight: '600' }]}>
              {user?.email}
            </Text>
          </View>
        </View>

        <View style={[GlobalStyles.row, { alignItems: 'center', marginBottom: 16 }]}>
          <View style={[GlobalStyles.backgroundPastelGreen, { 
            width: 40, height: 40, borderRadius: 20, ...GlobalStyles.center, marginRight: 16
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

        {user?.specialty && (
          <View style={[GlobalStyles.row, { alignItems: 'center' }]}>
            <View style={[GlobalStyles.backgroundPastelYellow, { 
              width: 40, height: 40, borderRadius: 20, ...GlobalStyles.center, marginRight: 16
            }]}>
              <Ionicons name="medical" size={20} color={Colors.warning} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[GlobalStyles.textSmall, { color: Colors.textSecondary }]}>
                Especialidad
              </Text>
              <Text style={[GlobalStyles.text, { fontWeight: '600' }]}>
                {user.specialty.name}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Configuración de notificaciones */}
      <View style={GlobalStyles.card}>
        <Text style={[GlobalStyles.subtitle, { marginBottom: 16 }]}>
          Notificaciones
        </Text>

        {loading ? (
          <ActivityIndicator color={Colors.primary} />
        ) : (
          <View style={[GlobalStyles.center]}>
            <Text style={[GlobalStyles.text, { marginBottom: 10 }]}>
              Estado: {permisoNotificaciones ? ' Activadas' : ' Desactivadas'}
            </Text>
            <Switch
              value={permisoNotificaciones}
              onValueChange={toggleSwitch}
              thumbColor={permisoNotificaciones ? Colors.success : Colors.error}
            />
            <View style={{ marginTop: 20 }}>
              <Button title="Programar notificación de prueba" onPress={programarNotificacion} />
            </View>
          </View>
        )}
      </View>

      {/* Botón de cerrar sesión */}
      <View style={GlobalStyles.card}>
        <TouchableOpacity
          style={[GlobalStyles.buttonSecondary, { 
            borderColor: Colors.error,
            opacity: isLoading ? 0.7 : 1
          }]}
          onPress={handleLogout}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.error} />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={20} color={Colors.error} style={{ marginRight: 8 }} />
              <Text style={[GlobalStyles.buttonTextSecondary, { color: Colors.error }]}>
                Cerrar sesión
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Información de la app */}
      <View style={[GlobalStyles.card, GlobalStyles.backgroundPastelGreen]}>
        <View style={[GlobalStyles.center]}>
          <Text style={[GlobalStyles.text, { fontWeight: '600', marginBottom: 8 }]}>
            Sistema de Citas Médicas
          </Text>
          <Text style={[GlobalStyles.textSmall, { color: Colors.textSecondary, textAlign: 'center' }]}>
            Versión 1.0.0{'\n'}
            Desarrollado con React Native y Expo
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
