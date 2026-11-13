const Estufa = require("../models-mongodb/Estufa");
const Dispositivo = require("../models-mongodb/Dispositivo");
const mongoose = require("mongoose");

class EstufaController {
  static async buscarPorId(req, res) {
    try {
      const { id } = req.params;
      const filtro = { _id: id };
      if (!req.adminId) {
        filtro.usuario_id = req.userId;
      }

      const estufa = await Estufa.findOne(filtro).populate(
        "dispositivos",
        "nome tipo mac_address localizacao online ativo",
      );

      if (!estufa) {
        return res
          .status(404)
          .json({ success: false, message: "Estufa não encontrada" });
      }

      res.status(200).json({ success: true, data: estufa });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Erro ao buscar detalhes" });
    }
  }

  /**
   * Lista todas as estufas cadastradas no banco
   * Usada na tela: (tabs)/estufas.tsx
   */
  static async listar(req, res) {
    try {
      const filtro = req.adminId ? {} : { usuario_id: req.userId };
      const estufas = await Estufa.find(filtro)
        .populate("dispositivos", "nome tipo mac_address localizacao online ativo")
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        data: estufas,
      });
    } catch (error) {
      console.error("Erro ao listar estufas:", error);
      return res.status(500).json({
        success: false,
        message: "Erro interno ao buscar estufas",
        error: error.message,
      });
    }
  }

  /**
   * Cria uma nova estufa no banco de dados
   * Usada na tela: nova-estufa.tsx
   */
  static async cadastrar(req, res) {
    try {
      const {
        nome,
        quantidade_compostos,
        observacoes,
        data_criacao,
        status,
        dispositivos_ids = [],
      } = req.body;

      if (typeof nome !== "string" || !nome.trim()) {
        return res.status(400).json({
          success: false,
          message: "O nome da estufa é obrigatório.",
        });
      }

      if (
        !Array.isArray(dispositivos_ids) ||
        dispositivos_ids.some((id) => !mongoose.Types.ObjectId.isValid(id))
      ) {
        return res.status(400).json({
          success: false,
          message: "A lista de dispositivos selecionados é inválida.",
        });
      }

      const idsUnicos = [...new Set(dispositivos_ids.map(String))];
      const dispositivos = await Dispositivo.find({
        _id: { $in: idsUnicos },
        usuario: req.userId,
        ativo: true,
      }).select("_id");

      if (dispositivos.length !== idsUnicos.length) {
        return res.status(400).json({
          success: false,
          message: "Um ou mais dispositivos não estão disponíveis para este usuário.",
        });
      }

      const novaEstufa = await Estufa.create({
        nome: nome.trim(),
        quantidade_compostos,
        dispositivos: dispositivos.map((dispositivo) => dispositivo._id),
        observacoes,
        data_criacao: data_criacao || new Date().toLocaleDateString("pt-BR"),
        status,
        usuario_id: req.userId,
      });

      return res.status(201).json({
        success: true,
        message: "Estufa cadastrada com sucesso!",
        data: await novaEstufa.populate(
          "dispositivos",
          "nome tipo mac_address localizacao online ativo",
        ),
      });
    } catch (error) {
      console.error("Erro ao cadastrar estufa:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao processar o cadastro.",
        error: error.message,
      });
    }
  }
}

module.exports = EstufaController;
