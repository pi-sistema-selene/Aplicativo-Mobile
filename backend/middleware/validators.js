const validateMAC = (mac) => {
  const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
  return macRegex.test(mac);
};
const validateSensorData = (data) => {
  const errors = [];
  if (data.temp !== undefined && (data.temp < -10 || data.temp > 60)) {
    errors.push("Temperatura fora do range (-10 a 60°C)");
  }
  if (data.ph !== undefined && (data.ph < 0 || data.ph > 14)) {
    errors.push("pH fora do range (0 a 14)");
  }
  if (data.umid !== undefined && (data.umid < 0 || data.umid > 100)) {
    errors.push("Umidade fora do range (0 a 100%)");
  }
  if (data.bat !== undefined && (data.bat < 0 || data.bat > 100)) {
    errors.push("Bateria fora do range (0 a 100%)");
  }
  return errors;
};
const validateLeituraSensores = (req, res, next) => {
  const { mac, temp, ph, umid, bat } = req.body;
  if (!mac || !validateMAC(mac)) {
    return res.status(400).json({
      success: false,
      message: "MAC address inválido ou ausente",
    });
  }
  const errors = validateSensorData({ temp, ph, umid, bat });
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Dados de sensor inválidos",
      errors,
    });
  }
  next();
};
module.exports = {
  validateMAC,
  validateSensorData,
  validateLeituraSensores,
};