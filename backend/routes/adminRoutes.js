const express = require("express");
const router = express.Router();
const adminController = require("../controllers-mongodb/adminController");
const adminAuthMiddleware = require("../middleware/admin-auth-mongodb");

router.post("/login", adminController.login);
router.post("/criar", adminAuthMiddleware, adminController.criarAdmin);
router.get("/listar", adminAuthMiddleware, adminController.listarAdmins);
router.get("/verificar", adminAuthMiddleware, adminController.verificarToken);
router.get("/perfil", adminAuthMiddleware, adminController.perfil);
router.put("/perfil", adminAuthMiddleware, adminController.atualizarPerfil);
router.post("/recuperar-senha", adminController.recuperarSenha);
router.put("/resetar-senha", adminController.resetarSenha);
router.put("/alterar-senha", adminAuthMiddleware, adminController.alterarSenha);
router.delete("/:id", adminAuthMiddleware, adminController.excluirAdmin);
router.put("/:id", adminAuthMiddleware, adminController.editarAdmin);

module.exports = router;