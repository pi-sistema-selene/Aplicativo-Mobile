import { ENDPOINTS } from "@/constants/api";
import { authHeaders } from "@/utils/authHeaders";
import { normalizeList } from "@/utils/apiResponse";
import api from "./api";
import type { User } from "@/types/user";

export async function getUsers(token: string) {
  const response = await api.get(ENDPOINTS.users.listar, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return normalizeList<User>(response.data);
}

export async function getUser(id: string, token: string) {
  const response = await api.get(ENDPOINTS.users.detalhe(id), {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function getProfile(token: string, isAdmin: boolean) {
  const endpoint = isAdmin ? ENDPOINTS.admin.perfil : ENDPOINTS.auth.perfil;
  const response = await api.get(endpoint, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function updateProfile(
  token: string,
  dados: Record<string, unknown>,
  isAdmin: boolean,
) {
  const endpoint = isAdmin ? ENDPOINTS.admin.perfil : ENDPOINTS.auth.perfil;
  return api.put(endpoint, dados, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
