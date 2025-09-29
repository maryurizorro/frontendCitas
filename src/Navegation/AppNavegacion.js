import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from './AuthContext';
import DashboardPatient from '../../Screen/Patient/dashboardPatient';
import AppointmentsScreen from '../../Screen/Patient/appointments';
import BookAppointmentScreen from '../../Screen/Patient/bookAppointment';
import ProfileScreen from '../../Screen/Profile/profile';
import DashboardAdmin from '../../Screen/Admin/dashboardAdmin';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function PatientNavegacion() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Dashboard" component={DashboardPatient} />
      <Tab.Screen name="Appointments" component={AppointmentsScreen} />
      <Tab.Screen name="BookAppointment" component={BookAppointmentScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AdminNavegacion() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="DashboardAdmin" component={DashboardAdmin} />
      {/* Add more admin screens */}
    </Stack.Navigator>
  );
}

export default function AppNavegacion() {
  const { role } = useAuth();

  if (role === 'admin') {
    return <AdminNavegacion />;
  }
  return <PatientNavegacion />;
}