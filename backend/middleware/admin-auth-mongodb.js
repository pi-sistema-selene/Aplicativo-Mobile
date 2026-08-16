const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const Admin = require("../models-mongodb/Admin");

const adminAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Token de administrador não fornecido",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token inválido",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "secret_fallback",
    );

    if (!decoded.adminId) {
      return res.status(401).json({
        success: false,
        message: "Payload do token inválido (adminId ausente)",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(decoded.adminId)) {
      return res.status(401).json({
        success: false,
        message: "adminId inválido",
      });
    }

    const admin = await Admin.findById(decoded.adminId);

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Administrador não encontrado",
      });
    }

    if (!admin.ativo) {
      return res.status(401).json({
        success: false,
        message: "Administrador desativado",
      });
    }

    req.adminId = admin._id;
    req.admin = admin;

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expirado",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Token inválido",
      });
    }

    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
};

module.exports = adminAuthMiddleware;
