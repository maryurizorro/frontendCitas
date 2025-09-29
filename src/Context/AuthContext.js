import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from "react";
import { authAPI } from '../Services/conexion';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      if (storedToken) {
        const response = await authAPI.me();
        if (response.data.success) {
          setUser(response.data.usuario);
          setToken(storedToken);
        } else {
          await AsyncStorage.removeItem('token');
        }
      }
    } catch (error) {
      console.log('Error checking auth state:', error);
      await AsyncStorage.removeItem('token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (userData, tokenData) => {
    setUser(userData);
    setToken(tokenData);
    await AsyncStorage.setItem('token', tokenData);
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.log('Error during logout:', error);
    } finally {
      setUser(null);
      setToken(null);
      await AsyncStorage.removeItem('token');
    }
  };

  const isAuthenticated = () => {
    return user !== null && token !== null;
  };

  const isPatient = () => {
    return user?.rol === 'patient';
  };

  const isDoctor = () => {
    return user?.rol === 'doctor';
  };

  const isAdmin = () => {
    return user?.rol === 'admin';
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      isLoading,
      login, 
      logout, 
      isAuthenticated,
      isPatient,
      isDoctor,
      isAdmin
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
