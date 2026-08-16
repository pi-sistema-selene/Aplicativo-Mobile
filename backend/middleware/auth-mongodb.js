const jwt = require("jsonwebtoken");
const User = require("../models-mongodb/User");
const Admin = require("../models-mongodb/Admin");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Token de acesso não fornecido ou formato inválido",
      });
    }

    const token = authHeader.substring(7);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token vazio",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "secret_fallback",
    );

    const userId =
      decoded.userId || decoded.id || decoded._id || decoded.adminId;

    if (!userId) {
      console.error(
        "❌ ID não encontrado dentro do payload do Token:",
        decoded,
      );

      return res.status(401).json({
        success: false,
        message: "Payload do token inválido (ID ausente)",
      });
    }

    let user = await User.findById(userId);
    let isAdmin = false;

    if (!user) {
      user = await Admin.findById(userId);

      if (user) {
        isAdmin = true;
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Usuário não encontrado no banco",
      });
    }

    if (user.ativo === false) {
      return res.status(401).json({
        success: false,
        message: "Conta desativada",
      });
    }

    req.userId = user._id;
    req.user = user;

    if (isAdmin) {
      req.adminId = user._id;
      req.userRole = "admin";
    }

    next();
  } catch (error) {
    console.error("⚠️ Erro na autenticação:", error.message);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Token inválido ou corrompido",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Sessão expirada. Faça login novamente.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Erro interno na validação do acesso",
    });
  }
};

module.exports = authMiddleware;
