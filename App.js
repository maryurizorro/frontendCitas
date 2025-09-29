import { NavigationContainer } from "@react-navigation/native";
import React from "react";
import Toast from 'react-native-toast-message';
import { AuthProvider } from "./src/Context/AuthContext";
import RootNavigator from "./src/Navegation/RootNavigator";

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
        <Toast />
      </NavigationContainer>
    </AuthProvider>
  );
}
