const Planta = require("../models-mongodb/Planta");
const Dispositivo = require("../models-mongodb/Dispositivo");
const Leitura = require("../models-mongodb/Leitura");
class PlantaController {
  static async listar(req, res) {
    try {
      const { ativo = true } = req.query;
      const filtro = {};
      if (ativo !== undefined) {
        filtro.ativo = ativo === "true";
      }
      const plantas = await Planta.find(filtro)
        .populate({
          path: "dispositivos",
          select: "nome tipo online localizacao",
          match: { ativo: true },
        })
        .sort({ data_plantio: -1 });
      res.json({
        success: true,
        data: plantas,
        total: plantas.length,
      });
    } catch (error) {
      console.error("Erro ao listar plantas:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }
  static async buscar(req, res) {
    try {
      const { id } = req.params;
      const planta = await Planta.findById(id).populate({
        path: "dispositivos",
        select: "nome tipo online localizacao mac_address",
        populate: {
          path: "leituras",
          select: "temperatura ph altura_planta timestamp",
          options: {
            sort: { timestamp: -1 },
            limit: 1,
          },
        },
      });
      if (!planta) {
        return res.status(404).json({
          success: false,
          message: "Planta não encontrada",
        });
      }
      res.json({
        success: true,
        data: planta,
      });
    } catch (error) {
      console.error("Erro ao buscar planta:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }
  static async criar(req, res) {
    try {
      const {
        especie,
        variedade,
        data_plantio,
        localizacao,
        status,
        notas,
        data_colheita_estimada,
      } = req.body;
      if (!especie || !localizacao) {
        return res.status(400).json({
          success: false,
          message: "Espécie e localização são obrigatórios",
        });
      }
      const planta = new Planta({
        especie,
        variedade,
        data_plantio: data_plantio ? new Date(data_plantio) : new Date(),
        localizacao,
        status: status || "GERMINACAO",
        notas,
        data_colheita_estimada: data_colheita_estimada
          ? new Date(data_colheita_estimada)
          : null,
        usuario: req.userId,
        ativo: true,
      });
      await planta.save();
      res.status(201).json({
        success: true,
        data: planta,
        message: "Planta criada com sucesso",
      });
    } catch (error) {
      console.error("Erro ao criar planta:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }
  static async atualizar(req, res) {
    try {
      const { id } = req.params;
      const dados = req.body;
      const planta = await Planta.findById(id);
      if (!planta) {
        return res.status(404).json({
          success: false,
          message: "Planta não encontrada",
        });
      }
      const camposPermitidos = [
        "especie",
        "variedade",
        "data_plantio",
        "data_colheita_estimada",
        "data_colheita_real",
        "localizacao",
        "status",
        "notas",
        "ativo",
      ];
      camposPermitidos.forEach((campo) => {
        if (dados[campo] !== undefined) {
          if (campo.includes("data_") && dados[campo]) {
            planta[campo] = new Date(dados[campo]);
          } else {
            planta[campo] = dados[campo];
          }
        }
      });
      await planta.save();
      res.json({
        success: true,
        data: planta,
        message: "Planta atualizada com sucesso",
      });
    } catch (error) {
      console.error("Erro ao atualizar planta:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }
  static async registrarColheita(req, res) {
    try {
      const { id } = req.params;
      const { data_colheita, observacoes } = req.body;
      const planta = await Planta.findById(id);
      if (!planta) {
        return res.status(404).json({
          success: false,
          message: "Planta não encontrada",
        });
      }
      planta.data_colheita_real = data_colheita
        ? new Date(data_colheita)
        : new Date();
      planta.status = "COLHIDA";
      planta.ativo = false;
      if (observacoes) {
        planta.notas = planta.notas
          ? `${planta.notas}\n\nColheita: ${observacoes}`
          : `Colheita: ${observacoes}`;
      }
      await planta.save();
      res.json({
        success: true,
        message: "Colheita registrada com sucesso",
      });
    } catch (error) {
      console.error("Erro ao registrar colheita:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }
  static async crescimento(req, res) {
    try {
      const { id } = req.params;
      const { dias = 30 } = req.query;
      const planta = await Planta.findById(id);
      if (!planta) {
        return res.status(404).json({
          success: false,
          message: "Planta não encontrada",
        });
      }
      const dispositivos = await Dispositivo.find({
        planta: id,
        tipo: "ESP32_CAM",
        ativo: true,
      });
      if (dispositivos.length === 0) {
        return res.json({
          success: true,
          data: [],
          message: "Nenhum dispositivo de câmera associado a esta planta",
        });
      }
      const dispositivoIds = dispositivos.map((d) => d._id);
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - parseInt(dias));
      const historico = await Leitura.aggregate([
        {
          $match: {
            dispositivo: { $in: dispositivoIds },
            "dados.altura_planta": { $exists: true, $ne: null },
            timestamp: { $gte: dataLimite },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
            },
            altura_maxima: { $max: "$dados.altura_planta" },
            altura_minima: { $min: "$dados.altura_planta" },
          },
        },
        {
          $sort: { _id: 1 },
        },
        {
          $project: {
            data: "$_id",
            altura_maxima: 1,
            altura_minima: 1,
            _id: 0,
          },
        },
      ]);
      const historicoComCrescimento = historico.map((item, index) => {
        const crescimento =
          index > 0
            ? parseFloat(item.altura_maxima) -
              parseFloat(historico[index - 1].altura_maxima)
            : 0;
        return {
          ...item,
          crescimento_diario: parseFloat(crescimento.toFixed(3)),
        };
      });
      res.json({
        success: true,
        data: historicoComCrescimento,
        total_dias: historicoComCrescimento.length,
      });
    } catch (error) {
      console.error("Erro ao buscar crescimento:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }
}
module.exports = PlantaController;
