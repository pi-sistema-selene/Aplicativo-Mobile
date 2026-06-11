export type TipoLeitura = "SENSORES" | "CAMERA";

export interface DadosSensor {
  temperatura?: number;
  umidade?: number;
  luminosidade?: number;
  foto_path?: string;
  foto?: string;
  setor?: string;
}

export interface Leitura {
  _id?: string;
  tipo_leitura?: TipoLeitura;
  dados?: DadosSensor;
  createdAt?: string;
  timestamp?: string;
}

export interface Dispositivo {
  _id: string;
  nome?: string;
  local?: string;
  tipo?: string;
  status?: string;
}

export interface ResumoDispositivo {
  totalCapturas?: number;
  totalSensores?: number;
  totalGeral?: number;
  totalLeituras?: number;
}
