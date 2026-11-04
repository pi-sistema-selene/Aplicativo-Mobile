import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack 
      screenOptions={{ 
        headerShown: false, // Mantém o visual limpo, sem barra de título
        animation: 'fade',  // Transição suave entre Login e Forgot
      }}
    >
      

      <Stack.Screen 
        name="index" 
        options={{
          title: 'Acessar Selene',
        }}
      />
      

      <Stack.Screen 
        name="forgot" 
        options={{
          title: 'Recuperar Senha',
          presentation: 'transparentModal'
        }}
      />

    </Stack>
  );
}