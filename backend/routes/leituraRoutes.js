const express = require("express");
const router = express.Router();
const LeituraController = require("../controllers-mongodb/leituraController");
const authMiddleware = require("../middleware/auth-mongodb");

// POST /api/v1/leituras/sensores - Receber leitura dos sensores (ESP32) - PÚBLICA
router.post("/sensores", LeituraController.receberSensoresPublico);

// POST /api/v1/leituras/sensores/auth - Receber leitura com autenticação (App)
router.post(
  "/sensores/auth",
  authMiddleware,
  LeituraController.receberSensores,
);

// POST /api/v1/leituras/camera - Receber foto da câmera (ESP32-CAM) - PÚBLICA
router.post("/camera", LeituraController.receberCameraPublico);

// POST /api/v1/leituras/camera/test-url - Testar predição com URL do Cloudinary
router.post("/camera/test-url", LeituraController.testarPredicaoPorUrl);

// POST /api/v1/leituras/camera/auth - Receber foto com autenticação (App)
router.post("/camera/auth", authMiddleware, LeituraController.receberCamera);

// GET /api/v1/leituras/:dispositivo_id/historico - Histórico de leituras
router.get(
  "/:dispositivo_id/historico",
  authMiddleware,
  LeituraController.historico,
);

// GET /api/v1/leituras/:dispositivo_id/grafico - Dados para gráficos (agrupados)
router.get(
  "/:dispositivo_id/grafico",
  authMiddleware,
  LeituraController.grafico,
);

// GET /api/v1/leituras/:dispositivo_id/metricas - Métricas resumidas
router.get(
  "/:dispositivo_id/metricas",
  authMiddleware,
  LeituraController.metricas,
);

module.exports = router;
