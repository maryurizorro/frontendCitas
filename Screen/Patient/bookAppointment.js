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
  const [specialties, setSpecialties] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerKey, setPickerKey] = useState(0);

  const availableTimes = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
  ];

  useEffect(() => {
    fetchSpecialties();
  }, []);

  useEffect(() => {
    if (selectedSpecialty) {
      fetchDoctorsBySpecialty(selectedSpecialty);
    } else {
      setDoctors([]);
      setSelectedDoctor('');
    }
  }, [selectedSpecialty]);

  const fetchSpecialties = async () => {
    try {
      console.log('Fetching specialties...');
      const response = await specialtyAPI.getSpecialties();
      console.log('Specialties response:', response.data);
      if (response.data.success) {
        const specialtiesData = response.data.data || [];
        console.log('Specialties found:', specialtiesData.length);
        setSpecialties(specialtiesData);
      }
    } catch (error) {
      console.log('Error fetching specialties:', error);
      console.log('Error response:', error.response?.data);
      NotificationService.showError('Error', 'No se pudieron cargar las especialidades');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDoctorsBySpecialty = async (specialtyId) => {
    try {
      console.log('Fetching doctors for specialty:', specialtyId);
      const response = await userAPI.getDoctorsBySpecialty(specialtyId);
      console.log('Doctors response:', response.data);
      if (response.data.success) {
        const doctorsData = response.data.data || [];
        console.log('Doctors found:', doctorsData.length);
        setDoctors(doctorsData);
        setPickerKey(prev => prev + 1); // Force picker re-render
      } else {
        console.log('API returned success=false');
        setDoctors([]);
        setPickerKey(prev => prev + 1);
      }
    } catch (error) {
      console.log('Error fetching doctors:', error);
      console.log('Error response:', error.response?.data);
      NotificationService.showError('Error', 'No se pudieron cargar los doctores');
      setDoctors([]);
    }
  };

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || selectedDate;
    setShowDatePicker(Platform.OS === 'ios');
    setSelectedDate(currentDate);
  };

  const showDatepicker = () => {
    setShowDatePicker(true);
  };

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
    return true;
  };

  const resetForm = () => {
    setSelectedSpecialty('');
    setSelectedDoctor('');
    setSelectedDate(new Date());
    setSelectedTime('');
    setNotes('');
    setDoctors([]);
    setPickerKey(prev => prev + 1);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const appointmentData = {
        doctor_id: selectedDoctor,
        specialty_id: selectedSpecialty,
        date: selectedDate.toISOString().split('T')[0],
        time: selectedTime,
        notes: notes.trim() || null,
        status: 'pending'
      };

      const response = await appointmentAPI.createAppointment(appointmentData);

      if (response.data.success) {
        NotificationService.showSuccess(
          '¡Cita reservada!',
          'Tu cita ha sido reservada exitosamente. Puedes reservar otra cita si lo deseas.'
        );
        // Reset form fields for new appointment
        resetForm();
      } else {
        NotificationService.showError('Error', response.data.message || 'No se pudo reservar la cita');
      }
    } catch (error) {
      console.log('Error creating appointment:', error);
      const errorMessage = error.response?.data?.message || 'No se pudo reservar la cita';
      NotificationService.showError('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[GlobalStyles.container, GlobalStyles.center]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={GlobalStyles.container} showsVerticalScrollIndicator={false}>
      <View style={GlobalStyles.card}>
        <View style={[GlobalStyles.row, { alignItems: 'center', marginBottom: 20 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
            <Ionicons name="arrow-back" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={GlobalStyles.title}>Reservar Cita</Text>
        </View>

        {/* Especialidad */}
        <View style={{ marginBottom: 20 }}>
          <Text style={[GlobalStyles.textSmall, { marginBottom: 8, fontWeight: '600' }]}>
            Especialidad médica *
          </Text>
          <View style={[GlobalStyles.input, { paddingVertical: 0 }]}>
            <Picker
              selectedValue={selectedSpecialty}
              onValueChange={(itemValue) => setSelectedSpecialty(itemValue)}
              style={{ height: 50 }}
            >
              <Picker.Item label="Selecciona una especialidad" value="" />
              {specialties.map((specialty) => (
                <Picker.Item key={specialty.id} label={specialty.name} value={specialty.id} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Doctor */}
        <View style={{ marginBottom: 20 }}>
          <Text style={[GlobalStyles.textSmall, { marginBottom: 8, fontWeight: '600' }]}>
            Doctor * ({doctors.length} disponibles)
          </Text>
          <View style={[GlobalStyles.input, { paddingVertical: 0 }]}>
            <Picker
              selectedValue={selectedDoctor}
              onValueChange={(itemValue) => setSelectedDoctor(itemValue)}
              style={{ height: 50 }}
              enabled={!!selectedSpecialty && doctors.length > 0}
              key={`doctor-picker-${pickerKey}`}
            >
              <Picker.Item label={doctors.length === 0 ? "No hay doctores disponibles" : "Selecciona un doctor"} value="" />
              {doctors.map((doctor) => (
                <Picker.Item
                  key={`doctor-${doctor.id}`}
                  label={`Dr. ${doctor.name} ${doctor.surname}`}
                  value={doctor.id}
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* Fecha */}
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

        {/* Hora */}
        <View style={{ marginBottom: 20 }}>
          <Text style={[GlobalStyles.textSmall, { marginBottom: 8, fontWeight: '600' }]}>
            Hora de la cita *
          </Text>
          <View style={[GlobalStyles.input, { paddingVertical: 0 }]}>
            <Picker
              selectedValue={selectedTime}
              onValueChange={(itemValue) => setSelectedTime(itemValue)}
              style={{ height: 50 }}
            >
              <Picker.Item label="Selecciona una hora" value="" />
              {availableTimes.map((time) => (
                <Picker.Item key={time} label={time} value={time} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Notas */}
        <View style={{ marginBottom: 30 }}>
          <Text style={[GlobalStyles.textSmall, { marginBottom: 8, fontWeight: '600' }]}>
            Notas adicionales (opcional)
          </Text>
          <View style={[GlobalStyles.input, { 
            height: 100, 
            textAlignVertical: 'top',
            paddingTop: 16
          }]}>
            <TextInput
              placeholder="Describe brevemente el motivo de tu consulta..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              style={{ 
                flex: 1, 
                fontSize: 16, 
                color: Colors.textPrimary,
                textAlignVertical: 'top'
              }}
              placeholderTextColor={Colors.textLight}
            />
          </View>
        </View>

        {/* Botón de reservar */}
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

        {/* Información adicional */}
        <View style={[GlobalStyles.backgroundPastelBlue, { 
          padding: 16, 
          borderRadius: 12, 
          marginTop: 20 
        }]}>
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