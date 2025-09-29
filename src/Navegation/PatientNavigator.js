import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import Appointments from "../../Screen/Patient/appointments";
import BookAppointment from "../../Screen/Patient/bookAppointment";
import DashboardPatient from "../../Screen/Patient/dashboardPatient";
import Profile from "../../Screen/Profile/profile";
import AccountSettings from "../../Screen/Profile/accountSettings";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function PatientTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Appointments') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Book') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6C63FF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E5EA',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: '#6C63FF',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardPatient}
        options={{ title: 'Inicio' }}
      />
      <Tab.Screen 
        name="Appointments" 
        component={Appointments}
        options={{ title: 'Mis Citas' }}
      />
      <Tab.Screen 
        name="Book" 
        component={BookAppointment}
        options={{ title: 'Reservar' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={Profile}
        options={{ title: 'Perfil' }}
      />
    </Tab.Navigator>
  );
}

export default function PatientNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PatientTabs" component={PatientTabs} />
      <Stack.Screen name="AccountSettings" component={AccountSettings} />
    </Stack.Navigator>
  );
}
