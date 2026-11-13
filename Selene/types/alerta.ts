export type Gravidade = "Alta" | "Média" | "Baixa";
export type TipoAlerta = "risco" | "aviso";

export interface AlertaDetalheCampo {
  label: string;
  value: string;
}

export interface AlertaItem {
  id: string;
  titulo: string;
  sub: string;
  estufa: string;
  tempo: string;
  prioridade: Gravidade;
  corPrioridade: string;
  tipo: TipoAlerta;
  categoria?: "SENSORES" | "CAMERA";
  detalhes?: AlertaDetalheCampo[];
  imagemUri?: string;
  dataHora?: string;
}

export interface HomeAlerta {
  id: string;
  mensagem: string;
  submensagem: string;
  gravidade: Gravidade;
  estufa: string;
  tempo: string;
  tipo: TipoAlerta;
  titulo?: string;
  prioridade?: Gravidade;
  categoria?: "SENSORES" | "CAMERA";
  detalhes?: AlertaDetalheCampo[];
  imagemUri?: string;
  dataHora?: string;
}
