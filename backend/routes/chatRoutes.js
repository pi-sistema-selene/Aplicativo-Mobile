const express = require("express");
const router = express.Router();
const chatController = require("../controllers-mongodb/chatController");
const authMiddleware = require("../middleware/auth-mongodb");

router.get("/", authMiddleware, chatController.listarChats);
router.post("/", authMiddleware, chatController.criarChat);
router.patch("/:chatId/encerrar", authMiddleware, chatController.encerrarChat);
router.get("/:chatId/mensagens",authMiddleware,chatController.listarMensagens);
router.post("/:chatId/mensagens",authMiddleware,chatController.enviarMensagem);

module.exports = router;