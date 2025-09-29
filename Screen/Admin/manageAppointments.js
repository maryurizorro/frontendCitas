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

export default function ManageAppointments({ navigation }) {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, today, pending, confirmed, cancelled

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await appointmentAPI.getAppointments();
      if (response.data.success) {
        setAppointments(response.data.data || []);
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

  const deleteAppointment = async (appointmentId) => {
    Alert.alert(
      'Eliminar cita',
      '¿Estás seguro de que quieres eliminar esta cita?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await appointmentAPI.deleteAppointment(appointmentId);
              NotificationService.showSuccess('Cita eliminada', 'La cita ha sido eliminada exitosamente');
              fetchAppointments();
            } catch (error) {
              NotificationService.showError('Error', 'No se pudo eliminar la cita');
            }
          }
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

  const formatTime = (appointmentDate) => {
    if (!appointmentDate) return '--:--';
    try {
      const date = new Date(appointmentDate);
      if (isNaN(date.getTime())) return '--:--';
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch (error) {
      return '--:--';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return Colors.success;
      case 'pending': return Colors.warning;
      case 'cancelled': return Colors.error;
      default: return Colors.textSecondary;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed': return 'Confirmada';
      case 'pending': return 'Pendiente';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  const getFilteredAppointments = () => {
    if (!Array.isArray(appointments)) return [];

    const today = new Date().toISOString().split('T')[0];

    return appointments.filter(appointment => {
      if (!appointment) return false;

      switch (filter) {
        case 'today':
          return appointment.appointment_date === today || appointment.date === today;
        case 'pending':
          return appointment.status === 'pending';
        case 'confirmed':
          return appointment.status === 'confirmed';
        case 'cancelled':
          return appointment.status === 'cancelled';
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
              Dr. {item.doctor?.name || 'Doctor'} {item.doctor?.surname || ''}
            </Text>
            <Text style={[GlobalStyles.textSmall, { color: Colors.textSecondary }]}>
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
              {formatDate(item.appointment_date || item.date)}
            </Text>
          </View>
          <View style={[GlobalStyles.row, { alignItems: 'center' }]}>
            <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
            <Text style={[GlobalStyles.textSmall, { marginLeft: 8 }]}>
              {formatTime(item.appointment_date || item.date)}
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
        <View style={[GlobalStyles.row, { justifyContent: 'space-around' }]}>
          {item.status === 'pending' && (
            <TouchableOpacity
              style={[GlobalStyles.buttonSecondary, { flex: 1, marginRight: 8 }]}
              onPress={() => updateAppointmentStatus(item.id, 'confirmed')}
            >
              <Text style={[GlobalStyles.buttonTextSecondary, { color: Colors.success }]}>
                Confirmar
              </Text>
            </TouchableOpacity>
          )}

          {item.status !== 'cancelled' && (
            <TouchableOpacity
              style={[GlobalStyles.buttonSecondary, { flex: 1, marginHorizontal: 4 }]}
              onPress={() => updateAppointmentStatus(item.id, 'cancelled')}
            >
              <Text style={[GlobalStyles.buttonTextSecondary, { color: Colors.error }]}>
                Cancelar
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[GlobalStyles.buttonSecondary, { flex: 1, marginLeft: 8 }]}
            onPress={() => deleteAppointment(item.id)}
          >
            <Text style={[GlobalStyles.buttonTextSecondary, { color: Colors.error }]}>
              Eliminar
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={[GlobalStyles.center, { paddingVertical: 40 }]}>
      <Ionicons name="calendar-outline" size={64} color={Colors.textLight} />
      <Text style={[GlobalStyles.text, { color: Colors.textLight, marginTop: 16, textAlign: 'center' }]}>
        No hay citas registradas
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
            { key: 'pending', label: 'Pendientes', icon: 'time' },
            { key: 'confirmed', label: 'Confirmadas', icon: 'checkmark' },
            { key: 'cancelled', label: 'Canceladas', icon: 'close' }
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
