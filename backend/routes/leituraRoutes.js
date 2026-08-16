const express = require("express");
const router = express.Router();
const LeituraController = require("../controllers-mongodb/leituraController");
const authMiddleware = require("../middleware/auth-mongodb");

router.post("/sensores", LeituraController.receberSensoresPublico);
router.post("/sensores/auth",authMiddleware,LeituraController.receberSensores);
router.post("/camera", LeituraController.receberCameraPublico);
router.post("/camera/test-url", LeituraController.testarPredicaoPorUrl);
router.post("/camera/auth", authMiddleware, LeituraController.receberCamera);
router.get("/:dispositivo_id/historico",authMiddleware,LeituraController.historico);
router.get("/:dispositivo_id/grafico",authMiddleware,LeituraController.grafico);
router.get("/:dispositivo_id/metricas",authMiddleware,LeituraController.metricas);

module.exports = router;