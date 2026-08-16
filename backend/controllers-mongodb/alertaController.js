const Alerta = require("../models-mongodb/Alerta");
const Dispositivo = require("../models-mongodb/Dispositivo");
const Planta = require("../models-mongodb/Planta");
class AlertaController {
  static async listar(req, res) {
    try {
      const {
        resolvido = false,
        severidade,
        dispositivo_id,
        planta_id,
        limite = 100,
      } = req.query;
      const filtro = {
        resolvido: resolvido === "true",
      };
      if (severidade) {
        filtro.severidade = severidade.toUpperCase();
      }
      if (dispositivo_id) {
        filtro.dispositivo = dispositivo_id;
      }
      if (planta_id) {
        filtro.planta = planta_id;
      }
      const alertas = await Alerta.find(filtro)
        .populate("dispositivo", "nome localizacao")
        .populate("planta", "especie localizacao")
        .sort({ timestamp: -1 })
        .limit(parseInt(limite));
      res.json({
        success: true,
        data: alertas,
        total: alertas.length,
      });
    } catch (error) {
      console.error("Erro ao listar alertas:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }
  static async resolver(req, res) {
    try {
      const { id } = req.params;
      const { observacoes } = req.body;
      const alerta = await Alerta.findById(id);
      if (!alerta) {
        return res.status(404).json({
          success: false,
          message: "Alerta não encontrado",
        });
      }
      if (alerta.resolvido) {
        return res.status(400).json({
          success: false,
          message: "Alerta já está resolvido",
        });
      }
      alerta.resolvido = true;
      alerta.resolvido_em = new Date();
      alerta.observacoes_resolucao = observacoes || "Resolvido manualmente";
      await alerta.save();
      res.json({
        success: true,
        message: "Alerta marcado como resolvido",
      });
    } catch (error) {
      console.error("Erro ao resolver alerta:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }
  static async estatisticas(req, res) {
    try {
      const { periodo = "7d" } = req.query;
      let dias;
      switch (periodo) {
        case "1d":
          dias = 1;
          break;
        case "7d":
          dias = 7;
          break;
        case "30d":
          dias = 30;
          break;
        default:
          dias = 7;
      }
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - dias);
      const estatisticas = await Alerta.aggregate([
        {
          $match: {
            timestamp: { $gte: dataLimite },
          },
        },
        {
          $group: {
            _id: { severidade: "$severidade", tipo: "$tipo" },
            total: { $sum: 1 },
            nao_resolvidos: {
              $sum: { $cond: [{ $eq: ["$resolvido", false] }, 1, 0] },
            },
            criticos_ativos: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ["$severidade", "CRITICA"] },
                      { $eq: ["$resolvido", false] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            criados_hoje: {
              $sum: {
                $cond: [
                  {
                    $gte: [
                      "$timestamp",
                      new Date(new Date().setHours(0, 0, 0, 0)),
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
        {
          $project: {
            severidade: "$_id.severidade",
            tipo: "$_id.tipo",
            total: 1,
            nao_resolvidos: 1,
            criticos_ativos: 1,
            criados_hoje: 1,
          },
        },
      ]);
      const porTipo = await Alerta.aggregate([
        {
          $match: {
            timestamp: { $gte: dataLimite },
          },
        },
        {
          $group: {
            _id: "$tipo",
            total: { $sum: 1 },
            pendentes: {
              $sum: { $cond: [{ $eq: ["$resolvido", false] }, 1, 0] },
            },
          },
        },
        {
          $project: {
            tipo: "$_id",
            total: 1,
            pendentes: 1,
          },
        },
        { $sort: { total: -1 } },
      ]);
      res.json({
        success: true,
        periodo,
        estatisticas: estatisticas || [],
        por_tipo: porTipo || [],
        atualizado_em: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }
  static async criarAlerta(dados) {
    try {
      const alerta = new Alerta(dados);
      await alerta.save();
      return alerta;
    } catch (error) {
      console.error("Erro ao criar alerta:", error);
      return null;
    }
  }
}
module.exports = AlertaController;
