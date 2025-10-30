import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Constants } from 'expo-constants';

// Configuración de URL base según el entorno
const getApiBaseUrl = () => {
  // En desarrollo (Expo Go) - usar IP del host para emuladores/dispositivos
  if (__DEV__) {
    // Para Android emulator: usar 10.0.2.2 (IP del host) o la IP real si no funciona
    // Para iOS simulator: usar localhost
    // Para dispositivo físico: usar la IP real del host (e.g., 192.168.1.8)
    return 'http://10.42.122.223:8000/api';
  }

  // En producción (APK), usar una URL HTTPS confiable
  // Cambia esta URL por tu dominio de producción
  return 'https://hollie-heteroecious-billi.ngrok-free.dev/api';
};

const API_BASE_URL = getApiBaseUrl();

// Variables para manejar el refresh de token
let isRefreshing = false;
let failedQueue = [];

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 segundos timeout para APIs lentas
});

// Interceptor para agregar token automáticamente
api.interceptors.request.use(async (config) => {
  try {
    // No agregar token para el endpoint de refresh
    if (config.url.includes('/refresh')) {
      console.log('API Request without token (refresh):', config.method?.toUpperCase(), config.url);
      return config;
    }
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('API Request with token:', config.method?.toUpperCase(), config.url);
    } else {
      console.log('API Request without token:', config.method?.toUpperCase(), config.url);
    }
    return config;
  } catch (error) {
    console.error('Error in request interceptor:', error);
    return config;
  }
});

// Función para procesar la cola de requests fallidos
const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Interceptor para manejar respuestas y errores de autenticación
const responseInterceptor = async (error) => {
  console.error('API Error:', error.response?.status, error.response?.data || error.message);

  const originalRequest = error.config;

  // Si es error 401 (no autorizado) y no es un retry
  if (error.response?.status === 401 && !originalRequest._retry) {
    if (isRefreshing) {
      // Si ya está refrescando, agregar a la cola
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(token => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      }).catch(err => {
        return Promise.reject(err);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    console.log('Token expired, attempting to refresh...');

    try {
      const newToken = await authAPI.refresh();
      processQueue(null, newToken);
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      console.log('Refresh failed, logging out...');
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('refresh_token');

      // Solo mostrar error si no es un endpoint público
      const publicEndpoints = ['/login', '/registro', '/especialidades', '/refresh'];
      const isPublicEndpoint = publicEndpoints.some(endpoint =>
        originalRequest.url.includes(endpoint)
      );

      if (!isPublicEndpoint) {
        console.log('Redirigiendo a login por token inválido');
        // Aquí podrías emitir un evento para redirigir al login
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }

  // Si es error 403 (prohibido), mostrar mensaje de acceso denegado
  if (error.response?.status === 403) {
    console.log('Acceso denegado:', error.response.data?.error);
    // Nota: No se puede usar NotificationService aquí directamente, pero se puede manejar en el componente
  }

  return Promise.reject(error);
};

api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  responseInterceptor
);


// ====================== AUTH ======================
export const authAPI = {
  login: async (email, password) => {
   try {
     console.log('Attempting login with email:', email);
     const response = await api.post('/login', { email, password });
     if (response.data.success && response.data.token) {
       const token = response.data.token;
       const refreshToken = response.data.refresh_token;
       await AsyncStorage.setItem('token', token);
       await AsyncStorage.setItem('refresh_token', refreshToken);
       console.log('Token and refresh token saved successfully');
     }
     return response;
   } catch (error) {
     console.error('Login API error:', error.message, error.response?.data, error.response?.status);
     throw error;
   }
 },

  register: async (name, surname, email, password, password_confirmation, role, specialty_id) => {
   const response = await api.post('/registro', {
     name,
     surname,
     email,
     password,
     password_confirmation,
     role,
     specialty_id,
   });
   if (response.data.success && response.data.token) {
     const token = response.data.token;
     const refreshToken = response.data.refresh_token;
     await AsyncStorage.setItem('token', token);
     await AsyncStorage.setItem('refresh_token', refreshToken);
   }
   return response;
 },

  logout: async () => {
   const refreshToken = await AsyncStorage.getItem('refresh_token');
   await AsyncStorage.removeItem('token');
   await AsyncStorage.removeItem('refresh_token');
   return api.post('/logout', refreshToken ? { refresh_token: refreshToken } : {});
 },

  me: async () => api.get('/usuarioActual'),

  refresh: async () => {
    try {
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      console.log('Attempting to refresh token with:', refreshToken.substring(0, 20) + '...');
      const response = await api.post('/refresh', { refresh_token: refreshToken });
      if (response.data.success && response.data.token) {
        const token = response.data.token;
        const newRefreshToken = response.data.refresh_token;
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('refresh_token', newRefreshToken);
        console.log('Token refreshed successfully');
        return token; // Return the new token for queue processing
      }
      throw new Error('Refresh failed: ' + (response.data.message || 'Unknown error'));
    } catch (error) {
      console.error('Refresh API error:', error.message || 'No error message', error.response?.data, error.response?.status);
      throw error;
    }
  },
};

// ====================== CITAS ======================
export const appointmentAPI = {
  getAppointments: () => api.get('/todasLasCitas'),
  getAppointmentsBySpecialty: (params) => api.get('/citasPorEspecialidad', { params }),
  myAppointments: () => api.get('/misCitas'),
  createAppointment: async (data) => {
    try {
      console.log('Creating appointment with data:', data);
      const response = await api.post('/crearCita', data);
      console.log('Appointment created successfully:', response.data);
      return response;
    } catch (error) {
      console.error('Create appointment API error:', error.response?.data);
      throw error;
    }
  },
  updateAppointment: (id, data) => api.put(`/actualizarCita/${id}`, data),
  deleteAppointment: (id) => api.delete(`/eliminarCita/${id}`),
  deletePastAppointments: () => api.delete('/eliminarCitasPasadas'),
  getAppointmentById: (id) => api.get(`/citaById/${id}`),
  rescheduleAppointment: (id, data) => api.put(`/reagendarCita/${id}`, data),
  getAvailableDoctors: (data) => api.get('/medicosDisponibles', { params: data }),
  getDoctorAppointments: () => api.get('/citasMedico'),
  getPendingAppointments: () => api.get('/citasPendientes'),
  acceptAppointment: (id) => api.put(`/aceptarCita/${id}`),
  rejectAppointment: (id, data) => api.put(`/rechazarCita/${id}`, data),
  completeAppointment: (id, data) => api.put(`/completarCita/${id}`, data),
  getPatientHistory: () => api.get('/historialPacientes'),
};

// ====================== ESPECIALIDADES ======================
export const specialtyAPI = {
  getSpecialties: () => api.get('/especialidades'),
  getSpecialtyById: (id) => api.get(`/especialidadById/${id}`),
  createSpecialty: (data) => api.post('/crearEspecialidad', data),
  updateSpecialty: (id, data) => api.put(`/updateEspecialidad/${id}`, data),
  deleteSpecialty: (id) => api.get(`/deleteEspecialidad/${id}`),
};

// ====================== USUARIOS ======================
export const userAPI = {
  getUsers: (params = {}) => api.get('/usuarios', { params }),
  getDoctors: () => api.get('/usuariosMedicos'),
  getPatients: () => api.get('/usuariosPacientes'),
  getUserById: (id) => api.get(`/usuarioById/${id}`),
  createUser: (data) => api.post('/crearUsuario', data),
  updateUser: (id, data) => api.put(`/actualizarUsuario/${id}`, data),
  deleteUser: (id) => api.delete(`/eliminarUsuario/${id}`),
  getProfile: () => api.get('/perfil'),
  updateProfile: (data) => api.put('/actualizarPerfil', data),
  getDoctorsBySpecialty: (specialtyId) => api.get(`/medicosPorEspecialidad/${specialtyId}`),
  getUserStats: (id) => api.get(`/estadisticasUsuario/${id}`),
};

// ====================== HORARIOS ======================
export const scheduleAPI = {
  getMySchedule: () => api.get('/miHorario'),
  updateMySchedule: (data) => api.put('/actualizarHorario', data),
};

// ====================== ESTADÍSTICAS ======================
export const statisticsAPI = {
  getGeneralStats: () => api.get('/estadisticasGenerales'),
  getStatsBySpecialty: () => api.get('/estadisticasPorEspecialidad'),
  getStatsByDoctor: (params) => api.get('/estadisticasPorMedico', { params }),
  getStatsByPeriod: (params) => api.get('/estadisticasPorPeriodo', { params }),
  getPerformanceStats: () => api.get('/estadisticasRendimiento'),
  getDoctorStats: () => api.get('/estadisticasMedico'),
};

export default api;
