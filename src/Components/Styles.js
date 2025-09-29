import { StyleSheet } from 'react-native';
import { Colors } from './Colors';

export const GlobalStyles = StyleSheet.create({
  // Contenedores
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  
  containerCentered: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  
  // Textos
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 20,
  },
  
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  
  text: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  
  textSmall: {
    fontSize: 14,
    color: Colors.textLight,
  },
  
  // Botones
  buttonPrimary: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginVertical: 8,
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  
  buttonSecondary: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginVertical: 8,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  
  buttonText: {
    color: Colors.backgroundCard,
    fontSize: 16,
    fontWeight: '600',
  },
  
  buttonTextSecondary: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Inputs
  input: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  
  inputFocused: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  
  // Espaciado
  marginTop: {
    marginTop: 20,
  },
  
  marginBottom: {
    marginBottom: 20,
  },
  
  marginVertical: {
    marginVertical: 16,
  },
  
  paddingHorizontal: {
    paddingHorizontal: 20,
  },
  
  paddingVertical: {
    paddingVertical: 16,
  },
  
  // Flexbox
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  spaceBetween: {
    justifyContent: 'space-between',
  },
  
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Colores de fondo específicos
  backgroundPastelBlue: {
    backgroundColor: Colors.pastelBlue,
  },
  
  backgroundPastelPink: {
    backgroundColor: Colors.pastelPink,
  },
  
  backgroundPastelGreen: {
    backgroundColor: Colors.pastelGreen,
  },
  
  backgroundPastelYellow: {
    backgroundColor: Colors.pastelYellow,
  },
  
  backgroundPastelPurple: {
    backgroundColor: Colors.pastelPurple,
  },
  
  backgroundPastelOrange: {
    backgroundColor: Colors.pastelOrange,
  },
});
