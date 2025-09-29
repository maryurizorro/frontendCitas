import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../../Screen/Auth/loginScreen';
import RegistrarScreen from '../../Screen/Auth/registrarScreen';

const Stack = createNativeStackNavigator();

export default function AuthNavegacion() {
  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Registrar" component={RegistrarScreen} />
    </Stack.Navigator>
  );
}