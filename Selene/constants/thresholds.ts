export const SENSOR_THRESHOLDS = {
  tempMax: 24,
  tempMin: 10,
  tempCriticalHigh: 28,
  umidadeMin: 80,
  umidadeMax: 95,
  umidadeCriticalLow: 70,
  luzMin: 0,
} as const;

export const EXPORT_THRESHOLDS = {
  tempMax: 30,
  tempMin: 10,
  umidadeMin: 40,
  umidadeMax: 85,
  luzMin: 2,
} as const;
