import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { useAuth } from "../Context/AuthContext";
import AdminNavigator from "./AdminNavigator";
import DoctorNavigator from "./DoctorNavigator";
import PatientNavigator from "./PatientNavigator";

const Stack = createNativeStackNavigator();

export default function MainNavigator() {
  const { isPatient, isDoctor, isAdmin } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isPatient() && (
        <Stack.Screen name="Patient" component={PatientNavigator} />
      )}
      {isDoctor() && (
        <Stack.Screen name="Doctor" component={DoctorNavigator} />
      )}
      {isAdmin() && (
        <Stack.Screen name="Admin" component={AdminNavigator} />
      )}
    </Stack.Navigator>
  );
}