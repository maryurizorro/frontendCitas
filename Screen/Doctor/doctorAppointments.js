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

export default function DoctorAppointments({ navigation }) {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, today, upcoming, past

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await appointmentAPI.getDoctorAppointments();
      if (response.data.success) {
        setAppointments(response.data.data);
      }
    } catch (error) {
      console.log('Error fetching appointments:', error);
      NotificationService.showError('Error', 'No se pudieron cargar las citas');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAppointments();
    setRefreshing(false);
  };

  const updateAppointmentStatus = async (appointmentId, newStatus) => {
    try {
      await appointmentAPI.updateAppointment(appointmentId, { status: newStatus });
      NotificationService.showSuccess('Estado actualizado', 'El estado de la cita ha sido actualizado');
      fetchAppointments();
    } catch (error) {
      NotificationService.showError('Error', 'No se pudo actualizar el estado');
    }
  };

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

  const formatTime = (timeString) => {
    if (!timeString) return '--:--';
    return timeString.substring(0, 5);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return Colors.success;
      case 'pending': return Colors.warning;
      case 'cancelled': return Colors.error;
      case 'completed': return Colors.primary;
      default: return Colors.textSecondary;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed': return 'Confirmada';
      case 'pending': return 'Pendiente';
      case 'cancelled': return 'Cancelada';
      case 'completed': return 'Completada';
      default: return status;
    }
  };

  const getFilteredAppointments = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

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
        default:
          return true;
      }
    }).sort((a, b) => {
      const dateA = a.appointment_date || a.date;
      const dateB = b.appointment_date || b.date;
      return new Date(dateA || 0) - new Date(dateB || 0);
    });
  };

  const renderAppointment = ({ item }) => {
    if (!item) return null;

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
        <View style={[GlobalStyles.row, GlobalStyles.spaceBetween, { marginBottom: 12 }]}>
          <View style={{ flex: 1 }}>
            <Text style={[GlobalStyles.text, { fontWeight: '600', marginBottom: 4 }]}>
              {item.patient?.name || 'Paciente'} {item.patient?.surname || ''}
            </Text>
            <Text style={[GlobalStyles.textSmall, { color: Colors.primary, marginBottom: 8 }]}>
              {item.specialty?.name || 'Especialidad no especificada'}
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

        {item.notes && (
          <View style={[GlobalStyles.backgroundPastelBlue, { padding: 12, borderRadius: 8, marginBottom: 12 }]}>
            <Text style={[GlobalStyles.textSmall, { fontStyle: 'italic' }]}>
              &quot;{item.notes}&quot;
            </Text>
          </View>
        )}

        {/* Botones de acción */}
        {!isPast && (canConfirm || canComplete || canCancel) && (
          <View style={[GlobalStyles.row, { justifyContent: 'space-around', marginTop: 8 }]}>
            {canConfirm && (
              <TouchableOpacity
                style={[GlobalStyles.buttonSecondary, { flex: 1, marginHorizontal: 4 }]}
                onPress={() => confirmAppointment(item.id)}
              >
                <Text style={[GlobalStyles.buttonTextSecondary, { color: Colors.success }]}>
                  Confirmar
                </Text>
              </TouchableOpacity>
            )}

            {canComplete && (
              <TouchableOpacity
                style={[GlobalStyles.buttonSecondary, { flex: 1, marginHorizontal: 4 }]}
                onPress={() => completeAppointment(item.id)}
              >
                <Text style={[GlobalStyles.buttonTextSecondary, { color: Colors.primary }]}>
                  Completar
                </Text>
              </TouchableOpacity>
            )}

            {canCancel && (
              <TouchableOpacity
                style={[GlobalStyles.buttonSecondary, { flex: 1, marginHorizontal: 4 }]}
                onPress={() => cancelAppointment(item.id)}
              >
                <Text style={[GlobalStyles.buttonTextSecondary, { color: Colors.error }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={[GlobalStyles.center, { paddingVertical: 40 }]}>
      <Ionicons name="calendar-outline" size={64} color={Colors.textLight} />
      <Text style={[GlobalStyles.text, { color: Colors.textLight, marginTop: 16, textAlign: 'center' }]}>
        {filter === 'all' && 'No tienes citas registradas'}
        {filter === 'today' && 'No tienes citas programadas para hoy'}
        {filter === 'upcoming' && 'No tienes citas próximas'}
        {filter === 'past' && 'No tienes citas pasadas'}
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[GlobalStyles.container, GlobalStyles.center]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const filteredAppointments = getFilteredAppointments();

  return (
    <View style={GlobalStyles.container}>
      {/* Filtros */}
      <View style={[GlobalStyles.card, { marginBottom: 8 }]}>
        <View style={[GlobalStyles.row, { justifyContent: 'space-around' }]}>
          {[
            { key: 'all', label: 'Todas', icon: 'list' },
            { key: 'today', label: 'Hoy', icon: 'today' },
            { key: 'upcoming', label: 'Próximas', icon: 'calendar' },
            { key: 'past', label: 'Pasadas', icon: 'time' }
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

      {/* Lista de citas */}
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
