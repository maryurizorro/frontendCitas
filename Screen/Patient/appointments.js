import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
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

export default function AppointmentsScreen({ navigation }) {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, pending, cancelled, completed

  useEffect(() => {
    fetchAppointments();
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Refresh appointments when screen comes into focus
      fetchAppointments();
    }, [])
  );

  const fetchAppointments = async () => {
    try {
      const response = await appointmentAPI.myAppointments();
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

  const cancelAppointment = async (appointmentId) => {
    Alert.alert(
      'Cancelar cita',
      '¿Estás seguro de que quieres cancelar esta cita?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              await appointmentAPI.deleteAppointment(appointmentId);
              NotificationService.showSuccess('Cita cancelada', 'Tu cita ha sido cancelada exitosamente');
              fetchAppointments();
            } catch (error) {
              NotificationService.showError('Error', 'No se pudo cancelar la cita');
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
    return appointments.filter(appointment => {
      switch (filter) {
        case 'pending':
          return appointment.status === 'pending';
        case 'cancelled':
          return appointment.status === 'cancelled';
        case 'completed':
          return appointment.status === 'completed';
        default:
          return true;
      }
    }).sort((a, b) => new Date(a.appointment_date || a.date) - new Date(b.appointment_date || b.date));
  };

  const renderAppointment = ({ item }) => {
    if (!item) return null;

    const canCancel = item.status === 'confirmed' || item.status === 'pending';
    const appointmentDate = item.appointment_date || item.date;
    const parsedDate = appointmentDate ? new Date(appointmentDate) : null;
    const today = new Date();
    const isPast = parsedDate && parsedDate < today;

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
              Dr. {item.doctor?.name || 'Doctor'} {item.doctor?.surname || ''}
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
              {formatDate(appointmentDate)}
            </Text>
          </View>
          <View style={[GlobalStyles.row, { alignItems: 'center' }]}>
            <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
            <Text style={[GlobalStyles.textSmall, { marginLeft: 8 }]}>
              {formatTime(appointmentDate)}
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

        {canCancel && !isPast && (
          <TouchableOpacity
            style={[GlobalStyles.buttonSecondary, { marginTop: 8 }]}
            onPress={() => cancelAppointment(item.id)}
          >
            <Text style={[GlobalStyles.buttonTextSecondary, { color: Colors.error }]}>
              Cancelar cita
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={[GlobalStyles.center, { paddingVertical: 40 }]}>
      <Ionicons name="calendar-outline" size={64} color={Colors.textLight} />
      <Text style={[GlobalStyles.text, { color: Colors.textLight, marginTop: 16, textAlign: 'center' }]}>
        {filter === 'all' && 'No tienes citas registradas'}
        {filter === 'pending' && 'No tienes citas pendientes'}
        {filter === 'cancelled' && 'No tienes citas canceladas'}
        {filter === 'completed' && 'No tienes citas completadas'}
      </Text>
      {filter === 'all' && (
        <TouchableOpacity 
          style={[GlobalStyles.buttonPrimary, { marginTop: 16 }]}
          onPress={() => navigation.navigate('Book')}
        >
          <Text style={GlobalStyles.buttonText}>
            Reservar mi primera cita
          </Text>
        </TouchableOpacity>
      )}
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
            { key: 'pending', label: 'Pendientes', icon: 'time' },
            { key: 'cancelled', label: 'Canceladas', icon: 'close-circle' },
            { key: 'completed', label: 'Completadas', icon: 'checkmark-circle' }
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