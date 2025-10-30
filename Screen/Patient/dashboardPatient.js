"use client";

import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors } from "../../src/Components/Colors";
import { GlobalStyles } from "../../src/Components/Styles";
import { useAuth } from "../../src/Context/AuthContext";
import { appointmentAPI, userAPI } from "../../src/Services/conexion";

export default function DashboardPatient({ navigation }) {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await userAPI.getProfile();
        if (response.data.success) {
          setUser(response.data.data);
        }
      } catch (error) {
        console.log('Error fetching profile:', error);
        setUser(authUser);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    if (authUser) {
      fetchProfile();
    }
    fetchUpcomingAppointments();
  }, [authUser]);

  const fetchUpcomingAppointments = async () => {
    try {
      const response = await appointmentAPI.myAppointments();
      if (response.data.success) {
        const upcoming = response.data.data
          .filter(apt => apt.status !== 'pending')
          .filter((apt) => {
            const appointmentDate = new Date(apt.appointment_date || apt.date);
            const today = new Date();
            const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
            return appointmentDate >= today && appointmentDate <= weekFromNow;
          });
        setUpcomingAppointments(upcoming.slice(0, 3));
      }
    } catch (error) {
      console.log("Error fetching appointments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUpcomingAppointments();
    setRefreshing(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeString) => timeString ? timeString.substring(0, 5) : '--:--';

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "#4caf50";
      case "pending":
        return "#ff9800";
      case "cancelled":
        return "#f44336";
      default:
        return "#9e9e9e";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "confirmed":
        return "Confirmada";
      case "pending":
        return "Pendiente";
      case "cancelled":
        return "Cancelada";
      default:
        return status;
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

  if (isLoading || isLoadingProfile) {
    return (
      <View style={[GlobalStyles.container, GlobalStyles.center]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={[GlobalStyles.text, { marginTop: 16 }]}>
          {isLoadingProfile ? 'Cargando perfil...' : 'Cargando citas...'}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#f5f7fa" }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header elegante */}
      <View
        style={{
          backgroundColor: "#1565c0",
          paddingVertical: 40,
          paddingHorizontal: 24,
          borderBottomLeftRadius: 32,
          borderBottomRightRadius: 32,
          alignItems: "center",
          marginBottom: 30,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 5,
        }}
      >
        <View
          style={{
            width: 110,
            height: 110,
            borderRadius: 55,
            backgroundColor: "#1e88e5",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 15,
            shadowColor: "#000",
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          <Ionicons name="person-circle-outline" size={70} color="#fff" />
        </View>

        <Text style={{ color: "#fff", fontSize: 26, fontWeight: "700", textAlign: "center" }}>
          {user?.name} {user?.surname}
        </Text>
        <Text style={{ color: "#bbdefb", fontSize: 18, marginTop: 4 }}>
          {getRoleText(user?.role)}
        </Text>
        <Text style={{ color: "#e3f2fd", fontSize: 14, marginTop: 6 }}>
          Gestiona tus citas médicas fácilmente
        </Text>

        {/* 🕓 Miembro desde */}
        <View style={{ marginTop: 10 }}>
          <Text style={{ color: "#fff", fontSize: 14 }}>
            Miembro desde:{" "}
            {user?.created_at
              ? new Date(user.created_at).toLocaleDateString("es-ES")
              : "N/A"}
          </Text>
        </View>
      </View>

      {/* Acciones rápidas */}
      <View style={{ paddingHorizontal: 20, marginBottom: 25 }}>
        <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 16, color: "#1a237e" }}>
          Acciones rápidas
        </Text>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: "#1976d2",
              borderRadius: 16,
              padding: 16,
              marginRight: 8,
              alignItems: "center",
              shadowColor: "#000",
              shadowOpacity: 0.1,
              shadowRadius: 10,
              elevation: 4,
            }}
            onPress={() => navigation.navigate("Book")}
          >
            <Ionicons name="add-circle" size={32} color="#fff" />
            <Text style={{ color: "#fff", fontWeight: "600", marginTop: 8 }}>Nueva Cita</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: "#009688",
              borderRadius: 16,
              padding: 16,
              marginLeft: 8,
              marginRight: 8,
              alignItems: "center",
              shadowColor: "#000",
              shadowOpacity: 0.1,
              shadowRadius: 10,
              elevation: 4,
            }}
            onPress={() => navigation.navigate("Appointments")}
          >
            <Ionicons name="calendar" size={32} color="#fff" />
            <Text style={{ color: "#fff", fontWeight: "600", marginTop: 8 }}>Mis Citas</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: "#455a64",
              borderRadius: 16,
              padding: 16,
              marginLeft: 8,
              alignItems: "center",
              shadowColor: "#000",
              shadowOpacity: 0.1,
              shadowRadius: 10,
              elevation: 4,
            }}
            onPress={() => navigation.navigate("Profile")}
          >
            <Ionicons name="person" size={32} color="#fff" />
            <Text style={{ color: "#fff", fontWeight: "600", marginTop: 8 }}>Perfil</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Próximas citas */}
      <View style={{ paddingHorizontal: 20, marginBottom: 30 }}>
        <View style={[GlobalStyles.row, GlobalStyles.spaceBetween, { marginBottom: 12 }]}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#1a237e" }}>Próximas citas</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Appointments")}>
            <Text style={{ color: "#1976d2", fontWeight: "600" }}>Ver todas</Text>
          </TouchableOpacity>
        </View>

        {upcomingAppointments.length > 0 ? (
          upcomingAppointments.map((appointment) => (
            <View
              key={appointment.id}
              style={{
                backgroundColor: "#fff",
                padding: 18,
                borderRadius: 16,
                marginBottom: 12,
                shadowColor: "#000",
                shadowOpacity: 0.08,
                shadowRadius: 10,
                elevation: 3,
                borderLeftWidth: 5,
                borderLeftColor: getStatusColor(appointment.status),
              }}
            >
              <Text style={{ fontWeight: "700", fontSize: 16, marginBottom: 4, color: "#0d47a1" }}>
                Dr. {appointment.doctor?.name} {appointment.doctor?.surname}
              </Text>
              <Text style={{ fontSize: 14, color: "#607d8b", marginBottom: 2 }}>
                {appointment.specialty?.name}
              </Text>
              <Text style={{ fontSize: 14, color: "#455a64" }}>📅 {formatDate(appointment.date)}</Text>
              <Text style={{ fontSize: 14, color: "#455a64" }}>🕐 {formatTime(appointment.time)}</Text>
              <View
                style={{
                  backgroundColor: getStatusColor(appointment.status),
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 12,
                  alignSelf: "flex-start",
                  marginTop: 8,
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>{getStatusText(appointment.status)}</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={{ alignItems: "center", paddingVertical: 20 }}>
            <Ionicons name="calendar-outline" size={48} color="#cfd8dc" />
            <Text style={{ color: "#90a4ae", marginTop: 8, fontWeight: "600" }}>No tienes citas próximas</Text>
            <TouchableOpacity
              style={{
                backgroundColor: "#1976d2",
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 12,
                marginTop: 16,
              }}
              onPress={() => navigation.navigate("Book")}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>Reservar una cita</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Información útil */}
      <View style={{ paddingHorizontal: 20, marginBottom: 40 }}>
        <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 12, color: "#1a237e" }}>
          Información útil
        </Text>

        <View
          style={{
            backgroundColor: "#e3f2fd",
            padding: 16,
            borderRadius: 16,
            marginBottom: 12,
            shadowColor: "#000",
            shadowOpacity: 0.05,
            shadowRadius: 10,
            elevation: 2,
          }}
        >
          <View style={[GlobalStyles.row, { alignItems: "center" }]}>
            <Ionicons name="information-circle" size={24} color="#1565c0" style={{ marginRight: 12 }} />
            <Text style={{ fontWeight: "600", color: "#0d47a1", flex: 1 }}>
              Llega 15 minutos antes de tu cita y trae tu documento de identidad.
            </Text>
          </View>
        </View>

        <View
          style={{
            backgroundColor: "#fff3e0",
            padding: 16,
            borderRadius: 16,
            shadowColor: "#000",
            shadowOpacity: 0.05,
            shadowRadius: 10,
            elevation: 2,
          }}
        >
          <View style={[GlobalStyles.row, { alignItems: "center" }]}>
            <Ionicons name="call" size={24} color="#ff9800" style={{ marginRight: 12 }} />
            <Text style={{ fontWeight: "600", color: "#e65100", flex: 1 }}>
              Contacta con nosotros al 123-456-7890 para cualquier consulta.
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
