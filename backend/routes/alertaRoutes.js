const express = require("express");
const router = express.Router();
const AlertaController = require("../controllers-mongodb/alertaController");
router.get("/estatisticas", AlertaController.estatisticas);
router.get("/", AlertaController.listar);
router.patch("/:id/resolver", AlertaController.resolver);
module.exports = router;