import { API_V1, ENDPOINTS } from "@/constants/api";
import { authHeaders } from "@/utils/authHeaders";
import { normalizeList, parseLeituras } from "@/utils/apiResponse";
import type { Dispositivo, Leitura, ResumoDispositivo } from "@/types/dispositivo";

async function fetchJson<T>(url: string, token: string): Promise<T> {
  const res = await fetch(url, { headers: authHeaders(token) });
  return res.json();
}

export async function getMeusDispositivos(token: string): Promise<Dispositivo[]> {
  const json = await fetchJson<{ data?: Dispositivo[] }>(
    `${API_V1}${ENDPOINTS.dispositivos.meus}`,
    token,
  );
  return normalizeList<Dispositivo>(json);
}

export async function getDispositivos(token: string): Promise<Dispositivo[]> {
  const json = await fetchJson<{ data?: Dispositivo[] }>(
    `${API_V1}${ENDPOINTS.dispositivos.listar}`,
    token,
  );
  return normalizeList<Dispositivo>(json);
}

export async function getLeituras(
  dispositivoId: string,
  token: string,
  limite?: number,
): Promise<Leitura[]> {
  const json = await fetchJson<unknown>(
    `${API_V1}${ENDPOINTS.dispositivos.leituras(dispositivoId, limite)}`,
    token,
  );
  return parseLeituras(json) as Leitura[];
}

export async function getResumo(
  dispositivoId: string,
  token: string,
): Promise<ResumoDispositivo> {
  const json = await fetchJson<{ data?: ResumoDispositivo }>(
    `${API_V1}${ENDPOINTS.dispositivos.resumo(dispositivoId)}`,
    token,
  );
  return json?.data || {};
}
