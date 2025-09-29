import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import DashboardDoctor from "../../Screen/Doctor/dashboardDoctor";
import DoctorAppointments from "../../Screen/Doctor/doctorAppointments";
import DoctorSchedule from "../../Screen/Doctor/doctorSchedule";
import Profile from "../../Screen/Profile/profile";
import AccountSettings from "../../Screen/Profile/accountSettings";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function DoctorTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Appointments') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Schedule') {
            iconName = focused ? 'time' : 'time-outline';
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
        component={DashboardDoctor}
        options={{ title: 'Inicio' }}
      />
      <Tab.Screen 
        name="Appointments" 
        component={DoctorAppointments}
        options={{ title: 'Citas' }}
      />
      <Tab.Screen 
        name="Schedule" 
        component={DoctorSchedule}
        options={{ title: 'Horarios' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={Profile}
        options={{ title: 'Perfil' }}
      />
    </Tab.Navigator>
  );
}

export default function DoctorNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DoctorTabs" component={DoctorTabs} />
      <Stack.Screen name="AccountSettings" component={AccountSettings} />
    </Stack.Navigator>
  );
}
