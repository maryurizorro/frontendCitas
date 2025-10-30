import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Switch,
  StyleSheet,
} from 'react-native';
import { Colors } from '../../src/Components/Colors';
import { NotificationService } from '../../src/Components/NotificationService';
import { useAuth } from '../../src/Context/AuthContext';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

export default function Profile() {
  const { user, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [permisoNotificaciones, setPermisoNotificaciones] = useState(false);
  const [loading, setLoading] = useState(true);

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
          },
        },
      ]
    );
  };

  const getRoleText = (role) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'doctor':
        return 'Doctor';
      case 'patient':
        return 'Paciente';
      default:
        return role;
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return 'shield-checkmark';
      case 'doctor':
        return 'medical';
      case 'patient':
        return 'person';
      default:
        return 'person';
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Encabezado del perfil */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name={getRoleIcon(user?.role)} size={60} color="#4F46E5" />
        </View>
        <Text style={styles.name}>
          {user?.name} {user?.surname}
        </Text>
        <Text style={styles.role}>{getRoleText(user?.role)}</Text>
        {user?.specialty && (
          <Text style={styles.specialty}>{user.specialty.name}</Text>
        )}
      </View>

      {/* Información personal */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información personal</Text>

        <View style={styles.item}>
          <Ionicons name="mail-outline" size={20} color="#4F46E5" />
          <Text style={styles.itemText}>{user?.email}</Text>
        </View>

        {user?.created_at && (
          <View style={styles.item}>
            <Ionicons name="calendar-outline" size={20} color="#4F46E5" />
            <Text style={styles.itemText}>
              Miembro desde: {new Date(user.created_at).toLocaleDateString('es-ES')}
            </Text>
          </View>
        )}
      </View>

      {/* Notificaciones */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notificaciones</Text>
        <View style={styles.switchRow}>
          <Text style={styles.itemText}>Estado: </Text>
          <Switch
            value={permisoNotificaciones}
            onValueChange={toggleSwitch}
            thumbColor={permisoNotificaciones ? '#4F46E5' : '#ccc'}
            trackColor={{ true: '#C7D2FE', false: '#E5E7EB' }}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={programarNotificacion}>
          <Text style={styles.buttonText}>Programar notificación de prueba</Text>
        </TouchableOpacity>
      </View>

      {/* Cerrar sesión */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>

      {/* Información de la app */}
      <View style={styles.appInfo}>
        <Text style={styles.appInfoTitle}>Sistema de Citas Médicas</Text>
        <Text style={styles.appInfoSubtitle}>Versión 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingVertical: 30,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 4,
  },
  avatar: {
    backgroundColor: '#E0E7FF',
    padding: 25,
    borderRadius: 60,
    marginBottom: 10,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  role: {
    fontSize: 15,
    color: '#6366F1',
    marginTop: 3,
  },
  specialty: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 5,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 15,
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemText: {
    marginLeft: 10,
    fontSize: 15,
    color: '#374151',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  logoutBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingVertical: 12,
    borderRadius: 10,
  },
  logoutText: {
    color: '#EF4444',
    fontWeight: '600',
    marginLeft: 8,
  },
  appInfo: {
    alignItems: 'center',
    marginBottom: 35,
  },
  appInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  appInfoSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
});
