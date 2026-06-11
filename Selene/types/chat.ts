export interface Chat {
  _id: string;
  nome?: string;
  status?: string;
  updatedAt?: string;
}

export interface Message {
  _id?: string;
  conteudo?: string;
  remetente?: string;
  createdAt?: string;
}
