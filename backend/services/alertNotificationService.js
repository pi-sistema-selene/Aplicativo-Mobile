const Leitura = require("../models-mongodb/Leitura");
const { sendAlertPush } = require("./pushNotificationService");

const SENSOR_LIMITS = {
  temperatureHigh: 18,
  temperatureLow: 13,
  temperatureCriticalHigh: 22,
  temperatureCriticalLow: 10,
  humidityLow: 85,
  humidityHigh: 95,
  humidityCriticalLow: 80,
  humidityCriticalHigh: 98,
  lightLow: 10,
};

function getSensorAlert(data, device) {
  const temperature = data.temperatura;
  const humidity = data.umidade;
  const light = data.luminosidade;
  const greenhouse = device.nome || "estufa";

  if (
    temperature != null &&
    (temperature > SENSOR_LIMITS.temperatureHigh ||
      temperature < SENSOR_LIMITS.temperatureLow)
  ) {
    const high = temperature > SENSOR_LIMITS.temperatureHigh;
    return {
      key: high ? "temperature-high" : "temperature-low",
      title: high ? "Temperatura alta" : "Temperatura baixa",
      body: `A temperatura da estufa ${greenhouse} está em ${temperature} °C.`,
      severity:
        temperature > SENSOR_LIMITS.temperatureCriticalHigh ||
        temperature < SENSOR_LIMITS.temperatureCriticalLow
          ? "Alta"
          : "Média",
    };
  }

  if (
    humidity != null &&
    (humidity < SENSOR_LIMITS.humidityLow ||
      humidity > SENSOR_LIMITS.humidityHigh)
  ) {
    const low = humidity < SENSOR_LIMITS.humidityLow;
    return {
      key: low ? "humidity-low" : "humidity-high",
      title: low ? "Umidade abaixo do ideal" : "Umidade acima do ideal",
      body: `A umidade da estufa ${greenhouse} está em ${humidity}%.`,
      severity:
        humidity < SENSOR_LIMITS.humidityCriticalLow ||
        humidity > SENSOR_LIMITS.humidityCriticalHigh
          ? "Alta"
          : "Média",
    };
  }

  if (light != null && light < SENSOR_LIMITS.lightLow) {
    return {
      key: "light-low",
      title: "Pouca luminosidade",
      body: `A luminosidade da estufa ${greenhouse} está em ${light}%.`,
      severity: "Média",
    };
  }

  return null;
}

async function getPreviousReading(deviceId, type) {
  return Leitura.findOne({ dispositivo: deviceId, tipo_leitura: type })
    .sort({ timestamp: -1 })
    .select("dados")
    .lean();
}

async function notifyOnNewSensorAlert(device, data, previousData) {
  const alert = getSensorAlert(data, device);
  if (
    !device.usuario ||
    !alert ||
    alert.key === getSensorAlert(previousData || {}, device)?.key
  ) {
    return;
  }

  await sendAlertPush(device.usuario, {
    ...alert,
    deviceId: device._id,
    category: "SENSORES",
  });
}

async function notifyOnNewImageAlert(device, prediction, previousData) {
  if (
    !device.usuario ||
    prediction?.anomalia !== true ||
    (previousData?.predicao && previousData.predicao.anomalia === true)
  ) {
    return;
  }

  await sendAlertPush(device.usuario, {
    title: "Anomalia detectada na imagem",
    body: `A câmera da estufa ${device.nome || "estufa"} identificou uma condição fora do padrão.`,
    severity: "Alta",
    deviceId: device._id,
    category: "CAMERA",
  });
}

module.exports = {
  getPreviousReading,
  notifyOnNewSensorAlert,
  notifyOnNewImageAlert,
};
