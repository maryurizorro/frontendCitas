import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://192.168.10.223:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token automáticamente
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ====================== AUTH ======================
export const authAPI = {
  login: async (email, password) => {
    const response = await api.post('/login', { email, password });
    const token = response.data.token;
    await AsyncStorage.setItem('token', token);
    return response;
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
  createAppointment: (data) => api.post('/crearCita', data),
  updateAppointment: (id, data) => api.put(`/actualizarCita/${id}`, data),
  deleteAppointment: (id) => api.delete(`/eliminarCita/${id}`),
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
