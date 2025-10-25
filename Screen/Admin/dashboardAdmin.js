"use client" // Indica que este componente se ejecuta en el lado del cliente (React Native + Expo).

import { Ionicons } from "@expo/vector-icons"
import { useState, useEffect } from "react"
import { ScrollView, Text, TouchableOpacity, View, ActivityIndicator } from "react-native"
import { Colors } from "../../src/Components/Colors"
import { GlobalStyles } from "../../src/Components/Styles"
import { useAuth } from "../../src/Context/AuthContext"
import { userAPI } from "../../src/Services/conexion"

export default function DashboardAdmin({ navigation }) {
  // Extrae el usuario autenticado del contexto
  const { user: authUser } = useAuth()

  // Estados locales
  const [user, setUser] = useState(null) // Almacena los datos del perfil del usuario
  const [refreshing, setRefreshing] = useState(false) // Controla el estado de recarga manual
  const [adminCount, setAdminCount] = useState(0) // Contador de administradores
  const [doctorCount, setDoctorCount] = useState(0) // Contador de doctores
  const [patientCount, setPatientCount] = useState(0) // Contador de pacientes
  const [isLoadingProfile, setIsLoadingProfile] = useState(true) // Controla la carga del perfil
  const [activeTab, setActiveTab] = useState('overview') // Controla la pestaña activa

  // useEffect para cargar datos al iniciar
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Solicita al backend los datos del perfil del usuario autenticado
        const response = await userAPI.getProfile()
        if (response.data.success) {
          setUser(response.data.data) // Guarda el perfil obtenido
        }
      } catch (error) {
        console.log('Error fetching profile:', error)
        setUser(authUser) // Si falla, usa los datos del contexto
      } finally {
        setIsLoadingProfile(false) // Termina el estado de carga
      }
    }

    // Solo ejecuta si hay un usuario autenticado
    if (authUser) {
      fetchProfile()
    }

    // También obtiene los contadores de usuarios por rol
    fetchUserCounts()
  }, [authUser])

  // Función para contar los usuarios por rol
  const fetchUserCounts = async () => {
    try {
      // Obtener contadores para cada rol
      const [adminResponse, doctorResponse, patientResponse] = await Promise.all([
        userAPI.getUsers({ role: 'admin' }),
        userAPI.getUsers({ role: 'doctor' }),
        userAPI.getUsers({ role: 'patient' })
      ])

      if (adminResponse.data.success) {
        setAdminCount(adminResponse.data.data.length)
      }
      if (doctorResponse.data.success) {
        setDoctorCount(doctorResponse.data.data.length)
      }
      if (patientResponse.data.success) {
        setPatientCount(patientResponse.data.data.length)
      }
    } catch (error) {
      console.log('Error fetching user counts:', error)
    }
  }

  // Permite actualizar la información al arrastrar hacia abajo
  const onRefresh = () => {
    setRefreshing(!refreshing)
    fetchUserCounts()
  }

  // Muestra un indicador mientras se cargan los datos del perfil
  if (isLoadingProfile) {
    return (
      <View style={[GlobalStyles.container, GlobalStyles.center]}>
        <ActivityIndicator size="large" color="#1a237e" />
        <Text style={[GlobalStyles.text, { marginTop: 16 }]}>
          Cargando panel de administración...
        </Text>
      </View>
    )
  }

  // Traduce los roles del sistema a texto legible
  const getRoleText = (role) => {
    switch (role) {
      case 'admin': return 'Administrador'
      case 'doctor': return 'Doctor'
      case 'patient': return 'Paciente'
      default: return role
    }
  }

  // Render principal del dashboard
  return (
    <ScrollView
      style={[GlobalStyles.container, { backgroundColor: "#f0f2f5" }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ENCABEZADO DE BIENVENIDA */}
      <View
        style={[
          GlobalStyles.card,
          { backgroundColor: "#1a237e", marginBottom: 20, padding: 20, borderRadius: 16 },
        ]}
      >
        <View style={[GlobalStyles.row, GlobalStyles.spaceBetween]}>
          <View style={{ flex: 1 }}>
            <Text style={[GlobalStyles.subtitle, { color: "#fff", fontSize: 22 }]}>
              ¡Hola, {user?.name} {user?.surname}!
            </Text>
            <Text style={[GlobalStyles.subtitle, { color: "#ff6b6b", fontSize: 18, marginTop: 4 }]}>
              {getRoleText(user?.role)}
            </Text>
            <Text style={[GlobalStyles.text, { color: "#c5cae9", marginTop: 4 }]}>
              Bienvenido al panel de administración
            </Text>
          </View>
          <View
            style={[
              { width: 70, height: 70, borderRadius: 35, backgroundColor: "#283593" },
              GlobalStyles.center,
            ]}
          >
            <Ionicons name="shield-checkmark" size={36} color="#fff" />
          </View>
        </View>
      </View>

      {/* PESTAÑAS DE USUARIOS */}
      <View style={[GlobalStyles.card, { marginBottom: 20, borderRadius: 16, padding: 16 }]}>
        <Text style={[GlobalStyles.subtitle, { marginBottom: 16, fontSize: 18 }]}>Gestión de Usuarios</Text>

        {/* Botones de pestañas */}
        <View style={[GlobalStyles.row, { marginBottom: 16 }]}>
          <TouchableOpacity
            style={[
              GlobalStyles.buttonPrimary,
              {
                flex: 1,
                marginRight: 8,
                backgroundColor: activeTab === 'doctors' ? "#2e7d32" : "#e0e0e0",
                opacity: activeTab === 'doctors' ? 1 : 0.7
              }
            ]}
            onPress={() => setActiveTab('doctors')}
          >
            <Ionicons name="medical" size={20} color={activeTab === 'doctors' ? "#fff" : "#666"} />
            <Text style={[GlobalStyles.buttonText, { color: activeTab === 'doctors' ? "#fff" : "#666" }]}>
              Doctores ({doctorCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              GlobalStyles.buttonPrimary,
              {
                flex: 1,
                marginRight: 8,
                backgroundColor: activeTab === 'patients' ? "#1976d2" : "#e0e0e0",
                opacity: activeTab === 'patients' ? 1 : 0.7
              }
            ]}
            onPress={() => setActiveTab('patients')}
          >
            <Ionicons name="people" size={20} color={activeTab === 'patients' ? "#fff" : "#666"} />
            <Text style={[GlobalStyles.buttonText, { color: activeTab === 'patients' ? "#fff" : "#666" }]}>
              Pacientes ({patientCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              GlobalStyles.buttonPrimary,
              {
                flex: 1,
                backgroundColor: activeTab === 'admins' ? "#dc1313ff" : "#e0e0e0",
                opacity: activeTab === 'admins' ? 1 : 0.7
              }
            ]}
            onPress={() => setActiveTab('admins')}
          >
            <Ionicons name="shield" size={20} color={activeTab === 'admins' ? "#fff" : "#666"} />
            <Text style={[GlobalStyles.buttonText, { color: activeTab === 'admins' ? "#fff" : "#666" }]}>
              Admins ({adminCount})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Contenido de las pestañas */}
        {activeTab === 'doctors' && (
          <View>
            <Text style={[GlobalStyles.textSmallBold, { marginBottom: 12 }]}>👨‍⚕️ Doctores Registrados</Text>
            <TouchableOpacity
              style={[GlobalStyles.buttonPrimary, { backgroundColor: "#2e7d32" }]}
              onPress={() => navigation.navigate("Users", { role: 'doctor' })}
            >
              <Text style={GlobalStyles.buttonText}>Ver Todos los Doctores</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'patients' && (
          <View>
            <Text style={[GlobalStyles.textSmallBold, { marginBottom: 12 }]}>🧍‍♀️ Pacientes Registrados</Text>
            <TouchableOpacity
              style={[GlobalStyles.buttonPrimary, { backgroundColor: "#1976d2" }]}
              onPress={() => navigation.navigate("Users", { role: 'patient' })}
            >
              <Text style={GlobalStyles.buttonText}>Ver Todos los Pacientes</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'admins' && (
          <View>
            <Text style={[GlobalStyles.textSmallBold, { marginBottom: 12 }]}>🧑‍💼 Administradores Registrados</Text>
            <TouchableOpacity
              style={[GlobalStyles.buttonPrimary, { backgroundColor: "#dc1313ff" }]}
              onPress={() => navigation.navigate("Users", { role: 'admin' })}
            >
              <Text style={GlobalStyles.buttonText}>Ver Todos los Administradores</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ACCIONES RÁPIDAS */}
      <View style={[GlobalStyles.card, { marginBottom: 20, borderRadius: 16, padding: 16 }]}>
        <Text style={[GlobalStyles.subtitle, { marginBottom: 16, fontSize: 18 }]}>Acciones rápidas</Text>

        {/* Botones principales del panel */}
        <View style={[GlobalStyles.row, { justifyContent: "space-between", marginBottom: 16 }]}>
          {/* Botón de Usuarios */}
          <TouchableOpacity
            style={[GlobalStyles.dashboardButton, { backgroundColor: "#3949ab" }]}
            onPress={() => navigation.navigate("Users")}
          >
            <Ionicons name="people" size={28} color="#fff" />
            <Text style={[GlobalStyles.textSmallBold, { color: "#fff" }]}>Usuarios</Text>
          </TouchableOpacity>

          {/* Botón de Citas */}
          <TouchableOpacity
            style={[GlobalStyles.dashboardButton, { backgroundColor: "#00796b" }]}
            onPress={() => navigation.navigate("Appointments")}
          >
            <Ionicons name="calendar" size={28} color="#fff" />
            <Text style={[GlobalStyles.textSmallBold, { color: "#fff" }]}>Citas</Text>
          </TouchableOpacity>

          {/* Botón de Especialidades */}
          <TouchableOpacity
            style={[GlobalStyles.dashboardButton, { backgroundColor: "#f57c00" }]}
            onPress={() => navigation.navigate("Specialties")}
          >
            <Ionicons name="medical" size={28} color="#fff" />
            <Text style={[GlobalStyles.textSmallBold, { color: "#fff" }]}>Especialidades</Text>
          </TouchableOpacity>
        </View>

        {/* Sección de creación de nuevos usuarios */}
        <Text style={[GlobalStyles.subtitle, { marginBottom: 12, fontSize: 16 }]}>Crear usuarios</Text>
        <View style={[GlobalStyles.row, { justifyContent: "space-between" }]}>
          {/* Crear Doctor */}
          <TouchableOpacity
            style={[GlobalStyles.dashboardButton, { backgroundColor: "#2e7d32" }]}
            onPress={() => navigation.navigate("CreateDoctor")}
          >
            <Ionicons name="medical" size={28} color="#fff" />
            <Text style={[GlobalStyles.textSmallBold, { color: "#fff" }]}>Doctor</Text>
          </TouchableOpacity>

          {/* Crear Administrador */}
          <TouchableOpacity
            style={[GlobalStyles.dashboardButton, { backgroundColor: "#dc1313ff" }]}
            onPress={() => navigation.navigate("CreateAdmin")}
          >
            <Ionicons name="shield" size={28} color="#fff" />
            <Text style={[GlobalStyles.textSmallBold, { color: "#fff" }]}>Admin</Text>
          </TouchableOpacity>

          {/* Opción Paciente (deshabilitada) */}
          <View style={[GlobalStyles.dashboardButton, { backgroundColor: "#757575", opacity: 0.5 }]}>
            <Ionicons name="" size={28} color="#fff" />
          </View>
        </View>
      </View>

      {/* NOTIFICACIONES DEL SISTEMA */}
      <View style={[GlobalStyles.card, { marginBottom: 20, borderRadius: 16, padding: 16 }]}>
        <Text style={[GlobalStyles.subtitle, { marginBottom: 16, fontSize: 18 }]}>Notificaciones</Text>
        <View style={{ gap: 12 }}>
          {/* Estado del sistema */}
          <View style={[GlobalStyles.row, { alignItems: "center" }]}>
            <Ionicons name="checkmark-circle" size={24} color="#4caf50" style={{ marginRight: 12 }} />
            <Text style={[GlobalStyles.textSmallBold, { color: "#333" }]}>Sistema operativo estable</Text>
          </View>

          {/* Citas pendientes */}
          <View style={[GlobalStyles.row, { alignItems: "center" }]}>
            <Ionicons name="alert-circle" size={24} color="#ffb74d" style={{ marginRight: 12 }} />
            <Text style={[GlobalStyles.textSmallBold, { color: "#333" }]}>5 citas pendientes de confirmación</Text>
          </View>

          {/* Última actualización */}
          <View style={[GlobalStyles.row, { alignItems: "center" }]}>
            <Ionicons name="information-circle" size={24} color="#64b5f6" style={{ marginRight: 12 }} />
            <Text style={[GlobalStyles.textSmallBold, { color: "#333" }]}>Última actualización hace 2 minutos</Text>
          </View>
        </View>
      </View>

      {/* PIE DE PÁGINA / TIP */}
      <View style={[GlobalStyles.card, { marginBottom: 40, borderRadius: 16, padding: 16, backgroundColor: "#e8eaf6" }]}>
        <Text style={[GlobalStyles.textSmallBold, { marginBottom: 8 }]}>Tip del día:</Text>
        <Text style={[GlobalStyles.textSmall, { color: "#333" }]}>
          Revisa regularmente las citas pendientes para mantener tu agenda organizada.
        </Text>
      </View>
    </ScrollView>
  )
}
