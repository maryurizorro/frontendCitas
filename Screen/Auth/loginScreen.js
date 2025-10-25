import { Ionicons } from '@expo/vector-icons'; 
import React, { useState } from 'react'; 
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { Colors } from '../../src/Components/Colors'; 
import { NotificationService } from '../../src/Components/NotificationService'; 
import { GlobalStyles } from '../../src/Components/Styles'; 
import { useAuth } from '../../src/Context/AuthContext';
import { authAPI } from '../../src/Services/conexion'; 

export default function LoginScreen({ navigation }) {
  // Estados para guardar datos del formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Controla el spinner de carga
  const [showPassword, setShowPassword] = useState(false); // Muestra u oculta la contraseña
  const { login } = useAuth(); // Para iniciar sesión y guardar usuario globalmente

  // Función para manejar el inicio de sesión
  const handleLogin = async () => {
    if (!email || !password) {
      NotificationService.showError('Error', 'Por favor completa todos los campos');
      return;
    }

    setIsLoading(true); // Activa el indicador de carga
    try {
      // Llama a la API para intentar iniciar sesión
      const response = await authAPI.login(email, password);
      
      // Si el servidor responde con éxito
      if (response.data.success) {
        // Guarda el usuario y el token en el contexto global
        await login(response.data.usuario, response.data.token);
        NotificationService.showSuccess('¡Bienvenido!', 'Inicio de sesión exitoso');

        // Mostrar notificación push de login exitoso (solo en APK)
        if (!__DEV__) {
          await NotificationService.showLoginNotification();
        }
      } else {
        // Si las credenciales son incorrectas
        NotificationService.showError('Error', 'Credenciales incorrectas');
      }
    } catch (error) {
      // Captura errores del servidor o de conexión
      console.log('Login error:', error.response?.data || error.message);

      // Solo mostrar error si NO es credenciales inválidas (que es correcto mostrar)
      // Los errores 401 de "autenticación" durante login son normales
      if (error.response?.status === 401 && error.response?.data?.message === 'Credenciales inválidas') {
        NotificationService.showError('Error', 'Credenciales incorrectas');
      } else if (error.response?.status !== 401) {
        // Otros errores que no sean 401
        const errorMessage = error.response?.data?.message || 'Error al iniciar sesión';
        NotificationService.showError('Error', errorMessage);
      }
    } finally {
      setIsLoading(false); // Quita el indicador de carga
    }
  };

  return (
    // Evita que el teclado tape los campos (en iOS y Android)
    <KeyboardAvoidingView 
      style={GlobalStyles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Permite desplazarse cuando el teclado aparece */}
      <ScrollView 
        contentContainerStyle={GlobalStyles.containerCentered}
        showsVerticalScrollIndicator={false}
      >
        {/* Contenedor principal del formulario */}
        <View style={[GlobalStyles.card, { width: '100%', maxWidth: 400 }]}>

          {/* Logo / Ícono superior */}
          <View style={[GlobalStyles.center, { marginBottom: 30 }]}>
            <View style={[GlobalStyles.backgroundPastelPurple, { 
              width: 80, 
              height: 80, 
              borderRadius: 40, 
              ...GlobalStyles.center 
            }]}>
              <Ionicons name="medical" size={40} color={Colors.primary} />
            </View>
          </View>

          {/* Título y descripción */}
          <Text style={GlobalStyles.title}>Iniciar Sesión</Text>
          <Text style={[GlobalStyles.text, { textAlign: 'center', marginBottom: 30 }]}>
            Accede a tu cuenta para gestionar tus citas médicas
          </Text>

          {/* Campo de correo electrónico */}
          <View style={{ marginBottom: 16 }}>
            <Text style={[GlobalStyles.textSmall, { marginBottom: 8, fontWeight: '600' }]}>
              Correo electrónico
            </Text>
            <View style={{ position: 'relative' }}>
              <TextInput
                placeholder="tu@email.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                style={GlobalStyles.input}
                placeholderTextColor={Colors.textLight}
              />
              {/* Ícono de sobre al lado derecho */}
              <Ionicons 
                name="mail-outline" 
                size={20} 
                color={Colors.textLight} 
                style={{ position: 'absolute', right: 16, top: 16 }}
              />
            </View>
          </View>

          {/* Campo de contraseña */}
          <View style={{ marginBottom: 24 }}>
            <Text style={[GlobalStyles.textSmall, { marginBottom: 8, fontWeight: '600' }]}>
              Contraseña
            </Text>
            <View style={{ position: 'relative' }}>
              <TextInput
                placeholder="Tu contraseña"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword} // Oculta o muestra según el estado
                style={GlobalStyles.input}
                placeholderTextColor={Colors.textLight}
              />
              {/* Botón para mostrar/ocultar la contraseña */}
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 16, top: 16 }}
              >
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color={Colors.textLight} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Botón de iniciar sesión */}
          <TouchableOpacity
            style={[GlobalStyles.buttonPrimary, { opacity: isLoading ? 0.7 : 1 }]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.backgroundCard} /> // Muestra carga
            ) : (
              <Text style={GlobalStyles.buttonText}>Iniciar Sesión</Text>
            )}
          </TouchableOpacity>

          {/* Enlace para registrarse */}
          <View style={[GlobalStyles.center, { marginTop: 12 }]}>
            <Text style={GlobalStyles.textSmall}>
              ¿No tienes una cuenta?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={[GlobalStyles.textSmall, { color: Colors.primary, fontWeight: '600' }]}>
                Regístrate aquí
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
