const Dispositivo = require("../models-mongodb/Dispositivo");
const Planta = require("../models-mongodb/Planta");
const User = require("../models-mongodb/User");

class adminDashboardController {
  static async stats(req, res) {
    try {
      const totalUsuarios = await User.countDocuments();

      const dispositivos = await Dispositivo.aggregate([
        {
          $group: {
            _id: null,
            total_dispositivos: { $sum: 1 },
            dispositivos_online: {
              $sum: { $cond: [{ $eq: ["$online", true] }, 1, 0] },
            },
          },
        },
      ]);

      const plantasAtivas = await Planta.countDocuments({ ativo: true });

      const result = dispositivos[0] || {
        total_dispositivos: 0,
        dispositivos_online: 0,
      };

      return res.json({
        success: true,
        data: {
          usuarios_total: totalUsuarios,
          sensores_operantes: result.total_dispositivos,
          sensores_online: result.dispositivos_online,
          plantas_ativas: plantasAtivas,
        },
      });
    } catch (error) {
      console.error("Erro admin stats:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao buscar stats do admin",
      });
    }
  }

  static async home(req, res) {
    try {
      const ultimosUsuarios = await User.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("nome email createdAt");

      const ultimosDispositivos = await Dispositivo.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("nome online ultima_comunicacao");

      return res.json({
        success: true,
        data: {
          ultimos_usuarios: ultimosUsuarios,
          ultimos_dispositivos: ultimosDispositivos,
        },
      });
    } catch (error) {
      console.error("Erro admin home:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao carregar dashboard admin",
      });
    }
  }
}

module.exports = adminDashboardController;
