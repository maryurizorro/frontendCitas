import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import DashboardAdmin from "../../Screen/Admin/dashboardAdmin";
import ManageAppointments from "../../Screen/Admin/manageAppointments";
import ManageSpecialties from "../../Screen/Admin/manageSpecialties";
import ManageUsers from "../../Screen/Admin/manageUsers";
import Profile from "../../Screen/Profile/profile";
import AccountSettings from "../../Screen/Profile/accountSettings";
import CreateDoctor from "../../Screen/Admin/createDoctor";
import CreateAdmin from "../../Screen/Admin/createAdmin";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Users') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Appointments') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Specialties') {
            iconName = focused ? 'medical' : 'medical-outline';
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
        component={DashboardAdmin}
        options={{ title: 'Inicio' }}
      />
      <Tab.Screen 
        name="Users" 
        component={ManageUsers}
        options={{ title: 'Usuarios' }}
      />
      <Tab.Screen 
        name="Appointments" 
        component={ManageAppointments}
        options={{ title: 'Citas' }}
      />
      <Tab.Screen 
        name="Specialties" 
        component={ManageSpecialties}
        options={{ title: 'Especialidades' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={Profile}
        options={{ title: 'Perfil' }}
      />
    </Tab.Navigator>
  );
}

export default function AdminNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminTabs" component={AdminTabs} />
      <Stack.Screen name="AccountSettings" component={AccountSettings} />
      <Stack.Screen name="CreateDoctor" component={CreateDoctor} />
      <Stack.Screen name="CreateAdmin" component={CreateAdmin} />
    </Stack.Navigator>
  );
}
