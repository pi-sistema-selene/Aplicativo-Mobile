const Dispositivo = require("../models-mongodb/Dispositivo");
const Planta = require("../models-mongodb/Planta");
const Leitura = require("../models-mongodb/Leitura");
class DashboardController {
  static async principal(req, res) {
    try {
      const usuarioId = req.userId;
      const [contagem] = await Dispositivo.aggregate([
        { $match: { usuario: usuarioId } },
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
      const plantas_ativas = await Planta.countDocuments({
        usuario: usuarioId,
        ativo: true,
      });
      const dispositivos = await Dispositivo.find({ usuario: usuarioId })
        .populate({
          path: "leituras",
          match: { tipo_leitura: "SENSORES" },
          options: {
            sort: { timestamp: -1 },
            limit: 1,
          },
          select: "dados timestamp",
        })
        .sort({ online: -1, nome: 1 });
      const dispositivosFormatados = dispositivos.map((dispositivo) => {
        const ultimaLeitura = dispositivo.leituras[0] || {};
        return {
          id: dispositivo._id,
          nome: dispositivo.nome,
          tipo: dispositivo.tipo,
          localizacao: dispositivo.localizacao,
          online: dispositivo.online,
          ultima_comunicacao: dispositivo.ultima_comunicacao,
          ultima_leitura: {
            temperatura: ultimaLeitura.dados?.temperatura,
            umidade: ultimaLeitura.dados?.umidade,
            luminosidade: ultimaLeitura.dados?.luminosidade,
            timestamp: ultimaLeitura.timestamp,
          },
        };
      });
      res.json({
        success: true,
        data: {
          metricas: {
            total_dispositivos: contagem?.total_dispositivos || 0,
            dispositivos_online: contagem?.dispositivos_online || 0,
            plantas_ativas: plantas_ativas || 0,
          },
          dispositivos: dispositivosFormatados,
        },
        atualizado_em: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Erro no dashboard:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }
  static async dispositivo(req, res) {
    try {
      const { id } = req.params;
      const usuarioId = req.userId;
      const dispositivo = await Dispositivo.findOne({
        _id: id,
        usuario: usuarioId,
      }).populate("planta");
      if (!dispositivo) {
        return res.status(404).json({
          success: false,
          message: "Dispositivo não encontrado",
        });
      }
      const vinteQuatroHorasAtras = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const leituras = await Leitura.find({
        dispositivo: id,
        timestamp: { $gte: vinteQuatroHorasAtras },
      }).sort({ timestamp: 1 });
      const metricas = this.calcularMetricas(leituras);
      res.json({
        success: true,
        data: {
          dispositivo: {
            id: dispositivo._id,
            nome: dispositivo.nome,
            tipo: dispositivo.tipo,
            localizacao: dispositivo.localizacao,
            online: dispositivo.online,
            ultima_comunicacao: dispositivo.ultima_comunicacao,
            planta: dispositivo.planta,
          },
          metricas,
          leituras: leituras.map((l) => l.toBasicJSON()),
        },
      });
    } catch (error) {
      console.error("Erro no dashboard do dispositivo:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }
  static calcularMetricas(leituras) {
    if (leituras.length === 0) {
      return {
        temperatura: { media: null, min: null, max: null },
        umidade: { media: null, min: null, max: null },
        luminosidade: { media: null, min: null, max: null },
      };
    }
    const temps = leituras
      .map((l) => l.dados.temperatura)
      .filter((t) => t != null);
    const umids = leituras.map((l) => l.dados.umidade).filter((u) => u != null);
    const luxs = leituras
      .map((l) => l.dados.luminosidade)
      .filter((l) => l != null);
    return {
      temperatura: {
        media: temps.length
          ? (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1)
          : null,
        min: temps.length ? Math.min(...temps).toFixed(1) : null,
        max: temps.length ? Math.max(...temps).toFixed(1) : null,
      },
      umidade: {
        media: umids.length
          ? (umids.reduce((a, b) => a + b, 0) / umids.length).toFixed(1)
          : null,
        min: umids.length ? Math.min(...umids).toFixed(1) : null,
        max: umids.length ? Math.max(...umids).toFixed(1) : null,
      },
      luminosidade: {
        media: luxs.length
          ? Math.round(luxs.reduce((a, b) => a + b, 0) / luxs.length)
          : null,
        min: luxs.length ? Math.min(...luxs) : null,
        max: luxs.length ? Math.max(...luxs) : null,
      },
    };
  }
  static async plantas(req, res) {
    try {
      const usuarioId = req.userId;
      const plantas = await Planta.find({
        usuario: usuarioId,
        ativo: true,
      })
        .populate({
          path: "dispositivos",
          match: { ativo: true },
          populate: {
            path: "leituras",
            match: { "dados.altura_planta": { $exists: true, $ne: null } },
            options: {
              sort: { timestamp: -1 },
              limit: 1,
            },
            select: "dados.altura_planta timestamp",
          },
        })
        .sort({ data_plantio: -1 });
      const plantasComCrescimento = plantas.map((planta) => {
        const dispositivoCamera = planta.dispositivos.find(
          (d) => d.tipo === "ESP32_CAM",
        );
        let ultimaAltura = null;
        if (
          dispositivoCamera &&
          dispositivoCamera.leituras &&
          dispositivoCamera.leituras.length > 0
        ) {
          ultimaAltura = dispositivoCamera.leituras[0].dados.altura_planta;
        }
        return {
          _id: planta._id,
          especie: planta.especie,
          variedade: planta.variedade,
          data_plantio: planta.data_plantio,
          status: planta.status,
          localizacao: planta.localizacao,
          ultima_altura: ultimaAltura,
          total_dispositivos: planta.dispositivos.length,
        };
      });
      res.json({
        success: true,
        data: plantasComCrescimento,
        total: plantasComCrescimento.length,
      });
    } catch (error) {
      console.error("Erro no dashboard de plantas:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }
}
module.exports = DashboardController;
