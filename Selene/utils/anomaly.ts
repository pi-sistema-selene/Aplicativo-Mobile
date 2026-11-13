import { Colors } from "@/constants/Colors";
import {
  EXPORT_THRESHOLDS,
  SENSOR_THRESHOLDS,
} from "@/constants/thresholds";
import type { DadosSensor, PredicaoImagem } from "@/types/dispositivo";
import type { AlertaDetalheCampo, Gravidade, TipoAlerta } from "@/types/alerta";
import { formatTimeBR } from "./formatDate";

export function hasSensorAnomaly(dados: DadosSensor): boolean {
  const temp = dados.temperatura;
  const umidade = dados.umidade;
  const luz = dados.luminosidade;
  const t = SENSOR_THRESHOLDS;

  return (
    (temp != null && (temp > t.tempMax || temp < t.tempMin)) ||
    (umidade != null && (umidade < t.umidadeMin || umidade > t.umidadeMax)) ||
    (luz != null && luz < t.luzMin)
  );
}

export function buildSensorDetailFields(
  dados: DadosSensor,
): AlertaDetalheCampo[] {
  const fields: AlertaDetalheCampo[] = [];
  const thresholds = SENSOR_THRESHOLDS;

  if (dados.temperatura != null) {
    fields.push({
      label: "Temperatura",
      value: `${Number(dados.temperatura).toFixed(1)} °C (faixa: ${thresholds.tempMin}–${thresholds.tempMax} °C)`,
    });
  }
  if (dados.umidade != null) {
    fields.push({
      label: "Umidade relativa",
      value: `${Number(dados.umidade).toFixed(1)}% (faixa: ${thresholds.umidadeMin}–${thresholds.umidadeMax}%)`,
    });
  }
  if (dados.luminosidade != null) {
    fields.push({
      label: "Leitura relativa de luz",
      value: `${Number(dados.luminosidade).toFixed(0)}% (alerta abaixo de ${thresholds.luzMin}%)`,
    });
  }
  return fields;
}

export function buildImageDetailFields(
  predicao: PredicaoImagem,
): AlertaDetalheCampo[] {
  const fields: AlertaDetalheCampo[] = [
    { label: "Resultado", value: predicao.anomalia ? "Não saudável" : "Saudável" },
  ];
  if (predicao.classe) fields.push({ label: "Classe", value: predicao.classe });
  if (typeof predicao.confianca === "number") {
    fields.push({
      label: "Confiança",
      value: `${(predicao.confianca * 100).toFixed(1)}%`,
    });
  }
  if (typeof predicao.probabilidade_saudavel === "number") {
    fields.push({
      label: "Probabilidade saudável",
      value: `${(predicao.probabilidade_saudavel * 100).toFixed(1)}%`,
    });
  }
  if (typeof predicao.threshold_usado === "number") {
    fields.push({
      label: "Limite da análise",
      value: String(predicao.threshold_usado),
    });
  }
  if (predicao.processado_em) {
    fields.push({
      label: "Analisado em",
      value: new Date(predicao.processado_em).toLocaleString("pt-BR"),
    });
  }
  return fields;
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
      temp > th.tempCriticalHigh || temp < th.tempCriticalLow ? "Alta" : "Média";
    tipo =
      temp > th.tempCriticalHigh || temp < th.tempCriticalLow ? "risco" : "aviso";
  } else if (
    umidade != null &&
    (umidade < th.umidadeMin || umidade > th.umidadeMax)
  ) {
    mensagem =
      umidade < th.umidadeMin ? "Umidade Baixa!" : "Umidade Alta!";
    gravidade =
      umidade < th.umidadeCriticalLow || umidade > th.umidadeCriticalHigh
        ? "Alta"
        : "Média";
    tipo =
      umidade < th.umidadeCriticalLow || umidade > th.umidadeCriticalHigh
        ? "risco"
        : "aviso";
  } else if (luz != null && luz < th.luzMin) {
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
      temp > th.tempCriticalHigh || temp < th.tempCriticalLow ? "Alta" : "Média";
    corPrioridade =
      temp > th.tempCriticalHigh || temp < th.tempCriticalLow
        ? Colors.alertHighAlt
        : Colors.alertMediumAlt;
    tipo =
      temp > th.tempCriticalHigh || temp < th.tempCriticalLow ? "risco" : "aviso";
  } else if (
    umidade != null &&
    (umidade < th.umidadeMin || umidade > th.umidadeMax)
  ) {
    titulo =
      umidade < th.umidadeMin
        ? "Umidade abaixo do ideal"
        : "Umidade acima do ideal";
    sub = `Umidade está em ${formattedUmidade}%, fora da faixa recomendada de ${th.umidadeMin}% a ${th.umidadeMax}%.`;
    prioridade =
      umidade < th.umidadeCriticalLow || umidade > th.umidadeCriticalHigh
        ? "Alta"
        : "Média";
    corPrioridade =
      umidade < th.umidadeCriticalLow || umidade > th.umidadeCriticalHigh
        ? Colors.alertHighAlt
        : Colors.alertMediumAlt;
    tipo =
      umidade < th.umidadeCriticalLow || umidade > th.umidadeCriticalHigh
        ? "risco"
        : "aviso";
  } else if (luz != null && luz < th.luzMin) {
    titulo = "Pouca luminosidade detectada";
    sub = `O sensor de luz está abaixo de ${th.luzMin}% do valor relativo configurado.`;
  }

  return { titulo, sub, prioridade, corPrioridade, tipo };
}

interface ImageAlertResult {
  titulo: string;
  sub: string;
  prioridade: Gravidade;
  corPrioridade: string;
  tipo: TipoAlerta;
}

export function hasImageAnomaly(
  predicao?: PredicaoImagem,
): predicao is PredicaoImagem & { anomalia: true } {
  return predicao?.anomalia === true;
}

export function formatImagePrediction(predicao?: PredicaoImagem): string | undefined {
  if (!predicao) return undefined;

  const resultado =
    predicao.anomalia === true
      ? "Não saudável"
      : predicao.anomalia === false
        ? "Saudável"
        : undefined;
  const confianca =
    typeof predicao.confianca === "number" && Number.isFinite(predicao.confianca)
      ? `Confiança: ${(predicao.confianca * 100).toFixed(1)}%`
      : undefined;

  return [resultado, predicao.classe?.trim(), confianca]
    .filter(Boolean)
    .join(" · ") || "Resultado indisponível";
}

export function buildImageAlert(predicao: PredicaoImagem): ImageAlertResult {
  const resultado = formatImagePrediction(predicao);
  return {
    titulo: "Anomalia detectada na imagem",
    sub: resultado
      ? `A análise da câmera identificou uma condição fora do padrão. ${resultado}.`
      : "A análise da câmera identificou uma condição fora do padrão.",
    prioridade: "Alta",
    corPrioridade: Colors.alertHighAlt,
    tipo: "risco",
  };
}

export function formatAlertaTime(createdAt?: string): string {
  if (!createdAt) return "Agora";
  return formatTimeBR(createdAt);
}

export function formatAlertaTimeRelative(createdAt?: string): string {
  if (!createdAt) return "Agora";
  return `há ${formatTimeBR(createdAt)}`;
}
