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
import { useAuth } from '../../src/Context/AuthContext';

// Componente principal para gestionar las citas médicas
export default function ManageAppointments({ navigation }) {
  const { isAdmin } = useAuth();

  // Estados del componente
  const [appointments, setAppointments] = useState([]); // Lista de citas
  const [isLoading, setIsLoading] = useState(true); // Indicador de carga inicial
  const [refreshing, setRefreshing] = useState(false); // Indicador para recargar la lista
  const [filter, setFilter] = useState('all'); // Filtro activo (todas, hoy, pendientes, etc.)
  const [accessDenied, setAccessDenied] = useState(false); // Estado para acceso denegado

  // Se ejecuta al montar el componente
  useEffect(() => {
    if (isAdmin()) {
      fetchAppointments();
    } else {
      setAccessDenied(true);
      setIsLoading(false);
      NotificationService.showError('Acceso denegado', 'No tienes permisos para acceder a esta función.');
    }
  }, []);

  // Función para obtener las citas desde la API
  const fetchAppointments = async () => {
    try {
      const response = await appointmentAPI.getAppointments(); // Llamada al servicio
      if (response.data.success) {
        setAppointments(response.data.data || []); // Guarda las citas en el estado
      }
    } catch (error) {
      console.log('Error fetching appointments:', error);
      NotificationService.showError('Error', 'No se pudieron cargar las citas');
    } finally {
      setIsLoading(false); // Desactiva el indicador de carga
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAppointments();
    setRefreshing(false);
  };

  // Cambia el estado de una cita (confirmar, cancelar, etc.)
  const updateAppointmentStatus = async (appointmentId, newStatus) => {
    try {
      await appointmentAPI.updateAppointment(appointmentId, { status: newStatus });
      NotificationService.showSuccess('Estado actualizado', 'El estado de la cita ha sido actualizado');
      // Actualizar el estado local sin recargar
      setAppointments(prevAppointments =>
        prevAppointments.map(apt =>
          apt.id === appointmentId ? { ...apt, status: newStatus } : apt
        )
      );
    } catch (error) {
      NotificationService.showError('Error', 'No se pudo actualizar el estado');
    }
  };

  // Elimina una cita tras confirmación del usuario
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

  // Formatea la fecha en un formato legible
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

  // Devuelve el color correspondiente según el estado de la cita (tonos pastel modernos)
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#4ade80'; // Verde pastel moderno
      case 'pending': return '#fbbf24'; // Amarillo pastel moderno
      case 'cancelled': return '#f87171'; // Rojo pastel moderno
      case 'completed': return '#3b82f6'; // Azul pastel moderno
      default: return Colors.textSecondary;
    }
  };

  // Devuelve el texto legible para cada estado
  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed': return 'Confirmada';
      case 'pending': return 'Pendiente';
      case 'cancelled': return 'Cancelada';
      case 'completed': return 'Completada';
      default: return status;
    }
  };

  // Filtra las citas según el filtro activo
  const getFilteredAppointments = () => {
    if (!Array.isArray(appointments)) return [];

    const today = new Date().toISOString().split('T')[0]; // Fecha actual

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
        case 'completed':
          return appointment.status === 'completed';
        default:
          return true;
      }
    }).sort((a, b) => {
      // Ordena las citas por fecha
      const dateA = a.appointment_date || a.date;
      const dateB = b.appointment_date || b.date;
      return new Date(dateA || 0) - new Date(dateB || 0);
    });
  };

  // Renderiza cada cita en la lista con diseño moderno
  const renderAppointment = ({ item }) => {
    if (!item) return null;

    return (
      <View style={[
        GlobalStyles.card,
        {
          marginHorizontal: 16,
          marginVertical: 12,
          borderRadius: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.15,
          shadowRadius: 15,
          elevation: 8,
          backgroundColor: '#ffffff',
          borderWidth: 0,
          padding: 20
        }
      ]}>
        {/* Información principal del paciente y médico */}
        <View style={[GlobalStyles.row, GlobalStyles.spaceBetween, { marginBottom: 16 }]}>
          <View style={{ flex: 1 }}>
            <Text style={[GlobalStyles.text, {
              fontWeight: '700',
              fontSize: 18,
              color: '#2d3748',
              marginBottom: 6
            }]}>
              {item.patient?.name || 'Paciente'} {item.patient?.surname || ''}
            </Text>
            <Text style={[GlobalStyles.textSmall, {
              color: Colors.primary,
              fontWeight: '600',
              fontSize: 15,
              marginBottom: 8
            }]}>
              Dr. {item.doctor?.name || 'Doctor'} {item.doctor?.surname || ''}
            </Text>
            <Text style={[GlobalStyles.textSmall, {
              color: '#718096',
              fontSize: 14,
              backgroundColor: '#f7fafc',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 12,
              alignSelf: 'flex-start'
            }]}>
              {item.specialty?.name || 'Especialidad no especificada'}
              {item.specialty?.description && (
                <Text style={[GlobalStyles.textSmall, {
                  color: '#a0aec0',
                  fontSize: 12,
                  marginTop: 2,
                  fontStyle: 'italic'
                }]}>
                  {item.specialty.description}
                </Text>
              )}
            </Text>
          </View>

          {/* Estado visual moderno */}
          <View style={{
            backgroundColor: getStatusColor(item.status || 'pending'),
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 20,
            shadowColor: getStatusColor(item.status || 'pending'),
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 4
          }}>
            <Text style={[GlobalStyles.textSmall, {
              color: '#ffffff',
              fontWeight: '700',
              fontSize: 12,
              textTransform: 'uppercase',
              letterSpacing: 0.5
            }]}>
              {getStatusText(item.status || 'pending')}
            </Text>
          </View>
        </View>

        {/* Fecha y hora con diseño mejorado */}
        <View style={[GlobalStyles.row, {
          marginBottom: 16,
          backgroundColor: '#f8fafc',
          padding: 12,
          borderRadius: 12
        }]}>
          <View style={[GlobalStyles.row, { flex: 1, alignItems: 'center' }]}>
            <View style={{
              backgroundColor: '#e2e8f0',
              borderRadius: 8,
              padding: 6,
              marginRight: 10
            }}>
              <Ionicons name="calendar-outline" size={18} color="#4a5568" />
            </View>
            <Text style={[GlobalStyles.textSmall, {
              fontWeight: '600',
              color: '#2d3748',
              fontSize: 14
            }]}>
              {formatDate(item.appointment_date || item.date)}
            </Text>
          </View>
          <View style={[GlobalStyles.row, { alignItems: 'center' }]}>
            <View style={{
              backgroundColor: '#e2e8f0',
              borderRadius: 8,
              padding: 6,
              marginRight: 10
            }}>
              <Ionicons name="time-outline" size={18} color="#4a5568" />
            </View>
            <Text style={[GlobalStyles.textSmall, {
              fontWeight: '600',
              color: '#2d3748',
              fontSize: 14
            }]}>
              {formatTime(item.appointment_date || item.date)}
            </Text>
          </View>
        </View>

        {/* Notas de la cita (si existen) */}
        {item.notes && (
          <View style={[GlobalStyles.backgroundPastelBlue, { padding: 12, borderRadius: 8, marginBottom: 12 }]}>
            <Text style={[GlobalStyles.textSmall, { fontStyle: 'italic' }]}>
              &quot;{item.notes}&quot;
            </Text>
          </View>
        )}

        {/* Botones de acción según estado */}
        <View style={[GlobalStyles.row, {
          justifyContent: 'space-around',
          gap: 8
        }]}>
          {/* Estado: Pendiente - Solo Confirmar y Cancelar */}
          {item.status === 'pending' && (
            <>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: '#d1fae5',
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  alignItems: 'center',
                  shadowColor: '#10b981',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 3,
                  borderWidth: 1,
                  borderColor: '#a7f3d0'
                }}
                onPress={() => updateAppointmentStatus(item.id, 'confirmed')}
              >
                <Ionicons name="checkmark-circle" size={18} color="#059669" style={{ marginBottom: 4 }} />
                <Text style={{
                  color: '#059669',
                  fontWeight: '700',
                  fontSize: 12,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5
                }}>
                  Confirmar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: '#fef3c7',
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  alignItems: 'center',
                  shadowColor: '#f59e0b',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 3,
                  borderWidth: 1,
                  borderColor: '#fde68a'
                }}
                onPress={() => updateAppointmentStatus(item.id, 'cancelled')}
              >
                <Ionicons name="close-circle" size={18} color="#d97706" style={{ marginBottom: 4 }} />
                <Text style={{
                  color: '#d97706',
                  fontWeight: '700',
                  fontSize: 12,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5
                }}>
                  Cancelar
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* Estado: Confirmada - Solo Cancelar */}
          {item.status === 'confirmed' && (
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: '#fef3c7',
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 12,
                alignItems: 'center',
                shadowColor: '#f59e0b',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 3,
                borderWidth: 1,
                borderColor: '#fde68a'
              }}
              onPress={() => updateAppointmentStatus(item.id, 'cancelled')}
            >
              <Ionicons name="close-circle" size={18} color="#d97706" style={{ marginBottom: 4 }} />
              <Text style={{
                color: '#d97706',
                fontWeight: '700',
                fontSize: 12,
                textTransform: 'uppercase',
                letterSpacing: 0.5
              }}>
                Cancelar
              </Text>
            </TouchableOpacity>
          )}

          {/* Estado: Cancelada - Solo Eliminar */}
          {item.status === 'cancelled' && (
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: '#fee2e2',
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 12,
                alignItems: 'center',
                shadowColor: '#ef4444',
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
                Eliminar
              </Text>
            </TouchableOpacity>
          )}

          {/* Estado: Completada - Sin botones (solo estado visible) */}
          {item.status === 'completed' && null}
        </View>
      </View>
    );
  };

  // Renderiza el mensaje cuando no hay citas
  const renderEmptyState = () => (
    <View style={[GlobalStyles.center, { paddingVertical: 40 }]}>
      <Ionicons name="calendar-outline" size={64} color={Colors.textLight} />
      <Text style={[GlobalStyles.text, { color: Colors.textLight, marginTop: 16, textAlign: 'center' }]}>
        No hay citas registradas
      </Text>
    </View>
  );

  // Si acceso denegado, muestra mensaje
  if (accessDenied) {
    return (
      <View style={[GlobalStyles.container, GlobalStyles.center]}>
        <Ionicons name="shield-outline" size={64} color={Colors.error} />
        <Text style={[GlobalStyles.text, { color: Colors.error, marginTop: 16, textAlign: 'center' }]}>
          Acceso denegado
        </Text>
        <Text style={[GlobalStyles.textSmall, { color: Colors.textSecondary, textAlign: 'center' }]}>
          No tienes permisos para gestionar citas.
        </Text>
      </View>
    );
  }

  // Muestra indicador de carga al iniciar
  if (isLoading) {
    return (
      <View style={[GlobalStyles.container, GlobalStyles.center]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Aplica los filtros
  const filteredAppointments = getFilteredAppointments();

  return (
    <View style={[GlobalStyles.container, { backgroundColor: '#f8f9fa' }]}>
      {/* Sección de filtros compactos */}
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
            { key: 'today', label: 'Hoy', icon: 'today' },
            { key: 'pending', label: 'Pendientes', icon: 'time' },
            { key: 'confirmed', label: 'Confirmadas', icon: 'checkmark' },
            { key: 'cancelled', label: 'Canceladas', icon: 'close' },
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
              onPress={() => setFilter(filterOption.key)}
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

      {/* Lista de citas con scroll */}
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
