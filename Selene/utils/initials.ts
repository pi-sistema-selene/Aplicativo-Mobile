export function getInitials(name: string): string {
  const partes = name.trim().split(" ");
  if (partes.length > 1) {
    return (partes[0][0] + partes[1][0]).toUpperCase();
  }
  return partes[0][0].toUpperCase();
}

export function getShortName(name: string): string {
  const partes = name.trim().split(" ");
  return partes.length > 1 ? `${partes[0]} ${partes[1]}` : partes[0];
}
