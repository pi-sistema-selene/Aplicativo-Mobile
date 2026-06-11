import { Colors } from "@/constants/Colors";
import {
  EXPORT_THRESHOLDS,
  SENSOR_THRESHOLDS,
} from "@/constants/thresholds";
import type { DadosSensor } from "@/types/dispositivo";
import type { Gravidade, TipoAlerta } from "@/types/alerta";
import { formatTimeBR } from "./formatDate";

export function hasSensorAnomaly(dados: DadosSensor): boolean {
  const temp = dados.temperatura;
  const umidade = dados.umidade;
  const luz = dados.luminosidade;
  const t = SENSOR_THRESHOLDS;

  return (
    (temp != null && (temp > t.tempMax || temp < t.tempMin)) ||
    (umidade != null && (umidade < t.umidadeMin || umidade > t.umidadeMax)) ||
    luz === t.luzMin
  );
}

export function hasExportAnomaly(dados: DadosSensor): boolean {
  const t = dados.temperatura ?? 0;
  const u = dados.umidade ?? 0;
  const lz = dados.luminosidade ?? 0;
  const th = EXPORT_THRESHOLDS;

  return (
    t > th.tempMax ||
    t < th.tempMin ||
    u > th.umidadeMax ||
    u < th.umidadeMin ||
    lz < th.luzMin
  );
}

interface HomeAlertaResult {
  mensagem: string;
  submensagem: string;
  gravidade: Gravidade;
  tipo: TipoAlerta;
}

export function buildHomeAlerta(dados: DadosSensor): HomeAlertaResult {
  const temp = dados.temperatura;
  const umidade = dados.umidade;
  const luz = dados.luminosidade;
  const th = SENSOR_THRESHOLDS;

  const formattedTemp = temp != null ? Number(temp).toFixed(0) : "--";
  const formattedUmidade = umidade != null ? Number(umidade).toFixed(0) : "--";

  let mensagem = "Anomalia Detectada";
  let submensagem = `T: ${formattedTemp}°C | U: ${formattedUmidade}%`;
  let gravidade: Gravidade = "Média";
  let tipo: TipoAlerta = "aviso";

  if (temp != null && (temp > th.tempMax || temp < th.tempMin)) {
    mensagem = temp > th.tempMax ? "Temperatura Alta!" : "Temperatura Baixa!";
    gravidade =
      temp > th.tempCriticalHigh || temp < th.tempMin ? "Alta" : "Média";
    tipo =
      temp > th.tempCriticalHigh || temp < th.tempMin ? "risco" : "aviso";
  } else if (
    umidade != null &&
    (umidade < th.umidadeMin || umidade > th.umidadeMax)
  ) {
    mensagem = "Umidade Fora do Ideal!";
    gravidade = umidade < th.umidadeCriticalLow ? "Alta" : "Média";
    tipo = umidade < th.umidadeCriticalLow ? "risco" : "aviso";
  } else if (luz === th.luzMin) {
    mensagem = "Ausência de Luz Detectada";
  }

  return { mensagem, submensagem, gravidade, tipo };
}

interface AlertaScreenResult {
  titulo: string;
  sub: string;
  prioridade: Gravidade;
  corPrioridade: string;
  tipo: TipoAlerta;
}

export function buildAlertaScreenItem(dados: DadosSensor): AlertaScreenResult {
  const temp = dados.temperatura;
  const umidade = dados.umidade;
  const luz = dados.luminosidade;
  const th = SENSOR_THRESHOLDS;

  const formattedTemp = temp != null ? Number(temp).toFixed(0) : "--";
  const formattedUmidade = umidade != null ? Number(umidade).toFixed(0) : "--";

  let titulo = "Anomalia Detectada";
  let sub = `Temperatura: ${formattedTemp}°C | Umidade: ${formattedUmidade}%`;
  let prioridade: Gravidade = "Média";
  let corPrioridade: string = Colors.alertMediumAlt;
  let tipo: TipoAlerta = "aviso";

  if (temp != null && (temp > th.tempMax || temp < th.tempMin)) {
    titulo =
      temp > th.tempMax
        ? "Temperatura elevada detectada"
        : "Temperatura baixa detectada";
    prioridade =
      temp > th.tempCriticalHigh || temp < th.tempMin ? "Alta" : "Média";
    corPrioridade =
      temp > th.tempCriticalHigh || temp < th.tempMin
        ? Colors.alertHighAlt
        : Colors.alertMediumAlt;
    tipo =
      temp > th.tempCriticalHigh || temp < th.tempMin ? "risco" : "aviso";
  } else if (
    umidade != null &&
    (umidade < th.umidadeMin || umidade > th.umidadeMax)
  ) {
    titulo = "Umidade acima do ideal";
    sub = `Umidade está em ${formattedUmidade}%, fora da meta recomendada.`;
    prioridade = umidade < th.umidadeCriticalLow ? "Alta" : "Média";
    corPrioridade =
      umidade < th.umidadeCriticalLow
        ? Colors.alertHighAlt
        : Colors.alertMediumAlt;
    tipo = umidade < th.umidadeCriticalLow ? "risco" : "aviso";
  } else if (luz === th.luzMin) {
    titulo = "Ausência de Luz Detectada";
  }

  return { titulo, sub, prioridade, corPrioridade, tipo };
}

export function formatAlertaTime(createdAt?: string): string {
  if (!createdAt) return "Agora";
  return formatTimeBR(createdAt);
}

export function formatAlertaTimeRelative(createdAt?: string): string {
  if (!createdAt) return "Agora";
  return `há ${formatTimeBR(createdAt)}`;
}
