import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from "react";
import { authAPI } from '../Services/conexion';

const AuthContext = createContext();

// Proveedor del contexto: envuelve toda la app y maneja los datos del usuario autenticado
export const AuthProvider = ({ children }) => {
  // Guarda la información del usuario autenticado
  const [user, setUser] = useState(null);
  // Guarda el token de autenticación del usuario
  const [token, setToken] = useState(null);
  // Controla si se está verificando el estado de autenticación (cargando)
  const [isLoading, setIsLoading] = useState(true);

  // Al cargar el componente, verifica si el usuario ya está autenticado
  useEffect(() => {
    checkAuthState();
  }, []);

  // Verifica si hay un token guardado y valida su validez con el backend
  const checkAuthState = async () => {
    try {
      // Obtiene el token guardado en almacenamiento local
      const storedToken = await AsyncStorage.getItem('token');
      if (storedToken) {
        // Si existe un token, llama al endpoint /me para obtener los datos del usuario
        const response = await authAPI.me();
        if (response.data.success) {
          // Si la respuesta es válida, guarda los datos del usuario y el token
          setUser(response.data.usuario);
          setToken(storedToken);
        } else {
          // Si el token ya no es válido, se elimina del almacenamiento
          await AsyncStorage.removeItem('token');
        }
      }
    } catch (error) {
      // Si hay un error al validar el token, se elimina para evitar sesiones corruptas
      console.log('Error checking auth state:', error);
      await AsyncStorage.removeItem('token');
    } finally {
      // Indica que ya terminó la verificación del estado de autenticación
      setIsLoading(false);
    }
  };

  // Inicia sesión: guarda los datos del usuario y token en memoria y almacenamiento local
  const login = async (userData, tokenData) => {
    setUser(userData);
    setToken(tokenData);
    await AsyncStorage.setItem('token', tokenData);
  };

  // Cierra sesión: borra los datos del usuario, token y lo elimina del almacenamiento
  const logout = async () => {
    try {
      // Intenta cerrar sesión en el backend también
      await authAPI.logout();
    } catch (error) {
      console.log('Error during logout:', error);
    } finally {
      // Limpia todos los datos locales de sesión
      setUser(null);
      setToken(null);
      await AsyncStorage.removeItem('token');
    }
  };

  // Verifica si el usuario está autenticado
  const isAuthenticated = () => {
    return user !== null && token !== null;
  };

  // Verifica si el usuario autenticado es de tipo "paciente"
  const isPatient = () => {
    return user?.role === 'patient';
  };

  // Verifica si el usuario autenticado es de tipo "doctor"
  const isDoctor = () => {
    return user?.role === 'doctor';
  };

  // Verifica si el usuario autenticado es de tipo "administrador"
  const isAdmin = () => {
    return user?.role === 'admin';
  };

  // Proporciona las funciones y datos a toda la aplicación mediante el contexto
  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      isLoading,
      login, 
      logout, 
      isAuthenticated,
      isPatient,
      isDoctor,
      isAdmin
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar el contexto de autenticación fácilmente en cualquier componente
export const useAuth = () => {
  return useContext(AuthContext);
};

