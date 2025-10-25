import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Constants } from 'expo-constants';

// Configuración de URL base según el entorno
const getApiBaseUrl = () => {
  // En desarrollo (Expo Go) - usar IP de red local para acceso desde móvil/emulador
  if (__DEV__) {
    return 'http://10.2.234.181:8000/api';
  }

  // En producción (APK), usar una URL HTTPS confiable
  // Cambia esta URL por tu dominio de producción
  return 'https://tu-dominio-produccion.com/api';
};

const API_BASE_URL = getApiBaseUrl();


const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 segundos timeout
});

// Interceptor para agregar token automáticamente
api.interceptors.request.use(async (config) => {
  try {
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

// Interceptor para manejar respuestas y errores de autenticación
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  async (error) => {
    console.error('API Error:', error.response?.status, error.response?.data || error.message);

    // Si es error 401 (no autorizado), limpiar token y redirigir a login
    if (error.response?.status === 401) {
      console.log('Token inválido o expirado, limpiando sesión...');
      await AsyncStorage.removeItem('token');

      // Solo mostrar error si no es un endpoint público
      const publicEndpoints = ['/login', '/registro', '/especialidades'];
      const isPublicEndpoint = publicEndpoints.some(endpoint =>
        error.config.url.includes(endpoint)
      );

      if (!isPublicEndpoint) {
        console.log('Redirigiendo a login por token inválido');
        // Aquí podrías emitir un evento para redirigir al login
      }
    }

    return Promise.reject(error);
  }
);

// Interceptor para respuestas
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data || error.message);

    // Si es un error 401, intentar refrescar el token automáticamente
    if (error.response?.status === 401 && !error.config._retry) {
      console.log('Token expired, attempting to refresh...');
      error.config._retry = true;

      // Aquí podrías implementar lógica para refrescar el token
      // Por ahora, solo logueamos y rechazamos
    }

    return Promise.reject(error);
  }
);

// ====================== AUTH ======================
export const authAPI = {
  login: async (email, password) => {
    try {
      const response = await api.post('/login', { email, password });
      if (response.data.success && response.data.token) {
        const token = response.data.token;
        await AsyncStorage.setItem('token', token);
        console.log('Token saved successfully');
      }
      return response;
    } catch (error) {
      console.error('Login API error:', error.response?.data);
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
    const token = response.data.token;
    await AsyncStorage.setItem('token', token);
    return response;
  },

  logout: async () => {
    await AsyncStorage.removeItem('token');
    return api.post('/logout');
  },

  me: async () => api.get('/usuarioActual'),
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
