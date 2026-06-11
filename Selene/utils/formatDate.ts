export function formatTimeBR(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateBR(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
  });
}

export function formatDateTimeBR(dateStr: string): string {
  return new Date(dateStr).toLocaleString("pt-BR");
}
