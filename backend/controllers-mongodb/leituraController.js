const Dispositivo = require("../models-mongodb/Dispositivo");
const Leitura = require("../models-mongodb/Leitura");
const cloudinary = require("../config/cloudinary");
const { predictFromUrl } = require("../services/predictService");

class LeituraController {
  static async salvarImagemCloudinary(
    equipamento,
    usuarioId,
    fotoBase64,
    timestamp,
    mac,
  ) {
    try {
      const upload = await cloudinary.uploader.upload(
        `data:image/jpeg;base64,${fotoBase64.replace(/^data:image\/jpeg;base64,/, "")}`,
        {
          folder: `fotos_cogumelos/${usuarioId}/${mac.replace(/[:]/g, "-")}`,
          public_id: `${equipamento.replace(/[^a-zA-Z0-9]/g, "_")}_${timestamp}`,
        },
      );

      return upload.secure_url;
    } catch (error) {
      console.error("Erro Cloudinary:", error);
      return null;
    }
  }

  static async receberSensores(req, res) {
    try {
      const { mac, temp, umid, lux, ph, cond, nivel, bat, rssi } = req.body;

      if (!mac) {
        return res.status(400).json({
          success: false,
          message: "MAC address é obrigatório",
        });
      }

      let dispositivo = await Dispositivo.findOneAndUpdate(
        { mac_address: mac },
        {
          $set: {
            online: true,
            ultima_comunicacao: new Date(),
          },
        },
        { new: true, upsert: true },
      );

      if (dispositivo.__v === 0) {
        dispositivo.nome = `ESP32_${mac.slice(-6)}`;
        dispositivo.tipo = "ESP32_SENSORES";
        dispositivo.usuario = req.userId || null;
        await dispositivo.save();
      }

      const leitura = await Leitura.create({
        dispositivo: dispositivo._id,
        tipo_leitura: "SENSORES",
        dados: {
          temperatura: temp,
          umidade: umid,
          luminosidade: lux,
          ph: ph,
          condutividade: cond,
          nivel_agua: nivel !== undefined ? Boolean(nivel) : null,
          bateria: bat,
          rssi: rssi,
        },
        timestamp: new Date(),
      });

      res.status(201).json({
        success: true,
        message: "Leitura recebida com sucesso",
        data: {
          dispositivo: {
            id: dispositivo._id,
            nome: dispositivo.nome,
            mac: dispositivo.mac_address,
          },
          leitura: leitura.toBasicJSON(),
        },
      });
    } catch (error) {
      console.error("Erro ao receber leitura:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }

  static async receberCamera(req, res) {
    try {
      const { mac, altura, foto_path } = req.body;

      if (!mac) {
        return res.status(400).json({
          success: false,
          message: "MAC address é obrigatório",
        });
      }

      let dispositivo = await Dispositivo.findOneAndUpdate(
        { mac_address: mac },
        {
          $set: {
            online: true,
            ultima_comunicacao: new Date(),
          },
        },
        { new: true, upsert: true },
      );

      if (dispositivo.__v === 0) {
        dispositivo.nome = `ESP32-CAM_${mac.slice(-6)}`;
        dispositivo.tipo = "ESP32_CAM";
        dispositivo.usuario = req.userId || null;
        await dispositivo.save();
      }

      let predicao = null;
      if (foto_path?.startsWith("http")) {
        predicao = await predictFromUrl(foto_path);
      }

      const leitura = await Leitura.create({
        dispositivo: dispositivo._id,
        tipo_leitura: "CAMERA",
        dados: {
          altura: altura,
          foto_path: foto_path,
          ...(predicao && { predicao }),
        },
        timestamp: new Date(),
      });

      res.status(201).json({
        success: true,
        message: "Foto recebida com sucesso",
        data: {
          dispositivo: {
            id: dispositivo._id,
            nome: dispositivo.nome,
            mac: dispositivo.mac_address,
          },
          leitura: {
            id: leitura._id,
            altura: leitura.dados.altura,
            foto_path: leitura.dados.foto_path,
            predicao: leitura.dados.predicao || null,
            timestamp: leitura.timestamp,
          },
        },
      });
    } catch (error) {
      console.error("Erro ao receber foto:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }

  static async historico(req, res) {
    try {
      const { dispositivo_id } = req.params;
      const { limit = 100, page = 1 } = req.query;

      const leituras = await Leitura.find({ dispositivo: dispositivo_id })
        .sort({ timestamp: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .populate("dispositivo", "nome mac_address");

      res.json({
        success: true,
        data: leituras,
        total: leituras.length,
      });
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }

  static async grafico(req, res) {
    try {
      const { dispositivo_id } = req.params;
      const {
        sensor = "temperatura",
        periodo = "24h",
        agrupamento = "auto",
      } = req.query;

      const sensoresPermitidos = [
        "temperatura",
        "umidade",
        "ph",
        "condutividade",
        "luminosidade",
        "altura_planta",
      ];

      if (!sensoresPermitidos.includes(sensor)) {
        return res.status(400).json({
          success: false,
          message: "Sensor não suportado",
        });
      }

      let horas;
      switch (periodo) {
        case "1h":
          horas = 1;
          break;
        case "6h":
          horas = 6;
          break;
        case "24h":
          horas = 24;
          break;
        case "7d":
          horas = 168;
          break;
        case "30d":
          horas = 720;
          break;
        default:
          horas = 24;
      }

      let groupBy;
      if (agrupamento === "auto") {
        if (periodo === "1h") groupBy = "minute";
        else if (periodo === "6h" || periodo === "24h") groupBy = "hour";
        else groupBy = "day";
      } else {
        groupBy = agrupamento.toLowerCase();
      }

      const dataLimite = new Date();
      dataLimite.setHours(dataLimite.getHours() - horas);

      const pipeline = [
        {
          $match: {
            dispositivo: dispositivo_id,
            [`dados.${sensor}`]: { $exists: true, $ne: null },
            timestamp: { $gte: dataLimite },
          },
        },
        {
          $project: {
            periodo: {
              $dateToString: {
                format: "%Y-%m-%d %H:00",
                date: "$timestamp",
              },
            },
            valor: `$dados.${sensor}`,
            timestamp: 1,
          },
        },
        {
          $group: {
            _id: "$periodo",
            valor_medio: { $avg: "$valor" },
            valor_min: { $min: "$valor" },
            valor_max: { $max: "$valor" },
            total_leituras: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 },
        },
        {
          $project: {
            periodo: "$_id",
            valor_medio: { $round: ["$valor_medio", 2] },
            valor_min: { $round: ["$valor_min", 2] },
            valor_max: { $round: ["$valor_max", 2] },
            total_leituras: 1,
            _id: 0,
          },
        },
      ];

      const dados = await Leitura.aggregate(pipeline);

      res.json({
        success: true,
        sensor,
        periodo,
        agrupamento: groupBy,
        dados: dados || [],
        total_pontos: dados.length,
      });
    } catch (error) {
      console.error("Erro ao buscar dados para gráfico:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }

  static async metricas(req, res) {
    try {
      const { dispositivo_id } = req.params;
      const { periodo = "24h" } = req.query;

      let horas;
      switch (periodo) {
        case "1h":
          horas = 1;
          break;
        case "6h":
          horas = 6;
          break;
        case "24h":
          horas = 24;
          break;
        case "7d":
          horas = 168;
          break;
        case "30d":
          horas = 720;
          break;
        default:
          horas = 24;
      }

      const dataLimite = new Date();
      dataLimite.setHours(dataLimite.getHours() - horas);

      const pipeline = [
        {
          $match: {
            dispositivo: dispositivo_id,
            timestamp: { $gte: dataLimite },
          },
        },
        {
          $group: {
            _id: null,
            total_leituras: { $sum: 1 },
            temperatura_media: { $avg: "$dados.temperatura" },
            temperatura_min: { $min: "$dados.temperatura" },
            temperatura_max: { $max: "$dados.temperatura" },
            umidade_media: { $avg: "$dados.umidade" },
            umidade_min: { $min: "$dados.umidade" },
            umidade_max: { $max: "$dados.umidade" },
            ph_media: { $avg: "$dados.ph" },
            ph_min: { $min: "$dados.ph" },
            ph_max: { $max: "$dados.ph" },
            luminosidade_media: { $avg: "$dados.luminosidade" },
            ultima_leitura: { $max: "$timestamp" },
          },
        },
        {
          $project: {
            _id: 0,
            total_leituras: 1,
            temperatura: {
              media: { $round: ["$temperatura_media", 2] },
              min: { $round: ["$temperatura_min", 2] },
              max: { $round: ["$temperatura_max", 2] },
            },
            umidade: {
              media: { $round: ["$umidade_media", 2] },
              min: { $round: ["$umidade_min", 2] },
              max: { $round: ["$umidade_max", 2] },
            },
            ph: {
              media: { $round: ["$ph_media", 2] },
              min: { $round: ["$ph_min", 2] },
              max: { $round: ["$ph_max", 2] },
            },
            luminosidade: {
              media: { $round: ["$luminosidade_media", 2] },
              min: { $min: "$dados.luminosidade" },
              max: { $max: "$dados.luminosidade" },
            },
            ultima_leitura: 1,
          },
        },
      ];

      const [metricas] = await Leitura.aggregate(pipeline);

      res.json({
        success: true,
        periodo,
        metricas: metricas || {
          total_leituras: 0,
          ultima_leitura: null,
        },
      });
    } catch (error) {
      console.error("Erro ao buscar métricas:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }

  static async receberSensoresPublico(req, res) {
    try {
      const { mac, temp, umid, lux, ph, cond, nivel, bat, rssi } = req.body;

      if (!mac) {
        return res.status(400).json({
          success: false,
          message: "MAC address é obrigatório",
        });
      }

      const dispositivo = await Dispositivo.findOne({ mac_address: mac });

      if (!dispositivo) {
        return res.status(404).json({
          success: false,
          message: "Dispositivo não cadastrado. Cadastre primeiro no sistema.",
        });
      }

      dispositivo.online = true;
      dispositivo.ultima_comunicacao = new Date();
      await dispositivo.save();

      const leitura = await Leitura.create({
        dispositivo: dispositivo._id,
        tipo_leitura: "SENSORES",
        dados: {
          temperatura: temp,
          umidade: umid,
          luminosidade: lux,
          ph: ph,
          condutividade: cond,
          nivel_agua: nivel !== undefined ? Boolean(nivel) : null,
          bateria: bat,
          rssi: rssi,
        },
        timestamp: new Date(),
      });

      res.status(201).json({
        success: true,
        message: "Leitura recebida com sucesso",
        data: {
          dispositivo: {
            id: dispositivo._id,
            nome: dispositivo.nome,
            mac: dispositivo.mac_address,
          },
          leitura: leitura.toBasicJSON(),
        },
      });
    } catch (error) {
      console.error("Erro ao receber leitura pública:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }

  static async receberCameraPublico(req, res) {
    try {
      const { equipamento, foto, tamanho, timestamp, client_ip } = req.body;

      const mac = req.body.mac?.toLowerCase().trim();

      if (!equipamento || !foto || !mac) {
        return res.status(400).json({
          success: false,
          message: "Equipamento, foto e MAC são obrigatórios",
        });
      }

      const dispositivo = await Dispositivo.findOne({
        mac_address: mac,
      });

      if (!dispositivo) {
        return res.status(404).json({
          success: false,
          message: "Dispositivo não cadastrado. Cadastre primeiro no sistema.",
        });
      }

      dispositivo.online = true;
      dispositivo.ultima_comunicacao = new Date();
      await dispositivo.save();

      const fotoPath = await LeituraController.salvarImagemCloudinary(
        equipamento,
        dispositivo.usuario.toString(),
        foto,
        timestamp,
        mac,
      );

      if (!fotoPath) {
        return res.status(500).json({
          success: false,
          message: "Falha ao enviar imagem para o Cloudinary",
        });
      }

      const predicao = await predictFromUrl(fotoPath);

      const leitura = await Leitura.create({
        dispositivo: dispositivo._id,
        tipo_leitura: "CAMERA",
        dados: {
          foto_path: fotoPath,
          tamanho_arquivo: tamanho,
          client_ip: client_ip,
          altura: req.body.altura || null,
          ...(predicao && { predicao }),
        },
        timestamp: timestamp ? new Date(timestamp * 1000) : new Date(),
      });

      res.status(201).json({
        success: true,
        message: "Foto recebida com sucesso",
        data: {
          dispositivo: {
            id: dispositivo._id,
            nome: dispositivo.nome,
            mac: dispositivo.mac_address,
          },
          leitura: {
            id: leitura._id,
            foto_path: leitura.dados.foto_path,
            predicao: leitura.dados.predicao || null,
            tamanho: leitura.dados.tamanho_arquivo,
            timestamp: leitura.timestamp,
          },
        },
      });
    } catch (error) {
      console.error("Erro ao receber foto pública:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }

  static async testarPredicaoPorUrl(req, res) {
    try {
      const { url, mac, salvar } = req.body;

      if (!url || !url.startsWith("http")) {
        return res.status(400).json({
          success: false,
          message: 'Campo "url" é obrigatório e deve ser um link http(s)',
        });
      }

      const predicao = await predictFromUrl(url);

      if (!predicao) {
        return res.status(502).json({
          success: false,
          message: "Falha ao obter predição da API de ML",
          data: { url },
        });
      }

      if (!salvar) {
        return res.json({
          success: true,
          message: "Predição obtida (não salva no banco)",
          data: { url, predicao },
        });
      }

      const macNormalizado = mac?.toLowerCase().trim();
      if (!macNormalizado) {
        return res.status(400).json({
          success: false,
          message: 'Campo "mac" é obrigatório quando salvar=true',
        });
      }

      const dispositivo = await Dispositivo.findOne({
        mac_address: macNormalizado,
      });

      if (!dispositivo) {
        return res.status(404).json({
          success: false,
          message: "Dispositivo não cadastrado",
        });
      }

      const leitura = await Leitura.create({
        dispositivo: dispositivo._id,
        tipo_leitura: "CAMERA",
        dados: {
          foto_path: url,
          predicao,
        },
        timestamp: new Date(),
      });

      res.status(201).json({
        success: true,
        message: "Predição salva com sucesso",
        data: {
          leitura: {
            id: leitura._id,
            foto_path: url,
            predicao,
            timestamp: leitura.timestamp,
          },
        },
      });
    } catch (error) {
      console.error("Erro ao testar predição por URL:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }
}

module.exports = LeituraController;
