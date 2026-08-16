const ConfiguracaoAlerta = require("../models-mongodb/ConfiguracaoAlerta");
class ConfiguracaoAlertaController {
  static async criar(req, res) {
    try {
      const dados = {
        ...req.body,
        usuario: req.userId,
      };
      const existe = await ConfiguracaoAlerta.findOne({
        usuario: req.userId,
        tipo: dados.tipo,
        dispositivo: dados.dispositivo || null,
        subtipo: dados.subtipo || null,
      });
      if (existe) {
        return res.status(400).json({
          success: false,
          message:
            "Configuração de alerta já existe para este tipo/dispositivo",
        });
      }
      const configuracao = await ConfiguracaoAlerta.create(dados);
      res.status(201).json({
        success: true,
        data: configuracao,
      });
    } catch (error) {
      console.error("Erro ao criar configuração de alerta:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
  static async listar(req, res) {
    try {
      const { dispositivo, tipo, ativo } = req.query;
      let filtro = { usuario: req.userId };
      if (dispositivo) {
        filtro.dispositivo = dispositivo === "null" ? null : dispositivo;
      }
      if (tipo) {
        filtro.tipo = tipo;
      }
      if (ativo !== undefined) {
        filtro.ativo = ativo === "true";
      }
      const configuracoes = await ConfiguracaoAlerta.find(filtro)
        .populate("dispositivo", "nome mac_address")
        .sort({ tipo: 1, subtipo: 1 });
      res.json({
        success: true,
        count: configuracoes.length,
        data: configuracoes,
      });
    } catch (error) {
      console.error("Erro ao listar configurações:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
  static async buscar(req, res) {
    try {
      const configuracao = await ConfiguracaoAlerta.findOne({
        _id: req.params.id,
        usuario: req.userId,
      }).populate("dispositivo", "nome mac_address");
      if (!configuracao) {
        return res.status(404).json({
          success: false,
          message: "Configuração não encontrada",
        });
      }
      res.json({
        success: true,
        data: configuracao,
      });
    } catch (error) {
      console.error("Erro ao buscar configuração:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
  static async atualizar(req, res) {
    try {
      const configuracao = await ConfiguracaoAlerta.findOneAndUpdate(
        {
          _id: req.params.id,
          usuario: req.userId,
        },
        req.body,
        { new: true, runValidators: true },
      );
      if (!configuracao) {
        return res.status(404).json({
          success: false,
          message: "Configuração não encontrada",
        });
      }
      res.json({
        success: true,
        data: configuracao,
      });
    } catch (error) {
      console.error("Erro ao atualizar configuração:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
  static async deletar(req, res) {
    try {
      const configuracao = await ConfiguracaoAlerta.findOneAndDelete({
        _id: req.params.id,
        usuario: req.userId,
      });
      if (!configuracao) {
        return res.status(404).json({
          success: false,
          message: "Configuração não encontrada",
        });
      }
      res.json({
        success: true,
        message: "Configuração removida com sucesso",
      });
    } catch (error) {
      console.error("Erro ao deletar configuração:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
  static async porDispositivo(req, res) {
    try {
      const { dispositivoId } = req.params;

      const configuracoes = await ConfiguracaoAlerta.find({
        usuario: req.userId,
        $or: [{ dispositivo: dispositivoId }, { dispositivo: null }],
      });
      res.json({
        success: true,
        count: configuracoes.length,
        data: configuracoes,
      });
    } catch (error) {
      console.error("Erro ao buscar configurações do dispositivo:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
  static async criarPadrao(req, res) {
    try {
      const { tipo } = req.params;
      const defaults = {
        TEMPERATURA: {
          tipo: "TEMPERATURA",
          limite_min: 18,
          limite_max: 24,
          unidade: "°C",
          severidade: "ALTA",
          mensagem_template:
            "Temperatura {direcao} do ideal: {valor_lido}°C (limite: {valor_limite}°C)",
        },
        UMIDADE: {
          tipo: "UMIDADE",
          limite_min: 80,
          limite_max: 90,
          unidade: "%",
          severidade: "MEDIA",
          mensagem_template:
            "Umidade {direcao} do ideal: {valor_lido}% (limite: {valor_limite}%)",
        },
        CO2: {
          tipo: "OUTRO",
          subtipo: "CO2",
          limite_max: 800,
          unidade: "ppm",
          severidade: "ALTA",
          mensagem_template:
            "CO2 alto: {valor_lido}ppm (limite: {valor_limite}ppm)",
        },
        PRAGA: {
          tipo: "OUTRO",
          subtipo: "PRAGA",
          severidade: "CRITICA",
          mensagem_template: "⚠️ PRAGA DETECTADA: {mensagem_adicional}",
        },
        COLHEITA: {
          tipo: "OUTRO",
          subtipo: "COLHEITA",
          dias_antecedencia_colheita: 3,
          severidade: "BAIXA",
          mensagem_template: "🍄 Colheita em {valor_lido} dias! Prepare-se!",
        },
      };
      if (!defaults[tipo]) {
        return res.status(400).json({
          success: false,
          message: "Tipo padrão não encontrado",
        });
      }
      const dados = {
        ...defaults[tipo],
        usuario: req.userId,
        ativo: true,
      };
      const existe = await ConfiguracaoAlerta.findOne({
        usuario: req.userId,
        tipo: dados.tipo,
        subtipo: dados.subtipo || null,
        dispositivo: null,
      });
      if (existe) {
        return res.status(400).json({
          success: false,
          message: "Configuração padrão já existe",
        });
      }
      const configuracao = await ConfiguracaoAlerta.create(dados);
      res.status(201).json({
        success: true,
        data: configuracao,
      });
    } catch (error) {
      console.error("Erro ao criar configuração padrão:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}
module.exports = ConfiguracaoAlertaController;
