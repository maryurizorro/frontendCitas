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

export default function ManageUsers({ navigation }) {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await userAPI.getUsers();
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (error) {
      console.log('Error fetching users:', error);
      NotificationService.showError('Error', 'No se pudieron cargar los usuarios');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  };

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
              await userAPI.deleteUser(userId);
              NotificationService.showSuccess('Usuario eliminado', 'El usuario ha sido eliminado exitosamente');
              fetchUsers();
            } catch (error) {
              NotificationService.showError('Error', 'No se pudo eliminar el usuario');
            }
          }
        }
      ]
    );
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return Colors.error;
      case 'doctor': return Colors.success;
      case 'patient': return Colors.primary;
      default: return Colors.textSecondary;
    }
  };

  const getRoleText = (role) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'doctor': return 'Doctor';
      case 'patient': return 'Paciente';
      default: return role;
    }
  };

  const getGroupedUsers = () => {
    const doctors = users.filter(user => user.role === 'doctor');

    return { doctors };
  };

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
        </View>
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

  const renderEmptyState = () => (
    <View style={[GlobalStyles.center, { paddingVertical: 40 }]}>
      <Ionicons name="people-outline" size={64} color={Colors.textLight} />
      <Text style={[GlobalStyles.text, { color: Colors.textLight, marginTop: 16, textAlign: 'center' }]}>
        No hay usuarios registrados
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

  const { doctors } = getGroupedUsers();

  const renderUserSection = (title, userList, iconName) => (
    <View style={{ marginBottom: 24 }}>
      <View style={[GlobalStyles.row, { alignItems: 'center', marginBottom: 12, marginHorizontal: 16 }]}>
        <Ionicons name={iconName} size={24} color={Colors.primary} style={{ marginRight: 8 }} />
        <Text style={[GlobalStyles.subtitle, { color: Colors.primary }]}>
          {title} ({userList.length})
        </Text>
      </View>

      {userList.length === 0 ? (
        <View style={[GlobalStyles.card, { marginHorizontal: 16 }]}>
          <Text style={[GlobalStyles.text, { color: Colors.textLight, textAlign: 'center', paddingVertical: 20 }]}>
            No hay {title.toLowerCase()} registrados
          </Text>
        </View>
      ) : (
        userList.filter(user => user && user.id).map((user) => (
          <View key={user.id} style={[
            GlobalStyles.card,
            {
              marginHorizontal: 16,
              marginVertical: 4,
              borderLeftWidth: 4,
              borderLeftColor: getRoleColor(user.role || 'patient')
            }
          ]}>
            <View style={[GlobalStyles.row, GlobalStyles.spaceBetween, { marginBottom: 12 }]}>
              <View style={{ flex: 1 }}>
                <Text style={[GlobalStyles.text, { fontWeight: '600', marginBottom: 4 }]}>
                  {user.name || 'Sin nombre'} {user.surname || 'Sin apellido'}
                </Text>
                <Text style={[GlobalStyles.textSmall, { color: Colors.primary, marginBottom: 4 }]}>
                  {user.email || 'Sin email'}
                </Text>
                {showPasswords && (
                  <Text style={[GlobalStyles.textSmall, { color: Colors.error, marginBottom: 4, fontFamily: 'monospace' }]}>
                    Contraseña: {user.password || '••••••••'}
                  </Text>
                )}
                {user.specialty && user.specialty.name && (
                  <Text style={[GlobalStyles.textSmall, { color: Colors.textSecondary }]}>
                    {user.specialty.name}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => deleteUser(user.id, `${user.name || 'Usuario'} ${user.surname || ''}`)}
                style={{ padding: 8 }}
              >
                <Ionicons name="trash-outline" size={20} color={Colors.error} />
              </TouchableOpacity>
            </View>

            <View style={[GlobalStyles.row, { alignItems: 'center' }]}>
              <Ionicons name="calendar-outline" size={16} color={Colors.textSecondary} />
              <Text style={[GlobalStyles.textSmall, { marginLeft: 8 }]}>
                Registrado: {user.created_at ? new Date(user.created_at).toLocaleDateString('es-ES') : 'Fecha no disponible'}
              </Text>
            </View>
          </View>
        ))
      )}
    </View>
  );

  return (
    <View style={GlobalStyles.container}>
      {/* Header with password toggle */}
      <View style={[GlobalStyles.card, { marginBottom: 8 }]}>
        <View style={[GlobalStyles.row, GlobalStyles.spaceBetween, { alignItems: 'center' }]}>
          <View>
            <Text style={[GlobalStyles.subtitle, { marginBottom: 4 }]}>
              Gestión de Usuarios
            </Text>
            <Text style={[GlobalStyles.textSmall, { color: Colors.textSecondary }]}>
              {users.length} usuarios registrados
            </Text>
          </View>
          <TouchableOpacity
            style={[GlobalStyles.row, { alignItems: 'center', padding: 8, borderRadius: 8, backgroundColor: showPasswords ? Colors.error : Colors.primary }]}
            onPress={() => {
              if (!showPasswords) {
                Alert.alert(
                  'Advertencia de Seguridad',
                  'Mostrar contraseñas en texto plano es un riesgo de seguridad. ¿Está seguro de que desea continuar?',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Mostrar', style: 'destructive', onPress: () => setShowPasswords(true) }
                  ]
                );
              } else {
                setShowPasswords(false);
              }
            }}
          >
            <Ionicons
              name={showPasswords ? "eye-off" : "eye"}
              size={16}
              color="white"
              style={{ marginRight: 4 }}
            />
            <Text style={[GlobalStyles.textSmall, { color: 'white', fontWeight: '600' }]}>
              {showPasswords ? 'Ocultar' : 'Ver'} Contraseñas
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {renderUserSection('Doctores', doctors, 'medical')}
      </ScrollView>
    </View>
  );
}
