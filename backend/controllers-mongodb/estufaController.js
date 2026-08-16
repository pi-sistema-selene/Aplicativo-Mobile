const Estufa = require("../models-mongodb/Estufa");

class EstufaController {
  static async buscarPorId(req, res) {
    try {
      const { id } = req.params;
      const estufa = await Estufa.findById(id);

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
      const estufas = await Estufa.find().sort({ createdAt: -1 });

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
        endereco_camera,
        observacoes,
        data_criacao,
        status,
      } = req.body;

      if (!nome) {
        return res.status(400).json({
          success: false,
          message: "O nome da estufa é obrigatório.",
        });
      }

      const novaEstufa = await Estufa.create({
        nome,
        quantidade_compostos,
        endereco_camera,
        observacoes,
        data_criacao: data_criacao || new Date().toLocaleDateString("pt-BR"),
        status: status || "Baixo",
      });

      return res.status(201).json({
        success: true,
        message: "Estufa cadastrada com sucesso!",
        data: novaEstufa,
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
