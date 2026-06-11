import * as SecureStore from "expo-secure-store";
import { ENDPOINTS } from "@/constants/api";
import { STORAGE_KEYS } from "@/constants/storageKeys";
import api from "./api";

interface LoginResult {
  token: string;
  userDetails: Record<string, unknown>;
  isAdmin: boolean;
}

export async function login(
  email: string,
  password: string,
): Promise<LoginResult> {
  let response;
  let isLoggedAsAdmin = false;

  try {
    response = await api.post(ENDPOINTS.admin.login, {
      usuario: email.trim().toLowerCase(),
      senha: password,
    });
    isLoggedAsAdmin = true;
  } catch (adminError: unknown) {
    const status = (adminError as { response?: { status?: number } }).response
      ?.status;

    if (status === 401 || status === 404 || status === 400) {
      response = await api.post(ENDPOINTS.auth.login, {
        email: email.trim().toLowerCase(),
        senha: password,
      });
      isLoggedAsAdmin = false;
    } else {
      throw adminError;
    }
  }

  const { data } = response.data;
  const token = data?.token;
  const userDetails = isLoggedAsAdmin ? data?.admin : data?.usuario;

  if (!token || !userDetails) {
    throw new Error("Estrutura de resposta inválida.");
  }

  return { token, userDetails, isAdmin: isLoggedAsAdmin };
}

export async function saveSession(
  token: string,
  userDetails: Record<string, unknown>,
  isAdmin: boolean,
) {
  await SecureStore.setItemAsync(STORAGE_KEYS.USER_TOKEN, token);
  await SecureStore.setItemAsync(
    STORAGE_KEYS.USER_NAME,
    String(userDetails.nome_completo || userDetails.usuario || "Usuário"),
  );
  await SecureStore.setItemAsync(
    STORAGE_KEYS.USER_EMAIL,
    String(userDetails.email || ""),
  );
  await SecureStore.setItemAsync(STORAGE_KEYS.USER_ID, String(userDetails._id));

  const role = isAdmin
    ? String(userDetails.nivel_acesso || "admin")
    : "user";
  await SecureStore.setItemAsync(STORAGE_KEYS.USER_ROLE, role);
}

export async function clearSession() {
  await Promise.all([
    SecureStore.deleteItemAsync(STORAGE_KEYS.USER_TOKEN),
    SecureStore.deleteItemAsync(STORAGE_KEYS.USER_ROLE),
    SecureStore.deleteItemAsync(STORAGE_KEYS.USER_NAME),
    SecureStore.deleteItemAsync(STORAGE_KEYS.USER_EMAIL),
    SecureStore.deleteItemAsync(STORAGE_KEYS.USER_ID),
  ]);
}

export async function forgotPassword(email: string) {
  return api.post(ENDPOINTS.auth.recuperarSenha, { email });
}

export async function changePassword(
  token: string,
  senhaAtual: string,
  novaSenha: string,
  isAdmin: boolean,
) {
  const endpoint = isAdmin
    ? ENDPOINTS.admin.alterarSenha
    : ENDPOINTS.auth.alterarSenha;

  return api.put(
    endpoint,
    { senha_atual: senhaAtual, nova_senha: novaSenha },
    { headers: { Authorization: `Bearer ${token}` } },
  );
}
