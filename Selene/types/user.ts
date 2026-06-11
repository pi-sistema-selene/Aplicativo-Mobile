export type UserRole = "user" | "admin" | "superadmin";

export interface User {
  _id: string;
  nome_completo?: string;
  usuario?: string;
  email?: string;
  nivel_acesso?: string;
}
