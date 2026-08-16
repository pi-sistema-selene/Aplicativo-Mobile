const express = require("express");
const router = express.Router();
const DispositivoController = require("../controllers-mongodb/dispositivoController");
const authMiddleware = require("../middleware/auth-mongodb");
const adminAuthMiddleware = require("../middleware/admin-auth-mongodb");

router.get("/meus", authMiddleware, DispositivoController.listar);
router.get("/:id/resumo", authMiddleware, DispositivoController.buscarResumo);
router.get("/:id/leituras",authMiddleware,DispositivoController.buscarLeituras);
router.get("/:id", adminAuthMiddleware, DispositivoController.buscar);
router.put("/:id", adminAuthMiddleware, DispositivoController.atualizar);
router.patch("/:id/status",authMiddleware,DispositivoController.atualizarStatus);
router.put("/:id/ativo",authMiddleware,DispositivoController.alterarStatusDispositivo);
router.get("/", adminAuthMiddleware, DispositivoController.listarTodos);
router.post("/", adminAuthMiddleware, DispositivoController.criar);
router.delete("/:id", adminAuthMiddleware, DispositivoController.deletar);

module.exports = router;