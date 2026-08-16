const express = require("express");
const router = express.Router();
const PlantaController = require("../controllers-mongodb/plantaController");

router.get("/", PlantaController.listar);
router.get("/:id", PlantaController.buscar);
router.post("/", PlantaController.criar);
router.put("/:id", PlantaController.atualizar);
router.post("/:id/colheita", PlantaController.registrarColheita);
router.get("/:id/crescimento", PlantaController.crescimento);

module.exports = router;