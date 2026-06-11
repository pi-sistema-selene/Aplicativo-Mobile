import { API_V1, ENDPOINTS } from "@/constants/api";
import { authHeaders } from "@/utils/authHeaders";
import { normalizeList } from "@/utils/apiResponse";
import api from "./api";
import type { Estufa } from "@/types/estufa";

export async function listarEstufas(token: string): Promise<Estufa[]> {
  const res = await fetch(`${API_V1}${ENDPOINTS.estufas.listar}`, {
    headers: authHeaders(token),
  });
  const json = await res.json();
  return normalizeList<Estufa>(json);
}

export async function cadastrarEstufa(
  token: string,
  dados: Record<string, unknown>,
) {
  return api.post(ENDPOINTS.estufas.cadastrar, dados, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getDetalhesEstufa(id: string, token: string) {
  const res = await fetch(`${API_V1}${ENDPOINTS.estufas.detalhes(id)}`, {
    headers: authHeaders(token),
  });
  return res.json();
}
