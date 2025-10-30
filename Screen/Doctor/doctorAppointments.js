import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Colors } from '../../src/Components/Colors';
import { NotificationService } from '../../src/Components/NotificationService';
import { GlobalStyles } from '../../src/Components/Styles';
import { appointmentAPI } from '../../src/Services/conexion';

// Pantalla para que el doctor gestione sus citas (ver, confirmar, cancelar, completar, eliminar)
export default function DoctorAppointments({ navigation }) {

  // Estados principales
  const [appointments, setAppointments] = useState([]); // Guarda todas las citas
  const [isLoading, setIsLoading] = useState(true); // Muestra el spinner al cargar
  const [refreshing, setRefreshing] = useState(false); // Controla el pull-to-refresh
  const [filter, setFilter] = useState('all'); // Filtro actual: todas, hoy, próximas o pasadas

  // Se ejecuta al montar el componente
  useEffect(() => {
    fetchAppointments();

    // No configurar polling en esta pantalla para evitar duplicación de notificaciones
    // La notificación se muestra solo en dashboardDoctor.js al entrar por primera vez

    return () => {};
  }, []);

  // Obtiene las citas del doctor desde la API
  const fetchAppointments = async () => {
    try {
      const response = await appointmentAPI.getDoctorAppointments();
      if (response.data.success) {
        setAppointments(response.data.data || []); // Guarda las citas obtenidas

        // Mostrar recordatorio si hay citas pendientes (solo toast in-app, sin notificación del sistema)
        const pendingCount = response.data.pending_count || 0;
        if (pendingCount > 0) {
          // Solo mostrar toast in-app, la notificación del sistema se maneja en dashboardDoctor.js
          NotificationService.showWarning('Citas Pendientes', `Tienes ${pendingCount} cita(s) pendiente(s) que requieren tu atención.`);
        }
      } else {
        console.log('API response not successful:', response.data);
        NotificationService.showError('Error', response.data.error || 'No se pudieron cargar las citas');
        setAppointments([]);
      }
    } catch (error) {
      console.log('Error fetching appointments:', error);
      NotificationService.showError('Error', 'No se pudieron cargar las citas');
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresca la lista al deslizar hacia abajo
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAppointments();
    setRefreshing(false);
  };

  // Actualiza el estado de una cita (confirmar, cancelar o completar)
  const updateAppointmentStatus = async (appointmentId, newStatus) => {
    try {
      const response = await appointmentAPI.updateAppointment(appointmentId, { status: newStatus });
      if (response.data.success) {
        NotificationService.showSuccess('Estado actualizado', 'El estado de la cita ha sido actualizado');

        // Mostrar notificación del sistema con vibración para el paciente
        const appointment = appointments.find(a => a.id === appointmentId);
        if (appointment) {
          let notificationType = newStatus;
          let notificationData = {
            doctor_name: appointment.doctor?.name + ' ' + appointment.doctor?.surname,
            patient_name: appointment.patient?.name + ' ' + appointment.patient?.surname,
          };

          NotificationService.showAppointmentNotification(notificationType, notificationData);
        }

        // Actualizar el estado local sin recargar
        setAppointments(prevAppointments =>
          prevAppointments.map(apt =>
            apt.id === appointmentId ? { ...apt, status: newStatus } : apt
          )
        );
      } else {
        NotificationService.showError('Error', response.data.error || 'No se pudo actualizar el estado');
      }
    } catch (error) {
      console.log('Error updating appointment:', error);
      NotificationService.showError('Error', 'No se pudo actualizar el estado');
    }
  };

  // Confirmar cita (muestra alerta de confirmación)
  const confirmAppointment = (appointmentId) => {
    Alert.alert(
      'Confirmar cita',
      '¿Confirmar esta cita?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: () => updateAppointmentStatus(appointmentId, 'confirmed')
        }
      ]
    );
  };

  // Cancelar cita (muestra alerta de confirmación)
  const cancelAppointment = (appointmentId) => {
    Alert.alert(
      'Cancelar cita',
      '¿Estás seguro de que quieres cancelar esta cita?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: () => updateAppointmentStatus(appointmentId, 'cancelled')
        }
      ]
    );
  };

  // Marcar cita como completada
  const completeAppointment = (appointmentId) => {
    Alert.alert(
      'Completar cita',
      '¿Marcar esta cita como completada?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Completar',
          onPress: () => updateAppointmentStatus(appointmentId, 'completed')
        }
      ]
    );
  };

  // Eliminar una cita completamente
  const deleteAppointment = async (appointmentId) => {
    const appointment = appointments.find(a => a.id === appointmentId);
    const isCancelled = appointment?.status === 'cancelled';

    Alert.alert(
      'Eliminar cita',
      `¿Estás seguro de que quieres eliminar ${isCancelled ? 'esta cita cancelada' : 'esta cita'}? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await appointmentAPI.deleteAppointment(appointmentId);
              NotificationService.showSuccess('Cita eliminada', 'La cita ha sido eliminada completamente del sistema');
              // Actualizar el estado local sin recargar
              setAppointments(prevAppointments =>
                prevAppointments.filter(apt => apt.id !== appointmentId)
              );
            } catch (error) {
              NotificationService.showError('Error', 'No se pudo eliminar la cita');
            }
          }
        }
      ]
    );
  };

  // Formatea fecha a formato legible
  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha no disponible';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Fecha inválida';
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Muestra solo hora (hh:mm)
  const formatTime = (timeString) => {
    if (!timeString) return '--:--';
    return timeString.substring(0, 5);
  };

  // Colores según estado
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return Colors.success;
      case 'pending': return Colors.warning;
      case 'cancelled': return Colors.error;
      case 'completed': return Colors.primary;
      default: return Colors.textSecondary;
    }
  };

  // Texto legible según estado
  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed': return 'Confirmada';
      case 'pending': return 'Pendiente';
      case 'cancelled': return 'Cancelada';
      case 'completed': return 'Completada';
      default: return status;
    }
  };

  // Aplica filtros (todas, hoy, próximas, pasadas o completadas)
  const getFilteredAppointments = () => {
    const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0); // Local midnight

    return appointments.filter(appointment => {
      const appointmentDateStr = appointment.appointment_date || appointment.date;
      if (!appointmentDateStr) return filter === 'all';

      const appointmentDate = new Date(appointmentDateStr);
      if (isNaN(appointmentDate.getTime())) return filter === 'all';

      appointmentDate.setHours(0, 0, 0, 0);

      switch (filter) {
        case 'today':
          return appointmentDateStr === today;
        case 'upcoming':
          return appointmentDate > todayDate && appointment.status !== 'cancelled';
        case 'past':
          return appointmentDate < todayDate;
        case 'completed':
          return appointment.status === 'completed';
        default:
          return true;
      }
    }).sort((a, b) => {
      const dateA = a.appointment_date || a.date;
      const dateB = b.appointment_date || b.date;
      return new Date(dateA || 0) - new Date(dateB || 0);
    });
  };

  // Renderiza cada cita en una tarjeta
  const renderAppointment = ({ item }) => {
    if (!item) return null;

    // Controla qué botones se muestran según el estado
    const canConfirm = item.status === 'pending';
    const canComplete = item.status === 'confirmed';
    const canCancel = item.status === 'pending' || item.status === 'confirmed';
    const appointmentDateStr = item.appointment_date || item.date;
    const appointmentDate = appointmentDateStr ? new Date(appointmentDateStr) : null;
    const today = new Date();
    const isPast = appointmentDate && appointmentDate < today;

    return (
      <View style={[
        GlobalStyles.card,
        {
          marginHorizontal: 16,
          marginVertical: 8,
          borderLeftWidth: 4,
          borderLeftColor: getStatusColor(item.status || 'pending')
        }
      ]}>
        {/* Encabezado con nombre del paciente y estado */}
        <View style={[GlobalStyles.row, GlobalStyles.spaceBetween, { marginBottom: 12 }]}>
          <View style={{ flex: 1 }}>
            <Text style={[GlobalStyles.text, { fontWeight: '600', marginBottom: 4 }]}>
              {item.patient?.name || 'Paciente'} {item.patient?.surname || ''}
            </Text>
            <Text style={[GlobalStyles.textSmall, { color: Colors.primary, marginBottom: 8 }]}>
              {item.specialty?.name || 'Especialidad no especificada'}
              {item.specialty?.description && (
                <Text style={[GlobalStyles.textSmall, { color: Colors.textLight, fontSize: 12, marginTop: 2 }]}>
                  {item.specialty.description}
                </Text>
              )}
            </Text>
          </View>
          <View style={{
            backgroundColor: getStatusColor(item.status || 'pending'),
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 16
          }}>
            <Text style={[GlobalStyles.textSmall, { color: 'white', fontWeight: '600' }]}>
              {getStatusText(item.status || 'pending')}
            </Text>
          </View>
        </View>

        {/* Fecha y hora */}
        <View style={[GlobalStyles.row, { marginBottom: 12 }]}>
          <View style={[GlobalStyles.row, { flex: 1, alignItems: 'center' }]}>
            <Ionicons name="calendar-outline" size={16} color={Colors.textSecondary} />
            <Text style={[GlobalStyles.textSmall, { marginLeft: 8 }]}>
              {formatDate(appointmentDateStr)}
            </Text>
          </View>
          <View style={[GlobalStyles.row, { alignItems: 'center' }]}>
            <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
            <Text style={[GlobalStyles.textSmall, { marginLeft: 8 }]}>
              {formatTime(item.time)}
            </Text>
          </View>
        </View>

        {/* Notas opcionales */}
        {item.notes && (
          <View style={[GlobalStyles.backgroundPastelBlue, { padding: 12, borderRadius: 8, marginBottom: 12 }]}>
            <Text style={[GlobalStyles.textSmall, { fontStyle: 'italic' }]}>
              &quot;{item.notes}&quot;
            </Text>
          </View>
        )}

        {/* Botones de acción según estado */}
        {/* Estado: Pendiente - Solo Confirmar y Cancelar */}
        {item.status === 'pending' && !isPast && (
          <View style={[GlobalStyles.row, { justifyContent: 'space-around', gap: 8, marginTop: 8 }]}>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: '#d1fae5',
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 8,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#a7f3d0'
              }}
              onPress={() => confirmAppointment(item.id)}
            >
              <Ionicons name="checkmark-circle" size={16} color="#059669" style={{ marginBottom: 4 }} />
              <Text style={{
                color: '#059669',
                fontWeight: '600',
                fontSize: 11,
                textTransform: 'uppercase'
              }}>
                Confirmar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: '#fef3c7',
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 8,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#fde68a'
              }}
              onPress={() => cancelAppointment(item.id)}
            >
              <Ionicons name="close-circle" size={16} color="#d97706" style={{ marginBottom: 4 }} />
              <Text style={{
                color: '#d97706',
                fontWeight: '600',
                fontSize: 11,
                textTransform: 'uppercase'
              }}>
                Cancelar
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Estado: Confirmada - Solo Cancelar y Completar */}
        {item.status === 'confirmed' && !isPast && (
          <View style={[GlobalStyles.row, { justifyContent: 'space-around', gap: 8, marginTop: 8 }]}>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: '#e0f2fe',
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 8,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#bae6fd'
              }}
              onPress={() => completeAppointment(item.id)}
            >
              <Ionicons name="checkmark-done-circle" size={16} color="#0369a1" style={{ marginBottom: 4 }} />
              <Text style={{
                color: '#0369a1',
                fontWeight: '600',
                fontSize: 11,
                textTransform: 'uppercase'
              }}>
                Completar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: '#fef3c7',
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 8,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#fde68a'
              }}
              onPress={() => cancelAppointment(item.id)}
            >
              <Ionicons name="close-circle" size={16} color="#d97706" style={{ marginBottom: 4 }} />
              <Text style={{
                color: '#d97706',
                fontWeight: '600',
                fontSize: 11,
                textTransform: 'uppercase'
              }}>
                Cancelar
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Estado: Cancelada - Solo Eliminar */}
        {item.status === 'cancelled' && (
          <TouchableOpacity
            style={{
              backgroundColor: '#fee2e2',
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 8,
              alignItems: 'center',
              marginTop: 8,
              borderWidth: 1,
              borderColor: '#fecaca'
            }}
            onPress={() => deleteAppointment(item.id)}
          >
            <Ionicons name="trash-outline" size={16} color="#dc2626" style={{ marginBottom: 4 }} />
            <Text style={{
              color: '#dc2626',
              fontWeight: '600',
              fontSize: 11,
              textTransform: 'uppercase'
            }}>
              Eliminar cita cancelada
            </Text>
          </TouchableOpacity>
        )}

        {/* Estado: Completada - Sin botones */}
        {item.status === 'completed' && null}
      </View>
    );
  };

  // Vista vacía si no hay citas
  const renderEmptyState = () => (
    <View style={[GlobalStyles.center, { paddingVertical: 40 }]}>
      <Ionicons name="calendar-outline" size={64} color={Colors.textLight} />
      <Text style={[GlobalStyles.text, { color: Colors.textLight, marginTop: 16, textAlign: 'center' }]}>
        {filter === 'all' ? 'No tienes citas registradas' :
         filter === 'today' ? 'No tienes citas programadas para hoy' :
         filter === 'upcoming' ? 'No tienes citas próximas' :
         filter === 'past' ? 'No tienes citas pasadas' :
         'No tienes citas completadas'}
      </Text>
    </View>
  );

  // Mientras carga, muestra spinner
  if (isLoading) {
    return (
      <View style={[GlobalStyles.container, GlobalStyles.center]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Aplica el filtro actual
  const filteredAppointments = getFilteredAppointments();

  return (
    <View style={GlobalStyles.container}>
      {/* Barra de filtros */}
      <View style={[GlobalStyles.card, { marginBottom: 8 }]}>
        <View style={[GlobalStyles.row, { justifyContent: 'space-around' }]}>
          {[
            { key: 'all', label: 'Todas', icon: 'list' },
            { key: 'today', label: 'Hoy', icon: 'today' },
            { key: 'upcoming', label: 'Próximas', icon: 'calendar' },
            { key: 'past', label: 'Pasadas', icon: 'time' },
            { key: 'completed', label: 'Completadas', icon: 'checkmark-done' }
          ].map((filterOption) => (
            <TouchableOpacity
              key={filterOption.key}
              style={[
                GlobalStyles.center,
                {
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 20,
                  backgroundColor: filter === filterOption.key ? Colors.primary : 'transparent',
                  minWidth: 80
                }
              ]}
              onPress={() => setFilter(filterOption.key)}
            >
              <Ionicons 
                name={filterOption.icon} 
                size={16} 
                color={filter === filterOption.key ? Colors.backgroundCard : Colors.textSecondary} 
              />
              <Text style={[
                GlobalStyles.textSmall,
                {
                  color: filter === filterOption.key ? Colors.backgroundCard : Colors.textSecondary,
                  fontWeight: filter === filterOption.key ? '600' : '400',
                  marginTop: 4
                }
              ]}>
                {filterOption.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Lista principal de citas */}
      <FlatList
        data={filteredAppointments}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderAppointment}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}
