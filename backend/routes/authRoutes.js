const express = require("express");
const router = express.Router();
const AuthController = require("../controllers-mongodb/authController");
const authMiddleware = require("../middleware/auth-mongodb");
const adminAuthMiddleware = require("../middleware/admin-auth-mongodb");

router.post("/registrar",AuthController.uploadFoto(),AuthController.registrar);
router.post("/login", AuthController.login);
router.post("/recuperar-senha", AuthController.recuperarSenha);
router.get("/perfil", authMiddleware, AuthController.perfil);
router.put("/perfil",authMiddleware,AuthController.uploadFoto(),AuthController.atualizarPerfil);
router.put("/usuarios/:userId/status",adminAuthMiddleware,AuthController.alterarStatusUsuario);
router.put("/alterar-senha", authMiddleware, AuthController.alterarSenha);
router.post("/logout", authMiddleware, AuthController.logout);

module.exports = router;