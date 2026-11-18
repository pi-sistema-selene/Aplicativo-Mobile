const express = require("express");
const router = express.Router();

const AuthMiddleware = require("../middleware/auth-mongodb");
const userController = require("../controllers-mongodb/userController");
const adminAuthMiddleware = require("../middleware/admin-auth-mongodb");
const ActivityController = require("../controllers-mongodb/activityController");

router.post("/", adminAuthMiddleware, userController.criar);
router.post("/ping", AuthMiddleware, userController.ping);
router.get("/me", AuthMiddleware, userController.perfil);
router.get("/me/activity", AuthMiddleware, ActivityController.listarMinhasAcoes);
router.put("/me", AuthMiddleware, userController.atualizarPerfil);
router.get(
  "/me/notification-preferences",
  AuthMiddleware,
  userController.notificationPreferences,
);
router.put(
  "/me/notification-preferences",
  AuthMiddleware,
  userController.atualizarNotificationPreferences,
);
router.post("/me/push-token", AuthMiddleware, userController.registrarPushToken);
router.delete("/me/push-token", AuthMiddleware, userController.removerPushToken);
router.get("/", adminAuthMiddleware, userController.listar);
router.get("/:id", adminAuthMiddleware, userController.buscarPorId);
router.put("/:id", adminAuthMiddleware, userController.atualizarPorId);
router.delete("/:id", adminAuthMiddleware, userController.deletarPorId);

module.exports = router;