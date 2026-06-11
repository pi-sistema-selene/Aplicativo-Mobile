export function normalizeList<T>(response: unknown): T[] {
  if (Array.isArray(response)) return response;
  if (response && typeof response === "object" && "data" in response) {
    const data = (response as { data: unknown }).data;
    if (Array.isArray(data)) return data;
  }
  return [];
}

export function parseLeituras(json: unknown): unknown[] {
  if (Array.isArray(json)) return json;
  if (json && typeof json === "object" && "data" in json) {
    const data = (json as { data: unknown }).data;
    if (Array.isArray(data)) return data;
  }
  return [];
}
