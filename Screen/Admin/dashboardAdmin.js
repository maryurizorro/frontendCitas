"use client";

import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useAuth } from "../../src/Context/AuthContext";
import { userAPI } from "../../src/Services/conexion";

export default function DashboardAdmin({ navigation }) {
  const { user: authUser, isAdmin } = useAuth();

  const [user, setUser] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [adminCount, setAdminCount] = useState(0);
  const [doctorCount, setDoctorCount] = useState(0);
  const [patientCount, setPatientCount] = useState(0);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    if (!isAdmin()) {
      setAccessDenied(true);
      setIsLoadingProfile(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await userAPI.getProfile();
        if (response.data.success) {
          setUser(response.data.data);
        }
      } catch (error) {
        console.log("Error fetching profile:", error);
        setUser(authUser);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    if (authUser) {
      fetchProfile();
    }

    fetchUserCounts();
  }, [authUser, isAdmin]);

  const fetchUserCounts = async () => {
    try {
      const [adminResponse, doctorResponse, patientResponse] = await Promise.all([
        userAPI.getUsers({ role: "admin" }),
        userAPI.getUsers({ role: "doctor" }),
        userAPI.getUsers({ role: "patient" }),
      ]);

      if (adminResponse.data.success) setAdminCount(adminResponse.data.data.length);
      if (doctorResponse.data.success) setDoctorCount(doctorResponse.data.data.length);
      if (patientResponse.data.success) setPatientCount(patientResponse.data.data.length);
    } catch (error) {
      console.log("Error fetching user counts:", error);
      // Forzar recarga después de un pequeño delay para asegurar que los datos se actualicen
      setTimeout(() => {
        fetchUserCounts();
      }, 1000);
    }
  };

  const onRefresh = () => {
    setRefreshing(!refreshing);
    fetchUserCounts();
  };

  const getRoleText = (role) => {
    switch (role) {
      case "admin":
        return "Administrador";
      case "doctor":
        return "Doctor";
      case "patient":
        return "Paciente";
      default:
        return role;
    }
  };

  if (accessDenied) {
    return (
      <View style={[styles.center, { flex: 1 }]}>
        <Ionicons name="shield-outline" size={64} color="#EF4444" />
        <Text style={styles.errorText}>Acceso denegado</Text>
        <Text style={styles.errorSubText}>
          No tienes permisos para acceder al panel de administración.
        </Text>
      </View>
    );
  }

  if (isLoadingProfile) {
    return (
      <View style={[styles.center, { flex: 1 }]}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={{ marginTop: 16, color: "#4B5563" }}>
          Cargando panel de administración...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* ENCABEZADO */}
      <View style={styles.headerCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerText}>
            ¡Hola, {user?.name} {user?.surname}!
          </Text>
          <Text style={styles.subHeaderText}>{getRoleText(user?.role)}</Text>
          <Text style={styles.welcomeText}>
            Bienvenido al panel de administración
          </Text>
        </View>
        <View style={styles.iconCircle}>
          <Ionicons name="shield-checkmark" size={36} color="#fff" />
        </View>
      </View>

      {/* GESTIÓN DE USUARIOS */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Gestión de Usuarios</Text>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "doctors" && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab("doctors")}
          >
            <Ionicons
              name="medical"
              size={20}
              color={activeTab === "doctors" ? "#fff" : "#4F46E5"}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "doctors" && styles.activeTabText,
              ]}
            >
              Doctores ({doctorCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "patients" && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab("patients")}
          >
            <Ionicons
              name="people"
              size={20}
              color={activeTab === "patients" ? "#fff" : "#4F46E5"}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "patients" && styles.activeTabText,
              ]}
            >
              Pacientes ({patientCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "admins" && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab("admins")}
          >
            <Ionicons
              name="shield"
              size={20}
              color={activeTab === "admins" ? "#fff" : "#4F46E5"}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "admins" && styles.activeTabText,
              ]}
            >
              Admins ({adminCount})
            </Text>
          </TouchableOpacity>
        </View>

        {/* SECCIÓN DE CREACIÓN DE NUEVOS USUARIOS */}
        <Text style={[styles.sectionSubtitle]}>Crear usuarios</Text>
        <View style={styles.createUserRow}>
          {/* Crear Doctor */}
          <TouchableOpacity
            style={[styles.createBtn, { backgroundColor: "#2e7d32" }]}
            onPress={() => navigation.navigate("CreateDoctor")}
          >
            <Ionicons name="medical" size={28} color="#fff" />
            <Text style={styles.createBtnText}>Doctor</Text>
          </TouchableOpacity>

          {/* Crear Administrador */}
          <TouchableOpacity
            style={[styles.createBtn, { backgroundColor: "#526ad8ff" }]}
            onPress={() => navigation.navigate("CreateAdmin")}
          >
            <Ionicons name="shield" size={28} color="#fff" />
            <Text style={styles.createBtnText}>Admin</Text>
          </TouchableOpacity>

          {/* Opción Paciente (deshabilitada visualmente) */}
          <View style={[styles.createBtn, { backgroundColor: "#757575", opacity: 0.5 }]}>
            <Ionicons name="person" size={28} color="#fff" />
          </View>
        </View>
      </View>

      {/* ACCIONES RÁPIDAS */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Acciones rápidas</Text>
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate("Users")}
          >
            <Ionicons name="people" size={28} color="#4F46E5" />
            <Text style={styles.actionText}>Usuarios</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate("Appointments")}
          >
            <Ionicons name="calendar" size={28} color="#4F46E5" />
            <Text style={styles.actionText}>Citas</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate("Specialties")}
          >
            <Ionicons name="medical" size={28} color="#4F46E5" />
            <Text style={styles.actionText}>Especialidades</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* NOTIFICACIONES */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Notificaciones</Text>
        <View style={{ gap: 10 }}>
          <View style={styles.row}>
            <Ionicons name="checkmark-circle" size={22} color="#10B981" />
            <Text style={styles.noteText}>Sistema operativo estable</Text>
          </View>
          <View style={styles.row}>
            <Ionicons name="alert-circle" size={22} color="#F59E0B" />
            <Text style={styles.noteText}>
              5 citas pendientes de confirmación
            </Text>
          </View>
          <View style={styles.row}>
            <Ionicons name="information-circle" size={22} color="#3B82F6" />
            <Text style={styles.noteText}>
              Última actualización hace 2 minutos
            </Text>
          </View>
        </View>
      </View>

      {/* PIE DE PÁGINA */}
      <View style={styles.footerCard}>
        <Text style={styles.tipTitle}>💡 Tip del día</Text>
        <Text style={styles.tipText}>
          Revisa regularmente las citas pendientes para mantener tu agenda
          organizada.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    padding: 10,
  },
  center: { justifyContent: "center", alignItems: "center" },
  headerCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#EEF2FF",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 20,
  },
  headerText: { fontSize: 20, fontWeight: "700", color: "#111827" },
  subHeaderText: { fontSize: 16, color: "#4F46E5", marginTop: 4 },
  welcomeText: { fontSize: 14, color: "#6B7280", marginTop: 6 },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#4F46E5",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 16,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: "600", color: "#1F2937", marginBottom: 10 },
  tabContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  tabButton: {
    flex: 1,
    backgroundColor: "#EEF2FF",
    marginHorizontal: 4,
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  activeTabButton: { backgroundColor: "#4F46E5" },
  tabText: { fontSize: 14, color: "#4F46E5", fontWeight: "500" },
  activeTabText: { color: "#fff" },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
    marginTop: 5,
  },
  createUserRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  createBtn: {
    flex: 1,
    borderRadius: 12,
    alignItems: "center",
    padding: 15,
    marginHorizontal: 4,
  },
  createBtnText: { color: "#fff", fontWeight: "600", marginTop: 6 },
  actionRow: { flexDirection: "row", justifyContent: "space-between" },
  actionBtn: {
    flex: 1,
    backgroundColor: "#EEF2FF",
    marginHorizontal: 4,
    borderRadius: 12,
    alignItems: "center",
    padding: 15,
  },
  actionText: { color: "#111827", fontWeight: "600", marginTop: 6 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  noteText: { fontSize: 14, color: "#374151" },
  footerCard: {
    backgroundColor: "#E0E7FF",
    borderRadius: 16,
    padding: 15,
    marginBottom: 30,
  },
  tipTitle: { fontWeight: "700", color: "#4F46E5", marginBottom: 6 },
  tipText: { color: "#374151", fontSize: 14 },
  errorText: { fontSize: 18, color: "#EF4444", fontWeight: "700", marginTop: 10 },
  errorSubText: { color: "#6B7280", textAlign: "center", marginTop: 5 },
});
