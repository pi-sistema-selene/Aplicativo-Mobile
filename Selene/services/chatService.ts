import { API_V1, ENDPOINTS } from "@/constants/api";
import { authHeaders } from "@/utils/authHeaders";
import { normalizeList } from "@/utils/apiResponse";
import type { Chat } from "@/types/chat";

async function requestJson<T>(
  url: string,
  token: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...authHeaders(token),
      ...(init?.headers || {}),
    },
  });
  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      body && typeof body === "object" && "message" in body
        ? String((body as { message: unknown }).message)
        : `Não foi possível concluir a solicitação (HTTP ${response.status}).`;
    throw new Error(message);
  }

  return body as T;
}

export async function listarChats(
  token: string,
  isAdmin: boolean,
): Promise<Chat[]> {
  const endpoint = isAdmin ? ENDPOINTS.admin.chats : ENDPOINTS.chats.listar;
  const json = await requestJson<unknown>(`${API_V1}${endpoint}`, token);
  return normalizeList<Chat>(json);
}
