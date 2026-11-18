const express = require("express");
const router = express.Router();
const AlertaController = require("../controllers-mongodb/alertaController");
const authMiddleware = require("../middleware/auth-mongodb");

router.use(authMiddleware);
router.get("/estatisticas", AlertaController.estatisticas);
router.get("/", AlertaController.listar);
router.patch("/:id/resolver", AlertaController.resolver);
module.exports = router;