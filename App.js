import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import * as Notifications from "expo-notifications";
import * as Haptics from "expo-haptics"; // para vibración
import { AuthProvider } from "./src/Context/AuthContext";
import RootNavigator from "./src/Navegation/RootNavigator";
import { NotificationService } from "./src/Components/NotificationService";

export default function App() {
  useEffect(() => {
    // Configuración general del comportamiento de las notificaciones
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,   // muestra alerta visual
        shouldPlaySound: true,   // sonido habilitado para alertas médicas
        shouldSetBadge: false,   // no cambia el icono del app
      }),
    });

    // Solo configurar notificaciones push en APK (no en Expo Go)
    if (!__DEV__) {
      const setupNotifications = async () => {
        // Solicitar permisos
        const hasPermission = await NotificationService.requestPermissions();
        if (hasPermission) {
          // Obtener token de Expo para push notifications
          await NotificationService.getExpoPushToken();
        }

        // Configurar listeners de notificaciones
        const cleanup = NotificationService.setupNotificationListener();

        return cleanup;
      };

      // Configurar notificaciones
      const cleanupPromise = setupNotifications();

      // Cleanup
      return () => {
        cleanupPromise.then(cleanup => cleanup && cleanup());
      };
    } else {
      // En desarrollo, configurar vibración intensa para notificaciones médicas
      const subscription = Notifications.addNotificationReceivedListener((notification) => {
        // Vibración más intensa para notificaciones de citas pendientes
        if (notification.request.content.title.includes('Atención requerida') ||
            notification.request.content.title.includes('citas pendientes')) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); // Vibración más fuerte
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      });

      return () => subscription.remove();
    }
  }, []);

  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
        <Toast />
      </NavigationContainer>
    </AuthProvider>
  );
}
