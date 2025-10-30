import Toast from 'react-native-toast-message';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configurar el handler de notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const NotificationService = {
  // Toast notifications (in-app)
  showSuccess: (title, message) => {
    Toast.show({
      type: 'success',
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: 3000,
    });
  },

  showError: (title, message) => {
    Toast.show({
      type: 'error',
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: 4000,
    });
  },

  showInfo: (title, message) => {
    Toast.show({
      type: 'info',
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: 3000,
    });
  },

  showWarning: (title, message) => {
    Toast.show({
      type: 'info',
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: 3000,
    });
  },

  // Push notifications (system notifications) - Solo para APK
  showAppointmentNotification: async (status, data = {}) => {
    if (__DEV__) return; // No mostrar en desarrollo (Expo Go)

    const messages = {
      pending: {
        title: 'Cita Programada',
        body: `Tu cita con ${data.doctor_name || 'el doctor'} está pendiente de confirmación.`,
      },
      confirmed: {
        title: 'Cita Confirmada',
        body: `Tu cita con ${data.doctor_name || 'el doctor'} ha sido confirmada.`,
      },
      completed: {
        title: 'Cita Completada',
        body: 'Tu cita médica ha sido completada.',
      },
      cancelled: {
        title: 'Cita Cancelada',
        body: 'Tu cita médica ha sido cancelada.',
      },
    };

    const notification = messages[status] || messages.pending;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
          vibrate: [0, 250, 250, 250],
        },
        trigger: null, // Mostrar inmediatamente
      });
    } catch (error) {
      console.log('Error showing push notification:', error);
    }
  },

  // Notificaciones del sistema - Solo para APK
  showLoginNotification: async () => {
    if (__DEV__) return;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔔 Inicio de sesión exitoso',
          body: 'Has iniciado sesión correctamente.',
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.DEFAULT,
          vibrate: [0, 250, 250, 250],
        },
        trigger: null,
      });
    } catch (error) {
      console.log('Error showing login notification:', error);
    }
  },

  showLogoutNotification: async () => {
    if (__DEV__) return;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🚪 Sesión cerrada',
          body: 'Tu sesión ha sido cerrada.',
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.DEFAULT,
          vibrate: [0, 250, 250, 250],
        },
        trigger: null,
      });
    } catch (error) {
      console.log('Error showing logout notification:', error);
    }
  },

  showNewDoctorNotification: async () => {
    if (__DEV__) return;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '👨‍⚕️ Nuevo doctor registrado',
          body: 'Se ha agregado un nuevo doctor al sistema.',
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.DEFAULT,
          vibrate: [0, 250, 250, 250],
        },
        trigger: null,
      });
    } catch (error) {
      console.log('Error showing new doctor notification:', error);
    }
  },

  showNewAdminNotification: async () => {
    if (__DEV__) return;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '👑 Nuevo administrador registrado',
          body: 'Se ha agregado un nuevo administrador al sistema.',
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.DEFAULT,
          vibrate: [0, 250, 250, 250],
        },
        trigger: null,
      });
    } catch (error) {
      console.log('Error showing new admin notification:', error);
    }
  },

  showNewPatientNotification: async () => {
    if (__DEV__) return;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '👤 Nuevo paciente registrado',
          body: 'Se ha registrado un nuevo paciente en el sistema.',
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.DEFAULT,
          vibrate: [0, 250, 250, 250],
        },
        trigger: null,
      });
    } catch (error) {
      console.log('Error showing new patient notification:', error);
    }
  },

  // Gestión de permisos y tokens - Solo para APK
  requestPermissions: async () => {
    if (__DEV__) return true; // En desarrollo no necesitamos permisos

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Permisos de notificación denegados');
        return false;
      }

      return true;
    } catch (error) {
      console.log('Error requesting permissions:', error);
      return false;
    }
  },

  getExpoPushToken: async () => {
    try {
      const token = await Notifications.getExpoPushTokenAsync();
      console.log('Expo Push Token:', token.data);
      await AsyncStorage.setItem('expoPushToken', token.data);
      return token.data;
    } catch (error) {
      console.error('Error obteniendo push token:', error);
      return null;
    }
  },

  // Configurar listener para notificaciones entrantes - Solo para APK
  setupNotificationListener: () => {
    if (__DEV__) return () => {}; // En desarrollo no necesitamos listener

    try {
      const notificationListener = Notifications.addNotificationReceivedListener(notification => {
        console.log('Notificación recibida:', notification);
      });

      const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('Respuesta de notificación:', response);
      });

      // Retornar función de cleanup
      return () => {
        notificationListener.remove();
        responseListener.remove();
      };
    } catch (error) {
      console.log('Error setting up notification listener:', error);
      return () => {};
    }
  },

  // Notificación para recordatorio de citas pendientes para médicos
  showDoctorPendingAppointmentsNotification: async (pendingCount) => {
    const title = '🩺 ¡Atención requerida!';
    const body = `Tienes ${pendingCount} cita(s) pendiente(s) que requieren tu atención inmediata.`;

    try {
      // Siempre usar notificación local con vibración fuerte para alertar al médico
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.MAX,
          vibrate: [0, 500, 200, 500, 200, 500], // Patrón de vibración más intenso
          sticky: true, // Mantener la notificación visible hasta que se interactúe
        },
        trigger: null, // Mostrar inmediatamente
      });

      // También mostrar toast in-app para reforzar la alerta
      this.showWarning('Citas Pendientes', `Tienes ${pendingCount} cita(s) pendiente(s) que requieren tu atención.`);
    } catch (error) {
      console.log('Error showing doctor pending appointments notification:', error);
    }
  },
};