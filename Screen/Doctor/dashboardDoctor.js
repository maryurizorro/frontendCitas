"use client"

import { Ionicons } from "@expo/vector-icons"
import React, { useEffect, useState } from "react"
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native"
import { Colors } from "../../src/Components/Colors"
import { GlobalStyles } from "../../src/Components/Styles"
import { useAuth } from "../../src/Context/AuthContext"
import { appointmentAPI, userAPI } from "../../src/Services/conexion"

export default function DashboardDoctor({ navigation }) {
  const { user } = useAuth()
  const [todayAppointments, setTodayAppointments] = useState([])
  const [upcomingAppointments, setUpcomingAppointments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [doctorCount, setDoctorCount] = useState(0)

  useEffect(() => {
    fetchAppointments()
    fetchDoctorCount()
  }, [])

  const fetchAppointments = async () => {
    try {
      const response = await appointmentAPI.getDoctorAppointments()
      if (response.data.success) {
        const appointments = response.data.data
        const today = new Date().toISOString().split("T")[0]

        // Citas de hoy
        const todayApts = appointments.filter(apt => {
          const aptDate = new Date(apt.appointment_date).toISOString().split("T")[0]
          return aptDate === today
        })
        setTodayAppointments(todayApts)

        // Próximas citas (7 días)
        const upcoming = appointments.filter(apt => {
          const appointmentDate = new Date(apt.appointment_date)
          const todayDate = new Date()
          const weekFromNow = new Date(todayDate.getTime() + 7 * 24 * 60 * 60 * 1000)
          return appointmentDate > todayDate && appointmentDate <= weekFromNow
        })
        setUpcomingAppointments(upcoming.slice(0, 5))
      }
    } catch (error) {
      console.log("Error fetching appointments:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchDoctorCount = async () => {
    try {
      const response = await userAPI.getDoctors()
      if (response.data.success) {
        setDoctorCount(response.data.data.length)
      }
    } catch (error) {
      console.log('Error fetching doctor count:', error)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchAppointments()
    await fetchDoctorCount()
    setRefreshing(false)
  }

  const getStatusColor = status => {
    switch (status) {
      case "confirmed":
        return "#4caf50"
      case "pending":
        return "#ffb74d"
      case "cancelled":
        return "#e57373"
      default:
        return "#9e9e9e"
    }
  }

  const getStatusText = status => {
    switch (status) {
      case "confirmed":
        return "Confirmada"
      case "pending":
        return "Pendiente"
      case "cancelled":
        return "Cancelada"
      default:
        return status
    }
  }

  if (isLoading) {
    return (
      <View style={[GlobalStyles.container, GlobalStyles.center]}>
        <ActivityIndicator size="large" color="#1a237e" />
      </View>
    )
  }

  return (
    <ScrollView
      style={[GlobalStyles.container, { backgroundColor: "#f0f2f5" }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View
        style={[
          GlobalStyles.card,
          { backgroundColor: "#1a237e", marginBottom: 20, padding: 20, borderRadius: 16 }
        ]}
      >
        <View style={[GlobalStyles.row, GlobalStyles.spaceBetween]}>
          <View style={{ flex: 1 }}>
            <Text style={[GlobalStyles.subtitle, { color: "#fff", fontSize: 22 }]}>
              ¡Hola, Dr. {user?.nombre}!
            </Text>
            <Text style={[GlobalStyles.text, { color: "#c5cae9", marginTop: 4 }]}>
              {user?.especialidad || "Especialidad médica"}
            </Text>
          </View>
          <View
            style={[
              { width: 70, height: 70, borderRadius: 35, backgroundColor: "#283593" },
              GlobalStyles.center
            ]}
          >
            <Ionicons name="medical" size={36} color="#fff" />
          </View>
        </View>
      </View>

      {/* Citas de hoy */}
      <View style={[GlobalStyles.card, { marginBottom: 20, borderRadius: 16, padding: 16 }]}>
        <Text style={[GlobalStyles.subtitle, { marginBottom: 16, fontSize: 18 }]}>
          Citas de hoy
        </Text>

        {todayAppointments.length > 0 ? (
          todayAppointments.map((apt, index) => (
            <View
              key={apt.id}
              style={{
                padding: 16,
                borderRadius: 12,
                marginBottom: 12,
                backgroundColor: "#3949ab",
                borderLeftWidth: 4,
                borderLeftColor: getStatusColor(apt.status)
              }}
            >
              <View style={[GlobalStyles.row, GlobalStyles.spaceBetween]}>
                <View style={{ flex: 1 }}>
                  <Text style={[GlobalStyles.text, { fontWeight: "600", marginBottom: 4, color: "#fff" }]}>
                    {apt.patient?.name} {apt.patient?.surname}
                  </Text>
                  <Text style={[GlobalStyles.textSmall, { marginBottom: 2, color: "#e0e0e0" }]}>
                    🕐 {new Date(apt.appointment_date).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                  </Text>
                  {apt.reason && (
                    <Text style={[GlobalStyles.textSmall, { fontStyle: "italic", color: "#e0e0e0" }]}>
                      "{apt.reason}"
                    </Text>
                  )}
                </View>
                <View style={[GlobalStyles.center, { marginLeft: 16 }]}>
                  <View
                    style={{
                      backgroundColor: getStatusColor(apt.status),
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 12
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "600" }}>
                      {getStatusText(apt.status)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={[GlobalStyles.center, { paddingVertical: 20 }]}>
            <Ionicons name="calendar-outline" size={48} color="#9e9e9e" />
            <Text style={[GlobalStyles.text, { color: "#9e9e9e", marginTop: 8 }]}>
              No tienes citas programadas para hoy
            </Text>
          </View>
        )}
      </View>

      {/* Próximas citas */}
      <View style={[GlobalStyles.card, { marginBottom: 20, borderRadius: 16, padding: 16 }]}>
        <Text style={[GlobalStyles.subtitle, { marginBottom: 16, fontSize: 18 }]}>
          Próximas citas
        </Text>

        {upcomingAppointments.length > 0 ? (
          upcomingAppointments.map((apt, index) => (
            <View
              key={apt.id}
              style={{
                padding: 16,
                borderRadius: 12,
                marginBottom: 12,
                backgroundColor: "#00796b",
                borderLeftWidth: 4,
                borderLeftColor: getStatusColor(apt.status)
              }}
            >
              <View style={[GlobalStyles.row, GlobalStyles.spaceBetween]}>
                <View style={{ flex: 1 }}>
                  <Text style={[GlobalStyles.text, { fontWeight: "600", marginBottom: 4, color: "#fff" }]}>
                    {apt.patient?.name} {apt.patient?.surname}
                  </Text>
                  <Text style={[GlobalStyles.textSmall, { marginBottom: 2, color: "#e0e0e0" }]}>
                    📅 {new Date(apt.appointment_date).toLocaleDateString("es-ES")}
                  </Text>
                  <Text style={[GlobalStyles.textSmall, { marginBottom: 4, color: "#e0e0e0" }]}>
                    🕐 {new Date(apt.appointment_date).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                  </Text>
                </View>
                <View style={[GlobalStyles.center, { marginLeft: 16 }]}>
                  <View
                    style={{
                      backgroundColor: getStatusColor(apt.status),
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 12
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "600" }}>
                      {getStatusText(apt.status)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={[GlobalStyles.center, { paddingVertical: 20 }]}>
            <Ionicons name="calendar-outline" size={48} color="#9e9e9e" />
            <Text style={[GlobalStyles.text, { color: "#9e9e9e", marginTop: 8 }]}>
              No tienes citas próximas
            </Text>
          </View>
        )}
      </View>

      {/* Acciones rápidas */}
      <View style={[GlobalStyles.card, { marginBottom: 40, borderRadius: 16, padding: 16 }]}>
        <Text style={[GlobalStyles.subtitle, { marginBottom: 16, fontSize: 18 }]}>Acciones rápidas</Text>
        <View style={[GlobalStyles.row, { justifyContent: "space-around" }]}>
          <TouchableOpacity
            style={[GlobalStyles.dashboardButton, { backgroundColor: "#3949ab" }]}
            onPress={() => navigation.navigate("Appointments")}
          >
            <Ionicons name="calendar" size={28} color="#fff" />
            <Text style={[GlobalStyles.textSmallBold, { color: "#fff" }]}>Ver Citas</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[GlobalStyles.dashboardButton, { backgroundColor: "#00796b" }]}
            onPress={() => navigation.navigate("Schedule")}
          >
            <Ionicons name="time" size={28} color="#fff" />
            <Text style={[GlobalStyles.textSmallBold, { color: "#fff" }]}>Horarios</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[GlobalStyles.dashboardButton, { backgroundColor: "#f57c00" }]}
            onPress={() => navigation.navigate("Profile")}
          >
            <Ionicons name="settings" size={28} color="#fff" />
            <Text style={[GlobalStyles.textSmallBold, { color: "#fff" }]}>Perfil</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  )
}
