const Activity = require("../models-mongodb/Activity");

class ActivityController {
  static async listarMinhasAcoes(req, res) {
    try {
      const limiteInformado = Number.parseInt(req.query.limit, 10);
      const paginaInformada = Number.parseInt(req.query.page, 10);
      const limit = Number.isInteger(limiteInformado)
        ? Math.min(Math.max(limiteInformado, 1), 100)
        : 30;
      const page = Number.isInteger(paginaInformada)
        ? Math.max(paginaInformada, 1)
        : 1;
      const filtro = {
        actorId: req.adminId || req.userId,
        actorType: req.adminId ? "Admin" : "User",
      };

      const [data, total] = await Promise.all([
        Activity.find(filtro)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        Activity.countDocuments(filtro),
      ]);

      return res.json({
        success: true,
        data,
        total,
        page,
        limit,
      });
    } catch (error) {
      console.error("Erro ao consultar histórico de ações:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao consultar histórico de ações",
      });
    }
  }
}

module.exports = ActivityController;
