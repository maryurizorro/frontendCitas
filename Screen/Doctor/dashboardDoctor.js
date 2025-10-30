import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors } from "../../src/Components/Colors";
import { GlobalStyles } from "../../src/Components/Styles";
import { NotificationService } from "../../src/Components/NotificationService";
import { useAuth } from "../../src/Context/AuthContext";
import { appointmentAPI, userAPI } from "../../src/Services/conexion";
import * as Notifications from 'expo-notifications';
import AsyncStorage from "@react-native-async-storage/async-storage";

// Pantalla principal del doctor: muestra su información, citas del día, próximas citas y accesos rápidos
export default function DashboardDoctor({ navigation }) {
  // Obtiene el usuario autenticado desde el contexto
  const { user: authUser } = useAuth();

  // Estados para manejar los datos y la carga
  const [user, setUser] = useState(null);
  const [todayAppointments, setTodayAppointments] = useState([]); // citas del día
  const [upcomingAppointments, setUpcomingAppointments] = useState([]); // próximas citas
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [doctorCount, setDoctorCount] = useState(0);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [lastPendingCount, setLastPendingCount] = useState(0); // Para rastrear cambios en citas pendientes
  const [hasShownInitialNotification, setHasShownInitialNotification] = useState(false); // Para mostrar notificación solo una vez
  const [notificationShown, setNotificationShown] = useState(false); // Para controlar si ya se mostró la notificación en esta sesión


   // ⏰ Programar una notificación de prueba
  const programarNotificacion = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    const preferencia = await AsyncStorage.getItem('notificaciones_activas');
    if (status !== 'granted' || preferencia !== 'true') {
      Alert.alert('⚠️ No tiene permisos para recibir notificaciones');
      return;
    }

   const trigger = new Date(Date.now() + 1000); // Notificación en 1 segundo

try {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🩺 ¡Bienvenido, Doctor!',
      body: 'Tienes citas pendientes por revisar. Por favor, verifica tu agenda para hoy 📅',
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
      vibrate: [0, 250, 250, 250],
    },
    trigger,
  });

  Alert.alert('✅ Notificación enviada', 'Revisa tus citas pendientes.');
} catch (error) {
  Alert.alert('❌ Error al programar la notificación', error.message);
}
};
  // useEffect que carga perfil y citas al iniciar la pantalla
   useEffect(() => {
     const fetchProfile = async () => {
       try {
         // Llama al backend para obtener perfil del usuario
         const response = await userAPI.getProfile();
         if (response?.data?.success) {
           setUser(response.data.data);
         } else {
           console.log("Error: respuesta no exitosa al obtener perfil");
           setUser(authUser ?? null);
         }
       } catch (error) {
         console.log("Error fetching profile:", error);
         // No mostrar alerta para el perfil, usar datos del contexto como fallback
         setUser(authUser ?? null);
       } finally {
         setIsLoadingProfile(false);
       }
     };

     // Si hay usuario autenticado, carga perfil y datos
     if (authUser) {
       fetchProfile();
     } else {
       setIsLoadingProfile(false);//carga ap
     }

     // Carga las citas y el conteo de doctores
     fetchAppointments();//trae
     fetchDoctorCount();

     // Configurar polling para verificar nuevas citas pendientes cada 30 segundos
     const pollingInterval = setInterval(async () => {
       if (authUser?.role === 'doctor') {
         try {
           const response = await appointmentAPI.getDoctorAppointments();
           if (response?.data?.success) {
             const pendingCount = response.data.pending_count || 0;
             // Solo mostrar notificación si hay nuevas citas pendientes (no mostrar en polling)
             setLastPendingCount(pendingCount);
           } else {
             console.log("Error en polling: respuesta no exitosa");
           }
         } catch (error) {
           console.log("Error polling appointments:", error);
           // No mostrar alerta en polling para evitar spam
         }
       }
     }, 30000); // 30 segundos

     // Limpiar el intervalo cuando el componente se desmonte
     return () => clearInterval(pollingInterval);
   }, [authUser]);



  // Obtiene las citas del doctor
  const fetchAppointments = async () => {
    try {
      const response = await appointmentAPI.getDoctorAppointments();
      if (response?.data?.success) {
        const appointments = response.data.data || [];
        const pendingCount = response.data.pending_count || 0;
        const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local

        // Verificar si hay nuevas citas pendientes y mostrar notificación (solo una vez al entrar)
        if (pendingCount > 0 && !notificationShown) {
          // Solo mostrar notificación cuando entra por primera vez y hay citas pendientes
          NotificationService.showDoctorPendingAppointmentsNotification(pendingCount);
          setNotificationShown(true);
        }
        setLastPendingCount(pendingCount);

        // Filtra citas del día
        const todayApts = appointments.filter((apt) => {
          const aptDate = new Date(apt.appointment_date).toLocaleDateString('en-CA');
          return aptDate === today;
        });


        setTodayAppointments(todayApts);

        // Filtra próximas citas dentro de 7 días
        const upcoming = appointments.filter((apt) => {
          const appointmentDate = new Date(apt.appointment_date);
          const todayDate = new Date();
          const weekFromNow = new Date(todayDate.getTime() + 7 * 24 * 60 * 60 * 1000);
          return appointmentDate > todayDate && appointmentDate <= weekFromNow;
        });
        setUpcomingAppointments(upcoming.slice(0, 5));
      } else {
        Alert.alert('Error', 'No se pudieron cargar las citas. Inténtalo de nuevo.');
        setTodayAppointments([]);
        setUpcomingAppointments([]);
      }
    } catch (error) {
      console.log("Error fetching appointments:", error);
      Alert.alert('Error', 'No se pudieron cargar las citas. Verifica tu conexión a internet.');
      setTodayAppointments([]);
      setUpcomingAppointments([]);
    } finally {
      setIsLoading(false);
    }
  };

  //  Obtiene número total de doctores (solo informativo)
  const fetchDoctorCount = async () => {
    try {
      const response = await userAPI.getDoctors();
      if (response?.data?.success) {
        setDoctorCount(Array.isArray(response.data.data) ? response.data.data.length : 0);
      }
    } catch (error) {
      console.log("Error fetching doctor count:", error);
      // No mostrar alerta para el conteo de doctores, ya que es informativo
    }
  };

  // Función para refrescar los datos al deslizar hacia abajo
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchAppointments();
      await fetchDoctorCount();
    } catch (error) {
      console.log("Error refreshing data:", error);
      Alert.alert('Error', 'No se pudieron actualizar las citas. Inténtalo de nuevo.');
    } finally {
      setRefreshing(false);
    }
  };


  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "#4caf50";
      case "pending":
        return "#ffb74d";
      case "cancelled":
        return "#e57373";
      default:
        return "#9e9e9e";
    }
  };

  // Devuelve texto amigable según el estado
  const getStatusText = (status) => {
    switch (status) {
      case "confirmed":
        return "Confirmada";
      case "pending":
        return "Pendiente";
      case "cancelled":
        return "Cancelada";
      default:
        return status ?? "";
    }
  };

  //  Muestra pantalla de carga mientras se obtienen datos
  if (isLoading || isLoadingProfile) {
    return (
      <View style={[GlobalStyles.container, GlobalStyles.center]}>
        <ActivityIndicator size="large" color="#1a237e" />
        <Text style={[GlobalStyles.text, { marginTop: 16 }]}>
          {isLoadingProfile ? "Cargando perfil..." : "Cargando citas..."}
        </Text>
      </View>
    );
  }

  //  Traduce el rol a un texto legible
  const getRoleText = (role) => {
    switch (role) {
      case "admin":
        return "Administrador";
      case "doctor":
        return "Doctor";
      case "patient":
        return "Paciente";
      default:
        return role ?? "";
    }
  };

  return (
    <ScrollView
      style={[GlobalStyles.container, { backgroundColor: "#f0f2f5" }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      {/*  Encabezado con información del doctor */}
      <View
        style={[
          GlobalStyles.card,
          { backgroundColor: "#1a237e", marginBottom: 20, padding: 20, borderRadius: 16 },
        ]}
      >
        <View style={[GlobalStyles.row, GlobalStyles.spaceBetween]}>
          <View style={{ flex: 1 }}>
            <Text style={[GlobalStyles.subtitle, { color: "#fff", fontSize: 22 }]}>
              ¡Hola, {user?.name ?? ""} {user?.surname ?? ""}!
            </Text>
            <Text style={[GlobalStyles.subtitle, { color: "#4caf50", fontSize: 18, marginTop: 4 }]}>
              {getRoleText(user?.role)}
            </Text>
            <Text style={[GlobalStyles.text, { color: "#c5cae9", marginTop: 4 }]}>
              {user?.specialty?.name ?? "Especialidad médica"}
            </Text>
          </View>
          <View
            style={[
              { width: 70, height: 70, borderRadius: 35, backgroundColor: "#283593" },
              GlobalStyles.center,
            ]}
          >
            <Ionicons name="medical" size={36} color="#fff" />
          </View>
        </View>
      </View>

      {/*  Sección de citas del día */}
      <View style={[GlobalStyles.card, { marginBottom: 20, borderRadius: 16, padding: 16 }]}>
        <Text style={[GlobalStyles.subtitle, { marginBottom: 16, fontSize: 18 }]}>Citas de hoy</Text>

        {todayAppointments.length > 0 ? (
          // Muestra cada cita del día
          todayAppointments.map((apt) => (
            <View
              key={apt.id ?? `${apt.patient?.id ?? Math.random()}`}
              style={{
                padding: 16,
                borderRadius: 12,
                marginBottom: 12,
                backgroundColor: "#3949ab",
                borderLeftWidth: 4,
                borderLeftColor: getStatusColor(apt.status),
              }}
            >
              <View style={[GlobalStyles.row, GlobalStyles.spaceBetween]}>
                <View style={{ flex: 1 }}>
                  <Text style={[GlobalStyles.text, { fontWeight: "600", marginBottom: 4, color: "#fff" }]}>
                    {apt.patient?.name ?? ""} {apt.patient?.surname ?? ""}
                  </Text>
                  <Text style={[GlobalStyles.textSmall, { marginBottom: 2, color: "#e0e0e0" }]}>
                    {"🕐 "}
                    {new Date(apt.appointment_date).toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                  {apt.reason ? (
                    <Text style={[GlobalStyles.textSmall, { fontStyle: "italic", color: "#e0e0e0" }]}>
                      {`“${apt.reason}”`}
                    </Text>
                  ) : null}
                </View>
                <View style={[GlobalStyles.center, { marginLeft: 16 }]}>
                  <View
                    style={{
                      backgroundColor: getStatusColor(apt.status),
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 12,
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "600" }}>{getStatusText(apt.status)}</Text>
                  </View>
                </View>
              </View>
            </View>
          ))
        ) : (
          // Si no hay citas del día
          <View style={[GlobalStyles.center, { paddingVertical: 20 }]}>
            <Ionicons name="calendar-outline" size={48} color="#9e9e9e" />
            <Text style={[GlobalStyles.text, { color: "#9e9e9e", marginTop: 8 }]}>
              No tienes citas programadas para hoy
            </Text>
          </View>
        )}
      </View>

      {/*  Sección de próximas citas */}
      <View style={[GlobalStyles.card, { marginBottom: 20, borderRadius: 16, padding: 16 }]}>
        <Text style={[GlobalStyles.subtitle, { marginBottom: 16, fontSize: 18 }]}>Próximas citas</Text>

        {upcomingAppointments.length > 0 ? (
          upcomingAppointments.map((apt) => (
            <View
              key={apt.id ?? `${apt.patient?.id ?? Math.random()}`}
              style={{
                padding: 16,
                borderRadius: 12,
                marginBottom: 12,
                backgroundColor: "#00796b",
                borderLeftWidth: 4,
                borderLeftColor: getStatusColor(apt.status),
              }}
            >
              <View style={[GlobalStyles.row, GlobalStyles.spaceBetween]}>
                <View style={{ flex: 1 }}>
                  <Text style={[GlobalStyles.text, { fontWeight: "600", marginBottom: 4, color: "#fff" }]}>
                    {apt.patient?.name ?? ""} {apt.patient?.surname ?? ""}
                  </Text>
                  <Text style={[GlobalStyles.textSmall, { marginBottom: 2, color: "#e0e0e0" }]}>
                    {"📅 "}
                    {new Date(apt.appointment_date).toLocaleDateString("es-ES")}
                  </Text>
                  <Text style={[GlobalStyles.textSmall, { marginBottom: 4, color: "#e0e0e0" }]}>
                    {"🕐 "}
                    {new Date(apt.appointment_date).toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
                <View style={[GlobalStyles.center, { marginLeft: 16 }]}>
                  <View
                    style={{
                      backgroundColor: getStatusColor(apt.status),
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 12,
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "600" }}>{getStatusText(apt.status)}</Text>
                  </View>
                </View>
              </View>
            </View>
          ))
        ) : (
          // Si no hay próximas citas
          <View style={[GlobalStyles.center, { paddingVertical: 20 }]}>
            <Ionicons name="calendar-outline" size={48} color="#9e9e9e" />
            <Text style={[GlobalStyles.text, { color: "#9e9e9e", marginTop: 8 }]}>
              No tienes citas próximas
            </Text>
          </View>
        )}
      </View>

      {/* Acciones rápidas del panel */}
      <View style={[GlobalStyles.card, { marginBottom: 40, borderRadius: 16, padding: 16 }]}>
        <Text style={[GlobalStyles.subtitle, { marginBottom: 16, fontSize: 18 }]}>Acciones rápidas</Text>
        <View style={[GlobalStyles.row, { justifyContent: "space-around" }]}>
          {/* Botón para ir a las citas */}
          <TouchableOpacity
            style={[GlobalStyles.dashboardButton, { backgroundColor: "#3949ab" }]}
            onPress={() => navigation.navigate("Appointments")}
          >
            <Ionicons name="calendar" size={28} color="#fff" />
            <Text style={[GlobalStyles.textSmallBold, { color: "#fff" }]}>Ver Citas</Text>
          </TouchableOpacity>

          {/* Botón para ver horarios */}
          <TouchableOpacity
            style={[GlobalStyles.dashboardButton, { backgroundColor: "#00796b" }]}
            onPress={() => navigation.navigate("Schedule")}
          >
            <Ionicons name="time" size={28} color="#fff" />
            <Text style={[GlobalStyles.textSmallBold, { color: "#fff" }]}>Horarios</Text>
          </TouchableOpacity>

          {/* Botón para acceder al perfil */}
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
  );
}
