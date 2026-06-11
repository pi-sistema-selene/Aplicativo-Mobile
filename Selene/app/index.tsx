// app/index.tsx
import { Redirect } from 'expo-router';

/**
 * ESTE É O PONTO DE ENTRADA DO APLICATIVO SELENE.
 * * Ele atua como um roteador inicial que redireciona o usuário 
 * automaticamente para o fluxo de autenticação. 
 */
export default function Index() {
  
  // No futuro, você pode adicionar uma lógica aqui para verificar
  // se o token do usuário existe no SecureStore.
  // Se existir -> Redirect para "/(tabs)/home"
  // Se não -> Redirect para "/(auth)/"
  
  return <Redirect href="/(auth)" />;
}