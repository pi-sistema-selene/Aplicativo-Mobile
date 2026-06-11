export const API_BASE_URL = "https://selene-mobile.onrender.com";
export const API_V1 = `${API_BASE_URL}/api/v1`;

export const ENDPOINTS = {
  auth: {
    login: "/auth/login",
    perfil: "/auth/perfil",
    alterarSenha: "/auth/alterar-senha",
    recuperarSenha: "/auth/recuperar-senha",
  },
  admin: {
    login: "/admin/login",
    perfil: "/admin/perfil",
    alterarSenha: "/admin/alterar-senha",
    listar: "/admin/listar",
    dashboardStats: "/admin/dashboard/stats",
    chats: "/admin/chats",
  },
  dispositivos: {
    meus: "/dispositivos/meus",
    listar: "/dispositivos",
    leituras: (id: string, limite?: number) =>
      `/dispositivos/${id}/leituras${limite ? `?limite=${limite}` : ""}`,
    resumo: (id: string) => `/dispositivos/${id}/resumo`,
    detalhe: (id: string) => `/dispositivos/${id}`,
  },
  estufas: {
    listar: "/estufas/listar",
    cadastrar: "/estufas/cadastrar",
    detalhes: (id: string) => `/estufas/detalhes/${id}`,
  },
  users: {
    listar: "/users",
    detalhe: (id: string) => `/users/${id}`,
  },
  chats: {
    listar: "/chats",
    criar: "/chats",
    mensagens: (chatId: string) => `/chats/${chatId}/mensagens`,
  },
} as const;
