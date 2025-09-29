import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Colors } from '../../src/Components/Colors';
import { NotificationService } from '../../src/Components/NotificationService';
import { GlobalStyles } from '../../src/Components/Styles';
import { scheduleAPI } from '../../src/Services/conexion';

export default function DoctorSchedule({ navigation }) {
  const [schedule, setSchedule] = useState({
    monday: { start: '08:00', end: '17:00', available: true },
    tuesday: { start: '08:00', end: '17:00', available: true },
    wednesday: { start: '08:00', end: '17:00', available: true },
    thursday: { start: '08:00', end: '17:00', available: true },
    friday: { start: '08:00', end: '17:00', available: true },
    saturday: { start: '08:00', end: '12:00', available: false },
    sunday: { start: '08:00', end: '12:00', available: false }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(true);

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    try {
      const response = await scheduleAPI.getMySchedule();
      if (response.data.success && response.data.data.length > 0) {
        // Convert API data to component format
        const apiSchedule = response.data.data;
        const newSchedule = { ...schedule };

        apiSchedule.forEach(item => {
          if (newSchedule[item.day_of_week]) {
            newSchedule[item.day_of_week] = {
              start: item.start_time.substring(0, 5),
              end: item.end_time.substring(0, 5),
              available: item.is_available
            };
          }
        });

        setSchedule(newSchedule);
      }
    } catch (error) {
      console.log('Error loading schedule:', error);
      // Keep default schedule if loading fails
    } finally {
      setIsLoadingSchedule(false);
    }
  };

  const days = [
    { key: 'monday', label: 'Lunes', icon: 'calendar' },
    { key: 'tuesday', label: 'Martes', icon: 'calendar' },
    { key: 'wednesday', label: 'Miércoles', icon: 'calendar' },
    { key: 'thursday', label: 'Jueves', icon: 'calendar' },
    { key: 'friday', label: 'Viernes', icon: 'calendar' },
    { key: 'saturday', label: 'Sábado', icon: 'calendar' },
    { key: 'sunday', label: 'Domingo', icon: 'calendar' }
  ];

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00', '18:30', '19:00'
  ];

  const toggleDayAvailability = (day) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        available: !prev[day].available
      }
    }));
  };

  const updateScheduleTime = (day, field, time) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: time
      }
    }));
  };

  const saveSchedule = async () => {
    setIsLoading(true);
    try {
      // Convert component format to API format
      const schedulesToSave = Object.entries(schedule).map(([day, data]) => ({
        day_of_week: day,
        start_time: data.start,
        end_time: data.end,
        is_available: data.available
      }));

      const response = await scheduleAPI.updateMySchedule({ schedules: schedulesToSave });

      if (response.data.success) {
        NotificationService.showSuccess('Horario actualizado', 'Tu horario ha sido guardado exitosamente');
      } else {
        throw new Error('Error en la respuesta del servidor');
      }
    } catch (error) {
      console.log('Error saving schedule:', error);
      NotificationService.showError('Error', 'No se pudo guardar el horario');
    } finally {
      setIsLoading(false);
    }
  };

  const renderDaySchedule = (dayKey, dayLabel) => {
    const daySchedule = schedule[dayKey];
    
    return (
      <View key={dayKey} style={[GlobalStyles.card, { marginBottom: 16 }]}>
        <View style={[GlobalStyles.row, GlobalStyles.spaceBetween, { marginBottom: 16 }]}>
          <View style={[GlobalStyles.row, { alignItems: 'center' }]}>
            <Ionicons 
              name={daySchedule.available ? "checkmark-circle" : "close-circle"} 
              size={24} 
              color={daySchedule.available ? Colors.success : Colors.error} 
              style={{ marginRight: 12 }}
            />
            <Text style={[GlobalStyles.text, { fontWeight: '600' }]}>
              {dayLabel}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => toggleDayAvailability(dayKey)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 16,
              backgroundColor: daySchedule.available ? Colors.success : Colors.error
            }}
          >
            <Text style={[GlobalStyles.textSmall, { color: 'white', fontWeight: '600' }]}>
              {daySchedule.available ? 'Disponible' : 'No disponible'}
            </Text>
          </TouchableOpacity>
        </View>

        {daySchedule.available && (
          <View style={[GlobalStyles.row, { justifyContent: 'space-between' }]}>
            <View style={{ flex: 1, marginRight: 16 }}>
              <Text style={[GlobalStyles.textSmall, { marginBottom: 8, fontWeight: '600' }]}>
                Hora de inicio
              </Text>
              <View style={[GlobalStyles.input, { paddingVertical: 0 }]}>
                <Picker
                  selectedValue={daySchedule.start}
                  onValueChange={(time) => updateScheduleTime(dayKey, 'start', time)}
                  style={{ height: 50 }}
                >
                  {timeSlots.map((time) => (
                    <Picker.Item key={time} label={time} value={time} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[GlobalStyles.textSmall, { marginBottom: 8, fontWeight: '600' }]}>
                Hora de fin
              </Text>
              <View style={[GlobalStyles.input, { paddingVertical: 0 }]}>
                <Picker
                  selectedValue={daySchedule.end}
                  onValueChange={(time) => updateScheduleTime(dayKey, 'end', time)}
                  style={{ height: 50 }}
                >
                  {timeSlots.map((time) => (
                    <Picker.Item key={time} label={time} value={time} />
                  ))}
                </Picker>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  if (isLoadingSchedule) {
    return (
      <View style={[GlobalStyles.container, GlobalStyles.center]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={[GlobalStyles.text, { marginTop: 16 }]}>Cargando horario...</Text>
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
          <Text style={GlobalStyles.title}>Mi Horario</Text>
        </View>

        <Text style={[GlobalStyles.text, { marginBottom: 20, textAlign: 'center' }]}>
          Configura tu horario de disponibilidad para que los pacientes puedan reservar citas
        </Text>

        {/* Horario por días */}
        {days.map((day) => renderDaySchedule(day.key, day.label))}

        {/* Botón de guardar */}
        <TouchableOpacity
          style={[GlobalStyles.buttonPrimary, { opacity: isLoading ? 0.7 : 1 }]}
          onPress={saveSchedule}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.backgroundCard} />
          ) : (
            <Text style={GlobalStyles.buttonText}>Guardar Horario</Text>
          )}
        </TouchableOpacity>

        {/* Información adicional */}
        <View style={[GlobalStyles.backgroundPastelGreen, {
          padding: 16,
          borderRadius: 12,
          marginTop: 20
        }]}>
          <View style={[GlobalStyles.row, { alignItems: 'flex-start' }]}>
            <Ionicons name="information-circle" size={20} color={Colors.success} style={{ marginRight: 12, marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={[GlobalStyles.textSmall, { fontWeight: '600', marginBottom: 4 }]}>
                Información sobre horarios
              </Text>
              <Text style={[GlobalStyles.textSmall, { lineHeight: 18 }]}>
                • Los pacientes solo podrán reservar citas en tus horarios disponibles{'\n'}
                • Puedes cambiar tu horario en cualquier momento{'\n'}
                • Se recomienda mantener horarios consistentes{'\n'}
                • Los cambios se aplicarán inmediatamente
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
