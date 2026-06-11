import { API_V1, ENDPOINTS } from "@/constants/api";
import { authHeaders } from "@/utils/authHeaders";
import { normalizeList } from "@/utils/apiResponse";
import type { Chat, Message } from "@/types/chat";

export async function listarChats(
  token: string,
  isAdmin: boolean,
): Promise<Chat[]> {
  const endpoint = isAdmin ? ENDPOINTS.admin.chats : ENDPOINTS.chats.listar;
  const res = await fetch(`${API_V1}${endpoint}`, {
    headers: authHeaders(token),
  });
  const json = await res.json();
  return normalizeList<Chat>(json);
}

export async function getMensagens(
  chatId: string,
  token: string,
): Promise<Message[]> {
  const res = await fetch(
    `${API_V1}${ENDPOINTS.chats.mensagens(chatId)}`,
    { headers: authHeaders(token) },
  );
  const json = await res.json();
  return normalizeList<Message>(json);
}
