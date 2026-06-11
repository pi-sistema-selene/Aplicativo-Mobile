import { ENDPOINTS } from "@/constants/api";
import api from "./api";

export async function getDashboardStats(token: string) {
  const response = await api.get(ENDPOINTS.admin.dashboardStats, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function listarAdmins(token: string) {
  const response = await api.get(ENDPOINTS.admin.listar, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}
