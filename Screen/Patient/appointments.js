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

// Pantalla para mostrar y gestionar las citas del usuario
export default function AppointmentsScreen({ navigation }) {
  // Estados principales
  const [appointments, setAppointments] = useState([]); // Lista de citas
  const [isLoading, setIsLoading] = useState(true); // Indicador de carga inicial
  const [refreshing, setRefreshing] = useState(false); // Estado para refrescar lista
  const [filter, setFilter] = useState('all'); // Filtro actual (todas, pendientes, etc.)

  // Carga inicial de citas al montar el componente
  useEffect(() => {
    fetchAppointments();
  }, []);

  // Se ejecuta cada vez que la pantalla vuelve al enfoque
  useFocusEffect(
    useCallback(() => {
      fetchAppointments(); // Recarga citas al volver a la vista
    }, [])
  );

  // Función para obtener las citas desde la API
  const fetchAppointments = async () => {
    try {
      const response = await appointmentAPI.myAppointments();
      if (response.data.success) {
        setAppointments(response.data.data || []); // Guarda las citas en el estado, asegurando que sea un array
      }
    } catch (error) {
      console.log('Error fetching appointments:', error);
      NotificationService.showError('Error', 'No se pudieron cargar las citas');
      setAppointments([]); // Establece un array vacío en caso de error
    } finally {
      setIsLoading(false); // Quita el indicador de carga
    }
  };

  // Refresca las citas con "pull to refresh"
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAppointments();
    setRefreshing(false);
  };

  // Elimina una cita cancelada completamente
  const deleteAppointment = async (appointmentId) => {
    Alert.alert(
      'Eliminar cita',
      '¿Estás seguro de que quieres eliminar esta cita cancelada? Esta acción no se puede deshacer.',
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

  // Cancela una cita específica (solo para pendientes)
  const cancelAppointment = async (appointmentId) => {
    const appointment = appointments.find(a => a.id === appointmentId);
    if (appointment?.status !== 'pending') {
      NotificationService.showError('Error', 'Solo puedes cancelar citas pendientes');
      return;
    }

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
              // Actualizar el estado a 'cancelled' en lugar de eliminar
              await appointmentAPI.updateAppointment(appointmentId, { status: 'cancelled' });
              NotificationService.showSuccess('Cita cancelada', 'Tu cita ha sido cancelada exitosamente');

              // Mostrar notificación del sistema con vibración
              if (appointment) {
                NotificationService.showAppointmentNotification('cancelled', {
                  doctor_name: appointment.doctor?.name + ' ' + appointment.doctor?.surname,
                });
              }

              // Actualizar el estado local sin recargar
              setAppointments(prevAppointments =>
                prevAppointments.map(apt =>
                  apt.id === appointmentId ? { ...apt, status: 'cancelled' } : apt
                )
              );
            } catch (error) {
              NotificationService.showError('Error', 'No se pudo cancelar la cita');
            }
          }
        }
      ]
    );
  };

  // Formatea la fecha a formato legible
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

  // Formatea la hora de la cita
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

  // Define color según el estado de la cita
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#4ade80'; // Verde pastel moderno
      case 'pending': return '#fbbf24'; // Amarillo pastel moderno
      case 'cancelled': return '#f87171'; // Rojo pastel moderno
      case 'completed': return '#3b82f6'; // Azul pastel moderno
      default: return Colors.textSecondary;
    }
  };

  // Texto del estado de la cita
  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed': return 'Confirmada';
      case 'pending': return 'Pendiente';
      case 'cancelled': return 'Cancelada';
      case 'completed': return 'Completada';
      default: return status;
    }
  };


  // Aplica el filtro actual a la lista de citas
  const getFilteredAppointments = () => {
    return appointments
      .filter(appointment => {
        switch (filter) {
          case 'pending': return appointment.status === 'pending';
          case 'cancelled': return appointment.status === 'cancelled';
          case 'completed': return appointment.status === 'completed';
          case 'confirmed': return appointment.status === 'confirmed';
          default: return true; // Todas
        }
      })
      // Ordena por fecha
      .sort((a, b) => new Date(a.appointment_date || a.date) - new Date(b.appointment_date || b.date));
  };

  // Renderiza una cita individual
  const renderAppointment = ({ item }) => {
    if (!item) return null;

    // Determina si se puede cancelar la cita
    const canCancel = item.status === 'confirmed' || item.status === 'pending';
    const appointmentDate = item.appointment_date || item.date;
    const parsedDate = appointmentDate ? new Date(appointmentDate) : null;
    const today = new Date();
    const isPast = parsedDate && parsedDate < today; // Verifica si ya pasó la cita

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
        {/* Información del doctor y estado */}
        <View style={[GlobalStyles.row, GlobalStyles.spaceBetween, { marginBottom: 12 }]}>
          <View style={{ flex: 1 }}>
            <Text style={[GlobalStyles.text, { fontWeight: '600', marginBottom: 4 }]}>
              Dr. {item.doctor?.name || 'Doctor'} {item.doctor?.surname || ''}
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

          {/* Estado visual de la cita */}
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

        {/* Notas adicionales */}
        {item.notes && (
          <View style={[GlobalStyles.backgroundPastelBlue, { padding: 12, borderRadius: 8, marginBottom: 12 }]}>
            <Text style={[GlobalStyles.textSmall, { fontStyle: 'italic' }]}>
              &quot;{item.notes}&quot;
            </Text>
          </View>
        )}

        {/* Botones según estado de la cita */}
        {item.status === 'pending' && !isPast && (
          <TouchableOpacity
            style={{
              backgroundColor: '#fef3c7',
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 12,
              alignItems: 'center',
              marginTop: 8,
              shadowColor: '#f59e0b',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 3,
              borderWidth: 1,
              borderColor: '#fde68a'
            }}
            onPress={() => cancelAppointment(item.id)}
          >
            <Ionicons name="close-circle" size={18} color="#d97706" style={{ marginBottom: 4 }} />
            <Text style={{
              color: '#d97706',
              fontWeight: '700',
              fontSize: 12,
              textTransform: 'uppercase',
              letterSpacing: 0.5
            }}>
              Cancelar cita
            </Text>
          </TouchableOpacity>
        )}

        {/* Estado: Confirmada - Sin botones */}
        {item.status === 'confirmed' && null}

        {/* Estado: Cancelada - Botón para eliminar */}
        {item.status === 'cancelled' && (
          <TouchableOpacity
            style={{
              backgroundColor: '#fee2e2',
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 12,
              alignItems: 'center',
              marginTop: 8,
              shadowColor: '#dc2626',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 3,
              borderWidth: 1,
              borderColor: '#fecaca'
            }}
            onPress={() => deleteAppointment(item.id)}
          >
            <Ionicons name="trash-outline" size={18} color="#dc2626" style={{ marginBottom: 4 }} />
            <Text style={{
              color: '#dc2626',
              fontWeight: '700',
              fontSize: 12,
              textTransform: 'uppercase',
              letterSpacing: 0.5
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

  // Estado cuando no hay citas
  const renderEmptyState = () => (
    <View style={[GlobalStyles.center, { paddingVertical: 40 }]}>
      <Ionicons name="calendar-outline" size={64} color={Colors.textLight} />
      <Text style={[GlobalStyles.text, { color: Colors.textLight, marginTop: 16, textAlign: 'center' }]}>
        {filter === 'all' && 'No tienes citas registradas'}
        {filter === 'pending' && 'No tienes citas pendientes'}
        {filter === 'cancelled' && 'No tienes citas canceladas'}
        {filter === 'completed' && 'No tienes citas completadas'}
        {filter === 'confirmed' && 'No tienes citas confirmadas'}
      </Text>
      {/* Botón para reservar si no hay citas */}
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

  // Muestra indicador de carga mientras obtiene datos
  if (isLoading) {
    return (
      <View style={[GlobalStyles.container, GlobalStyles.center]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Citas filtradas para mostrar en lista
  const filteredAppointments = getFilteredAppointments();

  return (
    <View style={GlobalStyles.container}>
      {/* Filtros superiores compactos */}
      <View style={[GlobalStyles.card, {
        marginBottom: 12,
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
        backgroundColor: '#ffffff',
        paddingVertical: 12,
        paddingHorizontal: 16
      }]}>
        <View style={[GlobalStyles.row, {
          justifyContent: 'space-around',
          flexWrap: 'wrap'
        }]}>
          {[
            { key: 'all', label: 'Todas', icon: 'list' },
            { key: 'pending', label: 'Pendientes', icon: 'time' },
            { key: 'confirmed', label: 'Confirmadas', icon: 'checkmark' },
            { key: 'cancelled', label: 'Canceladas', icon: 'close-circle' },
            { key: 'completed', label: 'Completadas', icon: 'checkmark-done' }
          ].map((filterOption) => (
            <TouchableOpacity
              key={filterOption.key}
              style={[
                GlobalStyles.center,
                {
                  paddingVertical: 6,
                  paddingHorizontal: 8,
                  borderRadius: 16,
                  backgroundColor: filter === filterOption.key ? Colors.primary : 'transparent',
                  minWidth: 60,
                  shadowColor: filter === filterOption.key ? Colors.primary : 'transparent',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: filter === filterOption.key ? 0.2 : 0,
                  shadowRadius: 2,
                  elevation: filter === filterOption.key ? 3 : 0
                }
              ]}
              onPress={() => setFilter(filterOption.key)} // Cambia el filtro
            >
              <Ionicons
                name={filterOption.icon}
                size={14}
                color={filter === filterOption.key ? '#ffffff' : Colors.textSecondary}
                style={{ marginBottom: 1 }}
              />
              <Text style={[
                GlobalStyles.textSmall,
                {
                  color: filter === filterOption.key ? '#ffffff' : Colors.textSecondary,
                  fontWeight: filter === filterOption.key ? '600' : '500',
                  fontSize: 10,
                  textAlign: 'center',
                  lineHeight: 12
                }
              ]}>
                {filterOption.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Lista de citas con scroll y refresco */}
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
