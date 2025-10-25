import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { Colors } from '../../src/Components/Colors';
import { NotificationService } from '../../src/Components/NotificationService';
import { GlobalStyles } from '../../src/Components/Styles';
import { appointmentAPI, specialtyAPI, userAPI } from '../../src/Services/conexion';

export default function BookAppointment({ navigation }) {
  // Estados para manejar los datos y la interfaz
  const [specialties, setSpecialties] = useState([]); // Lista de especialidades médicas
  const [doctors, setDoctors] = useState([]); // Lista de doctores según la especialidad
  const [selectedSpecialty, setSelectedSpecialty] = useState(''); // Especialidad seleccionada
  const [selectedDoctor, setSelectedDoctor] = useState(''); // Doctor seleccionado
  const [selectedDate, setSelectedDate] = useState(new Date()); // Fecha elegida
  const [selectedTime, setSelectedTime] = useState(''); // Hora seleccionada
  const [notes, setNotes] = useState(''); // Notas adicionales
  const [isLoading, setIsLoading] = useState(true); // Estado de carga inicial
  const [isSubmitting, setIsSubmitting] = useState(false); // Estado al enviar el formulario
  const [showDatePicker, setShowDatePicker] = useState(false); // Mostrar/ocultar selector de fecha
  const [pickerKey, setPickerKey] = useState(0); // Clave para forzar renderizado del Picker
  const [isAvailable, setIsAvailable] = useState(null); // Estado de disponibilidad (sin mensajes)

  // Horas disponibles para citas
  const availableTimes = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
  ];

  // Cargar especialidades al montar el componente
  useEffect(() => {
    console.log('BookAppointment component mounted');
    fetchSpecialties();
  }, []);

  // Cargar doctores cuando cambia la especialidad seleccionada
  useEffect(() => {
    if (selectedSpecialty) {
      fetchDoctorsBySpecialty(selectedSpecialty);
    } else {
      setDoctors([]);
      setSelectedDoctor('');
    }
  }, [selectedSpecialty]);

  // Validar disponibilidad cuando cambian fecha, hora o doctor
  useEffect(() => {
    if (selectedDoctor && selectedDate && selectedTime) {
      validateDoctorAvailability();
    }
  }, [selectedDoctor, selectedDate, selectedTime]);

  // Función para obtener todas las especialidades del backend
  const fetchSpecialties = async () => {
    try {
      console.log('Fetching specialties...');
      const response = await specialtyAPI.getSpecialties();
      console.log('Specialties response:', response.data);
      if (response.data.success) {
        const specialtiesData = response.data.data || [];
        console.log('Specialties found:', specialtiesData.length);
        setSpecialties(specialtiesData);
      } else {
        console.log('API returned success=false');
        NotificationService.showError('Error', 'No se pudieron cargar las especialidades');
      }
    } catch (error) {
      console.log('Error fetching specialties:', error);
      console.log('Error details:', error.response?.data, error.message);
      NotificationService.showError('Error', 'No se pudieron cargar las especialidades');
    } finally {
      setIsLoading(false);
    }
  };

  // Función para obtener los doctores de una especialidad seleccionada
  const fetchDoctorsBySpecialty = async (specialtyId) => {
    try {
      console.log('Fetching doctors for specialty:', specialtyId);
      const response = await userAPI.getDoctorsBySpecialty(specialtyId);
      console.log('Doctors response:', response.data);
      if (response.data.success) {
        const doctorsData = response.data.data || [];
        console.log('Doctors found:', doctorsData.length);
        setDoctors(doctorsData);
        setPickerKey(prev => prev + 1); // Forzar actualización del selector
      } else {
        setDoctors([]);
        setPickerKey(prev => prev + 1);
      }
    } catch (error) {
      console.log('Error fetching doctors:', error);
      NotificationService.showError('Error', 'No se pudieron cargar los doctores');
      setDoctors([]);
    }
  };

  // Función para validar la disponibilidad del doctor (sin mostrar mensajes)
  const validateDoctorAvailability = async () => {
    if (!selectedDoctor || !selectedDate || !selectedTime) {
      setIsAvailable(null);
      return;
    }

    try {
      // Usar el endpoint de médicos disponibles para validar
      const availabilityData = {
        specialty_id: selectedSpecialty,
        appointment_date: selectedDate.toISOString().split('T')[0] + ' ' + selectedTime + ':00'
      };

      const response = await appointmentAPI.getAvailableDoctors(availabilityData);

      if (response.data.success) {
        const availableDoctors = response.data.data || [];
        const isDoctorAvailable = availableDoctors.some(doctor => doctor.id == selectedDoctor);
        setIsAvailable(isDoctorAvailable);
      } else {
        setIsAvailable(false);
      }
    } catch (error) {
      console.log('Error validating availability:', error);
      setIsAvailable(false);
    }
  };

  // Manejador para el cambio de fecha
  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || selectedDate;
    setShowDatePicker(Platform.OS === 'ios');
    setSelectedDate(currentDate);
  };

  // Mostrar el selector de fecha
  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  // Validación básica del formulario antes de enviar
  const validateForm = () => {
    if (!selectedSpecialty) {
      NotificationService.showError('Error', 'Por favor selecciona una especialidad');
      return false;
    }
    if (!selectedDoctor) {
      NotificationService.showError('Error', 'Por favor selecciona un doctor');
      return false;
    }
    if (!selectedDate) {
      NotificationService.showError('Error', 'Por favor selecciona una fecha');
      return false;
    }
    if (!selectedTime) {
      NotificationService.showError('Error', 'Por favor selecciona una hora');
      return false;
    }
    if (isAvailable === false) {
      NotificationService.showError('Doctor no disponible', 'El doctor ya tiene una cita programada en esa fecha y hora. Por favor selecciona otra fecha u hora.');
      return false;
    }
    return true;
  };

  // Reinicia el formulario después de reservar una cita
  const resetForm = () => {
    setSelectedSpecialty('');
    setSelectedDoctor('');
    setSelectedDate(new Date());
    setSelectedTime('');
    setNotes('');
    setDoctors([]);
    setPickerKey(prev => prev + 1);
  };

  // Enviar los datos de la cita al backend
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Datos que se envían a la API
      const appointmentData = {
        doctor_id: selectedDoctor,
        specialty_id: selectedSpecialty,
        date: selectedDate.toISOString().split('T')[0], // Solo la parte de la fecha
        time: selectedTime,
        notes: notes.trim() || null,
        status: 'pending'
      };

      // Petición al backend
      const response = await appointmentAPI.createAppointment(appointmentData);

      // Si la respuesta fue exitosa
      if (response.data.success) {
        NotificationService.showSuccess(
          '¡Cita reservada!',
          'Tu cita ha sido reservada exitosamente. Recibirás una confirmación por email.'
        );

        // Mostrar notificación del sistema con vibración (solo en APK)
        if (!__DEV__) {
          NotificationService.showAppointmentNotification('pending', {
            doctor_name: doctors.find(d => d.id == selectedDoctor)?.name + ' ' + doctors.find(d => d.id == selectedDoctor)?.surname,
          });
        }

        resetForm();
        setIsAvailable(null);
      } else {
        NotificationService.showError('Error', response.data.message || 'No se pudo reservar la cita');
      }
    } catch (error) {
      console.log('Error creating appointment:', error);

      // Mostrar errores de validación del backend
      if (error.response?.status === 422) {
        const errorMessage = error.response?.data?.message || 'No se pudo reservar la cita';
        NotificationService.showError('Error', errorMessage);
      } else if (error.response?.status !== 401) {
        // Solo mostrar errores que no sean 401 (autenticación)
        // Los 401 durante creación de citas son falsos positivos
        const errorMessage = error.response?.data?.message || 'No se pudo reservar la cita';
        NotificationService.showError('Error', errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mostrar indicador de carga mientras se obtienen las especialidades
  if (isLoading) {
    console.log('Showing loading screen');
    return (
      <View style={[GlobalStyles.container, GlobalStyles.center]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={[GlobalStyles.text, { marginTop: 16 }]}>Cargando especialidades...</Text>
      </View>
    );
  }

  // Mostrar mensaje de error si no hay especialidades después de cargar
  if (!isLoading && specialties.length === 0) {
    console.log('No specialties loaded, showing error message');
    return (
      <View style={[GlobalStyles.container, GlobalStyles.center]}>
        <Text style={[GlobalStyles.text, { textAlign: 'center', marginBottom: 20 }]}>
          No se pudieron cargar las especialidades.
        </Text>
        <TouchableOpacity
          style={GlobalStyles.buttonPrimary}
          onPress={fetchSpecialties}
        >
          <Text style={GlobalStyles.buttonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Interfaz principal de la pantalla
  console.log('Rendering BookAppointment, isLoading:', isLoading, 'specialties:', specialties.length);
  return (
    <ScrollView style={GlobalStyles.container} showsVerticalScrollIndicator={false}>
      <View style={GlobalStyles.card} key="book-appointment-main">
        {/* Encabezado con botón atrás */}
        <View style={[GlobalStyles.row, { alignItems: 'center', marginBottom: 20 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
            <Ionicons name="arrow-back" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={GlobalStyles.title}>Reservar Cita</Text>
        </View>

        {/* Selector de especialidad médica */}
        <View style={{ marginBottom: 20 }} key="specialty-selector">
          <Text style={[GlobalStyles.textSmall, { marginBottom: 8, fontWeight: '600' }]}>
            Especialidad médica *
          </Text>
          <View style={[GlobalStyles.input, { paddingVertical: 0 }]}>
            <Picker
              selectedValue={selectedSpecialty}
              onValueChange={(itemValue) => setSelectedSpecialty(itemValue)}
              style={{ height: 50, color: Colors.textPrimary }}
              itemStyle={{ color: Colors.textPrimary }}
            >
              <Picker.Item label="Selecciona una especialidad" value="" />
              {specialties.map((specialty) => (
                <Picker.Item key={`specialty-${specialty.id}`} label={specialty.name} value={specialty.id} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Selector de doctor */}
        <View style={{ marginBottom: 20 }} key="doctor-selector">
          <Text style={[GlobalStyles.textSmall, { marginBottom: 8, fontWeight: '600' }]}>
            Doctor * ({doctors.length} disponibles)
          </Text>
          <View style={[GlobalStyles.input, { paddingVertical: 0 }]}>
            <Picker
              selectedValue={selectedDoctor}
              onValueChange={(itemValue) => setSelectedDoctor(itemValue)}
              style={{ height: 50, color: Colors.textPrimary }}
              itemStyle={{ color: Colors.textPrimary }}
              enabled={!!selectedSpecialty && doctors.length > 0}
              key={`doctor-picker-${pickerKey}`}
            >
              <Picker.Item label={doctors.length === 0 ? "No hay doctores disponibles" : "Selecciona un doctor"} value="" />
              {doctors.map((doctor) => (
                <Picker.Item
                  key={`doctor-${doctor.id}-${pickerKey}`}
                  label={`Dr. ${doctor.name} ${doctor.surname}`}
                  value={doctor.id}
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* Selector de fecha */}
        <View style={{ marginBottom: 20 }}>
          <Text style={[GlobalStyles.textSmall, { marginBottom: 8, fontWeight: '600' }]}>
            Fecha de la cita *
          </Text>
          <TouchableOpacity
            style={[GlobalStyles.input, { justifyContent: 'center' }]}
            onPress={showDatepicker}
          >
            <Text style={{ fontSize: 16, color: selectedDate ? Colors.textPrimary : Colors.textLight }}>
              {selectedDate ? selectedDate.toLocaleDateString('es-ES') : 'Selecciona una fecha'}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              onChange={onDateChange}
              minimumDate={new Date()}
            />
          )}
        </View>

        {/* Selector de hora */}
        <View style={{ marginBottom: 20 }} key="time-selector">
          <Text style={[GlobalStyles.textSmall, { marginBottom: 8, fontWeight: '600' }]}>
            Hora de la cita *
          </Text>
          <View style={[GlobalStyles.input, { paddingVertical: 0 }]}>
            <Picker
              selectedValue={selectedTime}
              onValueChange={(itemValue) => setSelectedTime(itemValue)}
              style={{ height: 50, color: Colors.textPrimary }}
              itemStyle={{ color: Colors.textPrimary }}
            >
              <Picker.Item label="Selecciona una hora" value="" />
              {availableTimes.map((time) => (
                <Picker.Item key={`time-${time}`} label={time} value={time} />
              ))}
            </Picker>
          </View>
        </View>


        {/* Campo de notas opcional */}
        <View style={{ marginBottom: 30 }}>
          <Text style={[GlobalStyles.textSmall, { marginBottom: 8, fontWeight: '600' }]}>
            Notas adicionales (opcional)
          </Text>
          <View style={[GlobalStyles.input, { height: 100, textAlignVertical: 'top', paddingTop: 16 }]}>
            <TextInput
              placeholder="Describe brevemente el motivo de tu consulta..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              style={{ flex: 1, fontSize: 16, color: Colors.textPrimary, textAlignVertical: 'top' }}
              placeholderTextColor={Colors.textLight}
            />
          </View>
        </View>

        {/* Botón de reservar cita */}
        <TouchableOpacity
          style={[GlobalStyles.buttonPrimary, { opacity: isSubmitting ? 0.7 : 1 }]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={Colors.backgroundCard} />
          ) : (
            <Text style={GlobalStyles.buttonText}>Reservar Cita</Text>
          )}
        </TouchableOpacity>

        {/* Información adicional para el usuario */}
        <View style={[GlobalStyles.backgroundPastelBlue, { padding: 16, borderRadius: 12, marginTop: 20 }]}>
          <View style={[GlobalStyles.row, { alignItems: 'flex-start' }]}>
            <Ionicons name="information-circle" size={20} color={Colors.info} style={{ marginRight: 12, marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={[GlobalStyles.textSmall, { fontWeight: '600', marginBottom: 4 }]}>
                Información importante
              </Text>
              <Text style={[GlobalStyles.textSmall, { lineHeight: 18 }]}>
                • Llega 15 minutos antes de tu cita{'\n'}
                • Trae tu documento de identidad{'\n'}
                • Puedes cancelar hasta 24 horas antes{'\n'}
                • Recibirás una confirmación por email
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

