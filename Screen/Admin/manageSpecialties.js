import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { Colors } from '../../src/Components/Colors';
import { NotificationService } from '../../src/Components/NotificationService';
import { GlobalStyles } from '../../src/Components/Styles';
import { specialtyAPI } from '../../src/Services/conexion';
import { useAuth } from '../../src/Context/AuthContext';

// Componente principal que gestiona las especialidades médicas
export default function ManageSpecialties({ navigation }) {
  const { isAdmin } = useAuth();

  // 🔹 Estados del componente
  const [specialties, setSpecialties] = useState([]); // Lista de especialidades
  const [isLoading, setIsLoading] = useState(true); // Controla el indicador de carga
  const [refreshing, setRefreshing] = useState(false); // Controla el "pull to refresh"
  const [showAddForm, setShowAddForm] = useState(false); // Muestra/oculta el formulario de agregar
  const [newSpecialtyName, setNewSpecialtyName] = useState(''); // Nombre de nueva especialidad
  const [newSpecialtyDescription, setNewSpecialtyDescription] = useState(''); // Descripción
  const [isSubmitting, setIsSubmitting] = useState(false); // Controla el botón mientras se envía
  const [accessDenied, setAccessDenied] = useState(false); // Estado para acceso denegado

  //  useEffect para cargar las especialidades al iniciar la pantalla
  useEffect(() => {
    if (isAdmin()) {
      fetchSpecialties();
    } else {
      setAccessDenied(true);
      setIsLoading(false);
      NotificationService.showError('Acceso denegado', 'No tienes permisos para acceder a esta función.');
    }
  }, []);

  //  Función para obtener la lista de especialidades desde el backend
  const fetchSpecialties = async () => {
    try {
      const response = await specialtyAPI.getSpecialties();
      if (response.data.success) {
        setSpecialties(response.data.data || []);
      }
    } catch (error) {
      console.log('Error fetching specialties:', error);
      NotificationService.showError('Error', 'No se pudieron cargar las especialidades');
    } finally {
      setIsLoading(false);
    }
  };

  //  Recarga de datos manual (pull to refresh)
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSpecialties();
    setRefreshing(false);
  };

  //  Agregar una nueva especialidad
  const addSpecialty = async () => {
    // Validar que el nombre no esté vacío
    if (!newSpecialtyName.trim()) {
      NotificationService.showError('Error', 'Por favor ingresa el nombre de la especialidad');
      return;
    }

    setIsSubmitting(true); // Bloquea el botón mientras se guarda
    try {
      const specialtyData = {
        name: newSpecialtyName.trim(),
        description: newSpecialtyDescription.trim() || null
      };

      const response = await specialtyAPI.createSpecialty(specialtyData);

      if (response.data.success) {
        // Actualiza la lista local con la nueva especialidad
        setSpecialties(prev => [...prev, response.data.data]);
        // Limpia los campos
        setNewSpecialtyName('');
        setNewSpecialtyDescription('');
        setShowAddForm(false);
        // Muestra notificación de éxito
        NotificationService.showSuccess('Especialidad creada', 'La especialidad ha sido agregada exitosamente');
        // Recarga la lista para mantener la consistencia
        fetchSpecialties();
      } else {
        NotificationService.showError('Error', response.data.message || 'No se pudo crear la especialidad');
      }
    } catch (error) {
      console.log('Error creating specialty:', error);
      const errorMessage = error.response?.data?.message || 'No se pudo crear la especialidad';
      NotificationService.showError('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  //  Eliminar una especialidad con confirmación
  const deleteSpecialty = async (specialtyId, specialtyName) => {
    Alert.alert(
      'Eliminar especialidad',
      `¿Estás seguro de que quieres eliminar la especialidad "${specialtyName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await specialtyAPI.deleteSpecialty(specialtyId);
              if (response.data.success) {
                // Elimina de la lista local
                setSpecialties(prev => prev.filter(s => s.id !== specialtyId));
                NotificationService.showSuccess('Especialidad eliminada', 'La especialidad ha sido eliminada exitosamente');
              } else {
                NotificationService.showError('Error', response.data.message || 'No se pudo eliminar la especialidad');
              }
            } catch (error) {
              console.log('Error deleting specialty:', error);
              NotificationService.showError('Error', 'No se pudo eliminar la especialidad');
            }
          }
        }
      ]
    );
  };

  //  Renderiza cada tarjeta de especialidad
  const renderSpecialty = ({ item }) => (
    <View style={[
      GlobalStyles.card,
      { 
        marginHorizontal: 16,
        marginVertical: 8,
        borderLeftWidth: 4,
        borderLeftColor: Colors.primary
      }
    ]}>
      {/* Encabezado con nombre y botón de eliminar */}
      <View style={[GlobalStyles.row, GlobalStyles.spaceBetween, { marginBottom: 12 }]}>
        <View style={{ flex: 1 }}>
          <Text style={[GlobalStyles.text, { fontWeight: '600', marginBottom: 4 }]}>
            {item.name}
          </Text>
          {item.description && (
            <Text style={[GlobalStyles.textSmall, { color: Colors.textSecondary }]}>
              {item.description}
            </Text>
          )}
        </View>
        <TouchableOpacity
          onPress={() => deleteSpecialty(item.id, item.name)}
          style={{ padding: 8 }}
        >
          <Ionicons name="trash-outline" size={20} color={Colors.error} />
        </TouchableOpacity>
      </View>

      {/* Fecha de creación */}
      <View style={[GlobalStyles.row, { alignItems: 'center' }]}>
        <Ionicons name="calendar-outline" size={16} color={Colors.textSecondary} />
        <Text style={[GlobalStyles.textSmall, { marginLeft: 8 }]}>
          Creada: {new Date(item.created_at).toLocaleDateString('es-ES')}
        </Text>
      </View>
    </View>
  );

  //  Formulario para agregar una nueva especialidad
  const renderAddForm = () => (
    <View style={[GlobalStyles.card, { marginHorizontal: 16, marginVertical: 8 }]}>
      <Text style={[GlobalStyles.subtitle, { marginBottom: 16 }]}>
        Agregar nueva especialidad
      </Text>
      
      {/* Campo de nombre */}
      <View style={{ marginBottom: 16 }}>
        <Text style={[GlobalStyles.textSmall, { marginBottom: 8, fontWeight: '600' }]}>
          Nombre de la especialidad *
        </Text>
        <TextInput
          placeholder="Ej: Cardiología"
          value={newSpecialtyName}
          onChangeText={setNewSpecialtyName}
          style={GlobalStyles.input}
          placeholderTextColor={Colors.textLight}
        />
      </View>

      {/* Campo de descripción */}
      <View style={{ marginBottom: 20 }}>
        <Text style={[GlobalStyles.textSmall, { marginBottom: 8, fontWeight: '600' }]}>
          Descripción (opcional)
        </Text>
        <TextInput
          placeholder="Descripción de la especialidad..."
          value={newSpecialtyDescription}
          onChangeText={setNewSpecialtyDescription}
          multiline
          numberOfLines={3}
          style={[GlobalStyles.input, { height: 80, textAlignVertical: 'top' }]}
          placeholderTextColor={Colors.textLight}
        />
      </View>

      {/* Botones de acción */}
      <View style={[GlobalStyles.row, { justifyContent: 'space-between' }]}>
        <TouchableOpacity
          style={[GlobalStyles.buttonSecondary, { flex: 1, marginRight: 8 }]}
          onPress={() => {
            setShowAddForm(false);
            setNewSpecialtyName('');
            setNewSpecialtyDescription('');
          }}
        >
          <Text style={GlobalStyles.buttonTextSecondary}>
            Cancelar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[GlobalStyles.buttonPrimary, { flex: 1, marginLeft: 8, opacity: isSubmitting ? 0.7 : 1 }]}
          onPress={addSpecialty}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={Colors.backgroundCard} />
          ) : (
            <Text style={GlobalStyles.buttonText}>
              Agregar
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  // Estado vacío (cuando no hay especialidades)
  const renderEmptyState = () => (
    <View style={[GlobalStyles.center, { paddingVertical: 40 }]}>
      <Ionicons name="medical-outline" size={64} color={Colors.textLight} />
      <Text style={[GlobalStyles.text, { color: Colors.textLight, marginTop: 16, textAlign: 'center' }]}>
        No hay especialidades registradas
      </Text>
      <TouchableOpacity 
        style={[GlobalStyles.buttonPrimary, { marginTop: 16 }]}
        onPress={() => setShowAddForm(true)}
      >
        <Text style={GlobalStyles.buttonText}>
          Agregar primera especialidad
        </Text>
      </TouchableOpacity>
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
          No tienes permisos para gestionar especialidades.
        </Text>
      </View>
    );
  }

  // Muestra un indicador de carga mientras se obtienen las especialidades
  if (isLoading) {
    return (
      <View style={[GlobalStyles.container, GlobalStyles.center]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Estructura principal del componente
  return (
    <View style={GlobalStyles.container}>
      {/* Header con título y botón para mostrar/ocultar formulario */}
      <View style={[GlobalStyles.card, { marginBottom: 8 }]}>
        <View style={[GlobalStyles.row, GlobalStyles.spaceBetween, { alignItems: 'center' }]}>
          <Text style={GlobalStyles.subtitle}>
            Especialidades médicas
          </Text>
          <TouchableOpacity
            onPress={() => setShowAddForm(!showAddForm)}
            style={{
              backgroundColor: Colors.primary,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20
            }}
          >
            <Text style={[GlobalStyles.textSmall, { color: 'white', fontWeight: '600' }]}>
              {showAddForm ? 'Cancelar' : 'Agregar'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Formulario de agregar nueva especialidad */}
      {showAddForm && renderAddForm()}

      {/* Lista de especialidades existentes */}
      <FlatList
        data={specialties}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderSpecialty}
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
