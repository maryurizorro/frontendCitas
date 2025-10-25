import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Colors } from '../../src/Components/Colors';
import { NotificationService } from '../../src/Components/NotificationService';
import { GlobalStyles } from '../../src/Components/Styles';
import { userAPI } from '../../src/Services/conexion';

// Componente principal para gestionar usuarios
export default function ManageUsers({ navigation }) {

  // Estados locales del componente
  const [users, setUsers] = useState([]); // Lista de usuarios
  const [isLoading, setIsLoading] = useState(true); // Indicador de carga inicial
  const [refreshing, setRefreshing] = useState(false); // Control del "pull to refresh"
  const [activeTab, setActiveTab] = useState('doctors'); // Pestaña activa

  // useEffect para cargar usuarios al montar el componente
  useEffect(() => {
    fetchUsers();
  }, []);

  // Función para obtener la lista de usuarios desde la API
  const fetchUsers = async () => {//Buscar
    try {
      const response = await userAPI.getUsers(); // Llamada al endpoint de usuarios
      if (response.data.success) {
        setUsers(response.data.data); // Guardamos los usuarios en el estado
      }
    } catch (error) {
      console.log('Error fetching users:', error);
      NotificationService.showError('Error', 'No se pudieron cargar los usuarios');
    } finally {
      setIsLoading(false); // Ocultamos el indicador de carga
    }
  };

  // Función para refrescar la lista con "pull to refresh"
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  };

  // Función para eliminar un usuario con confirmación
  const deleteUser = async (userId, userName) => {
    Alert.alert(
      'Eliminar usuario',
      `¿Estás seguro de que quieres eliminar a ${userName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await userAPI.deleteUser(userId); // Llamada para eliminar
              NotificationService.showSuccess('Usuario eliminado', 'El usuario ha sido eliminado exitosamente');
              fetchUsers(); // Recargamos la lista
            } catch (error) {
              NotificationService.showError('Error', 'No se pudo eliminar el usuario');
            }
          }
        }
      ]
    );
  };

  // Devuelve el color asociado al rol
  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return Colors.error;
      case 'doctor': return Colors.success;
      case 'patient': return Colors.primary;
      default: return Colors.textSecondary;
    }
  };

  // Devuelve el texto legible del rol
  const getRoleText = (role) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'doctor': return 'Doctor';
      case 'patient': return 'Paciente';
      default: return role;
    }
  };

  // Filtra usuarios según la pestaña activa
  const getFilteredUsers = () => {
    switch (activeTab) {
      case 'doctors':
        return users.filter(user => user.role === 'doctor');
      case 'patients':
        return users.filter(user => user.role === 'patient');
      case 'admins':
        return users.filter(user => user.role === 'admin');
      default:
        return users;
    }
  };


  // Muestra mensaje si no hay usuarios
  const renderEmptyState = () => (
    <View style={[GlobalStyles.center, { paddingVertical: 40 }]}>
      <Ionicons name="people-outline" size={64} color={Colors.textLight} />
      <Text style={[GlobalStyles.text, { color: Colors.textLight, marginTop: 16, textAlign: 'center' }]}>
        No hay usuarios registrados
      </Text>
    </View>
  );

  // Si está cargando, muestra spinner
  if (isLoading) {
    return (
      <View style={[GlobalStyles.container, GlobalStyles.center]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Filtramos usuarios según la pestaña activa
  const filteredUsers = getFilteredUsers();

  // Renderiza una tarjeta individual de usuario
  const renderUser = ({ item }) => (
    <View style={[
      GlobalStyles.card,
      {
        marginHorizontal: 16,
        marginVertical: 8,
        borderLeftWidth: 4,
        borderLeftColor: getRoleColor(item.role)
      }
    ]}>
      {/* Encabezado con nombre y rol */}
      <View style={[GlobalStyles.row, GlobalStyles.spaceBetween, { marginBottom: 12 }]}>
        <View style={{ flex: 1 }}>
          <Text style={[GlobalStyles.text, { fontWeight: '600', marginBottom: 4 }]}>
            {item.name} {item.surname}
          </Text>
          <Text style={[GlobalStyles.textSmall, { color: Colors.primary, marginBottom: 8 }]}>
            {item.email}
          </Text>
          {item.specialty && (
            <Text style={[GlobalStyles.textSmall, { color: Colors.textSecondary }]}>
              {item.specialty.name}
            </Text>
          )}
          {/* Información adicional según rol */}
          {item.role === 'doctor' && item.availability_text && (
            <Text style={[GlobalStyles.textSmall, { color: Colors.success, fontWeight: '600' }]}>
              {item.availability_text}
            </Text>
          )}
          {item.role === 'patient' && item.appointments_text && (
            <Text style={[GlobalStyles.textSmall, { color: Colors.info }]}>
              {item.appointments_text}
            </Text>
          )}
          {item.role === 'admin' && item.created_at_formatted && (
            <Text style={[GlobalStyles.textSmall, { color: Colors.textSecondary }]}>
              Creado: {item.created_at_formatted}
            </Text>
          )}
        </View>
        {/* Etiqueta con el rol */}
        <View style={{
          backgroundColor: getRoleColor(item.role),
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 16
        }}>
          <Text style={[GlobalStyles.textSmall, { color: 'white', fontWeight: '600' }]}>
            {getRoleText(item.role)}
          </Text>
        </View>
      </View>

      {/* Fecha y botón eliminar */}
      <View style={[GlobalStyles.row, { justifyContent: 'space-between' }]}>
        <View style={[GlobalStyles.row, { alignItems: 'center' }]}>
          <Ionicons name="calendar-outline" size={16} color={Colors.textSecondary} />
          <Text style={[GlobalStyles.textSmall, { marginLeft: 8 }]}>
            Registrado: {new Date(item.created_at).toLocaleDateString('es-ES')}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => deleteUser(item.id, `${item.name} ${item.surname}`)}
          style={{ padding: 8 }}
        >
          <Ionicons name="trash-outline" size={20} color={Colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render principal de la pantalla
  return (
    <View style={GlobalStyles.container}>
      {/* Encabezado */}
      <View style={[GlobalStyles.card, { marginBottom: 8 }]}>
        <View style={[GlobalStyles.row, { alignItems: 'center' }]}>
          <View>
            <Text style={[GlobalStyles.subtitle, { marginBottom: 4 }]}>
              Gestión de Usuarios
            </Text>
            <Text style={[GlobalStyles.textSmall, { color: Colors.textSecondary }]}>
              {users.length} usuarios registrados
            </Text>
          </View>
        </View>
      </View>

      {/* PESTAÑAS DE FILTRO */}
      <View style={[GlobalStyles.card, { marginBottom: 16, padding: 16 }]}>
        <View style={[GlobalStyles.row, { justifyContent: 'space-around' }]}>
          <TouchableOpacity
            style={[
              GlobalStyles.buttonPrimary,
              {
                flex: 1,
                marginHorizontal: 4,
                backgroundColor: activeTab === 'doctors' ? Colors.primary : '#e0e0e0',
                opacity: activeTab === 'doctors' ? 1 : 0.7
              }
            ]}
            onPress={() => setActiveTab('doctors')}
          >
            <Ionicons name="medical" size={20} color={activeTab === 'doctors' ? "#fff" : "#666"} />
            <Text style={[GlobalStyles.buttonText, { color: activeTab === 'doctors' ? "#fff" : "#666" }]}>
              Doctores
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              GlobalStyles.buttonPrimary,
              {
                flex: 1,
                marginHorizontal: 4,
                backgroundColor: activeTab === 'patients' ? Colors.primary : '#e0e0e0',
                opacity: activeTab === 'patients' ? 1 : 0.7
              }
            ]}
            onPress={() => setActiveTab('patients')}
          >
            <Ionicons name="people" size={20} color={activeTab === 'patients' ? "#fff" : "#666"} />
            <Text style={[GlobalStyles.buttonText, { color: activeTab === 'patients' ? "#fff" : "#666" }]}>
              Pacientes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              GlobalStyles.buttonPrimary,
              {
                flex: 1,
                marginHorizontal: 4,
                backgroundColor: activeTab === 'admins' ? Colors.primary : '#e0e0e0',
                opacity: activeTab === 'admins' ? 1 : 0.7
              }
            ]}
            onPress={() => setActiveTab('admins')}
          >
            <Ionicons name="shield" size={20} color={activeTab === 'admins' ? "#fff" : "#666"} />
            <Text style={[GlobalStyles.buttonText, { color: activeTab === 'admins' ? "#fff" : "#666" }]}>
              Admins
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Lista scrollable de usuarios */}
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Estado vacío */}
        {filteredUsers.length === 0 ? (
          renderEmptyState()
        ) : (
          // Lista de usuarios filtrados
          filteredUsers.map((user) => (
            <View key={user.id}>
              {renderUser({ item: user })}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

