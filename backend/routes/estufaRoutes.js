const express = require("express");
const router = express.Router();
const EstufaController = require("../controllers-mongodb/estufaController");
const authMiddleware = require("../middleware/auth-mongodb");

router.get("/listar", authMiddleware, EstufaController.listar);
router.post("/cadastrar", authMiddleware, EstufaController.cadastrar);
router.get("/detalhes/:id", authMiddleware, EstufaController.buscarPorId);

module.exports = router;