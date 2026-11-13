export const SENSOR_THRESHOLDS = {
  tempMax: 18,
  tempMin: 13,
  tempCriticalHigh: 22,
  tempCriticalLow: 10,
  umidadeMin: 85,
  umidadeMax: 95,
  umidadeCriticalLow: 80,
  umidadeCriticalHigh: 98,
  // The ESP32 reports a relative analog percentage, not calibrated lux.
  luzMin: 10,
} as const;

export const EXPORT_THRESHOLDS = {
  tempMax: 30,
  tempMin: 10,
  umidadeMin: 40,
  umidadeMax: 85,
  luzMin: 2,
} as const;
