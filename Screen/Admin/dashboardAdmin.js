"use client"

import { Ionicons } from "@expo/vector-icons"
import { useState, useEffect } from "react"
import { ScrollView, Text, TouchableOpacity, View } from "react-native"
import { Colors } from "../../src/Components/Colors"
import { GlobalStyles } from "../../src/Components/Styles"
import { useAuth } from "../../src/Context/AuthContext"
import { userAPI } from "../../src/Services/conexion"

export default function DashboardAdmin({ navigation }) {
  const { user } = useAuth()
  const [refreshing, setRefreshing] = useState(false)
  const [adminCount, setAdminCount] = useState(0)

  useEffect(() => {
    fetchAdminCount()
  }, [])

  const fetchAdminCount = async () => {
    try {
      const response = await userAPI.getUsers({ role: 'admin' })
      if (response.data.success) {
        setAdminCount(response.data.data.length)
      }
    } catch (error) {
      console.log('Error fetching admin count:', error)
    }
  }

  const onRefresh = () => {
    setRefreshing(!refreshing)
    fetchAdminCount()
  }

  return (
    <ScrollView
      style={[GlobalStyles.container, { backgroundColor: "#f0f2f5" }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header de bienvenida */}
      <View
        style={[
          GlobalStyles.card,
          { backgroundColor: "#1a237e", marginBottom: 20, padding: 20, borderRadius: 16 },
        ]}
      >
        <View style={[GlobalStyles.row, GlobalStyles.spaceBetween]}>
          <View style={{ flex: 1 }}>
            <Text style={[GlobalStyles.subtitle, { color: "#fff", fontSize: 22 }]}>
              ¡Hola, {user?.name}!
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

      {/* Acciones rápidas */}
      <View style={[GlobalStyles.card, { marginBottom: 20, borderRadius: 16, padding: 16 }]}>
        <Text style={[GlobalStyles.subtitle, { marginBottom: 16, fontSize: 18 }]}>Acciones rápidas</Text>
        <View style={[GlobalStyles.row, { justifyContent: "space-between", marginBottom: 16 }]}>
          <TouchableOpacity
            style={[GlobalStyles.dashboardButton, { backgroundColor: "#3949ab" }]}
            onPress={() => navigation.navigate("Users")}
          >
            <Ionicons name="people" size={28} color="#fff" />
            <Text style={[GlobalStyles.textSmallBold, { color: "#fff" }]}>Usuarios</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[GlobalStyles.dashboardButton, { backgroundColor: "#00796b" }]}
            onPress={() => navigation.navigate("Appointments")}
          >
            <Ionicons name="calendar" size={28} color="#fff" />
            <Text style={[GlobalStyles.textSmallBold, { color: "#fff" }]}>Citas</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[GlobalStyles.dashboardButton, { backgroundColor: "#f57c00" }]}
            onPress={() => navigation.navigate("Specialties")}
          >
            <Ionicons name="medical" size={28} color="#fff" />
            <Text style={[GlobalStyles.textSmallBold, { color: "#fff" }]}>Especialidades</Text>
          </TouchableOpacity>
        </View>

        {/* User Creation Actions */}
        <Text style={[GlobalStyles.subtitle, { marginBottom: 12, fontSize: 16 }]}>Crear usuarios</Text>
        <View style={[GlobalStyles.row, { justifyContent: "space-between" }]}>
          <TouchableOpacity
            style={[GlobalStyles.dashboardButton, { backgroundColor: "#2e7d32" }]}
            onPress={() => navigation.navigate("CreateDoctor")}
          >
            <Ionicons name="medical" size={28} color="#fff" />
            <Text style={[GlobalStyles.textSmallBold, { color: "#fff" }]}>Doctor</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[GlobalStyles.dashboardButton, { backgroundColor: "#d32f2f" }]}
            onPress={() => navigation.navigate("CreateAdmin")}
          >
            <Ionicons name="shield" size={28} color="#fff" />
            <Text style={[GlobalStyles.textSmallBold, { color: "#fff" }]}>Admin</Text>
          </TouchableOpacity>

          <View style={[GlobalStyles.dashboardButton, { backgroundColor: "#757575", opacity: 0.5 }]}>
            <Ionicons name="person" size={28} color="#fff" />
            <Text style={[GlobalStyles.textSmallBold, { color: "#fff" }]}>Paciente</Text>
          </View>
        </View>
      </View>

      {/* Notificaciones del sistema */}
      <View style={[GlobalStyles.card, { marginBottom: 20, borderRadius: 16, padding: 16 }]}>
        <Text style={[GlobalStyles.subtitle, { marginBottom: 16, fontSize: 18 }]}>Notificaciones</Text>
        <View style={{ gap: 12 }}>
          <View style={[GlobalStyles.row, { alignItems: "center" }]}>
            <Ionicons name="checkmark-circle" size={24} color="#4caf50" style={{ marginRight: 12 }} />
            <Text style={[GlobalStyles.textSmallBold, { color: "#333" }]}>Sistema operativo estable</Text>
          </View>
          <View style={[GlobalStyles.row, { alignItems: "center" }]}>
            <Ionicons name="alert-circle" size={24} color="#ffb74d" style={{ marginRight: 12 }} />
            <Text style={[GlobalStyles.textSmallBold, { color: "#333" }]}>5 citas pendientes de confirmación</Text>
          </View>
          <View style={[GlobalStyles.row, { alignItems: "center" }]}>
            <Ionicons name="information-circle" size={24} color="#64b5f6" style={{ marginRight: 12 }} />
            <Text style={[GlobalStyles.textSmallBold, { color: "#333" }]}>Última actualización hace 2 minutos</Text>
          </View>
        </View>
      </View>

      {/* Pie de página / tips */}
      <View style={[GlobalStyles.card, { marginBottom: 40, borderRadius: 16, padding: 16, backgroundColor: "#e8eaf6" }]}>
        <Text style={[GlobalStyles.textSmallBold, { marginBottom: 8 }]}>Tip del día:</Text>
        <Text style={[GlobalStyles.textSmall, { color: "#333" }]}>
          Revisa regularmente las citas pendientes para mantener tu agenda organizada.
        </Text>
      </View>
    </ScrollView>
  )
}
