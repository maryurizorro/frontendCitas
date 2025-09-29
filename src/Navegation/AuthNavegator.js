import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

import LoginScreen from "../../Screen/Auth/loginScreen";
import RegisterScreen from "../../Screen/Auth/registrarScreen";

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator 
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#F8F9FA' }
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}
