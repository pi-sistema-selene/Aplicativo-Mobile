const express = require("express");
const router = express.Router();
const chatController = require("../controllers-mongodb/chatController");
const adminAuthMiddleware = require("../middleware/admin-auth-mongodb");

router.get("/chats", adminAuthMiddleware, chatController.listarChatsAdmin);
router.get("/chats/:chatId/mensagens",adminAuthMiddleware,chatController.listarMensagens);
router.post("/chats/:chatId/mensagens",adminAuthMiddleware,chatController.responderMensagemAdmin);

module.exports = router;