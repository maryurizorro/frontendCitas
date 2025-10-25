import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { useAuth } from "../Context/AuthContext";
import AdminNavigator from "./AdminNavigator";
import DoctorNavigator from "./DoctorNavigator";
import PatientNavigator from "./PatientNavigator";

const Stack = createNativeStackNavigator();

export default function MainNavigator() {
  const { user } = useAuth();

  // Determinar el componente basado en el rol del usuario
  let InitialComponent;
  if (user?.role === 'patient') {
    InitialComponent = PatientNavigator;
  } else if (user?.role === 'doctor') {
    InitialComponent = DoctorNavigator;
  } else if (user?.role === 'admin') {
    InitialComponent = AdminNavigator;
  } else {
    // Fallback por si no hay rol definido
    InitialComponent = PatientNavigator;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={InitialComponent} />
    </Stack.Navigator>
  );
}