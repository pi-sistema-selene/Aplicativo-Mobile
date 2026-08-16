const Dispositivo = require("../models-mongodb/Dispositivo");
const Planta = require("../models-mongodb/Planta");
const User = require("../models-mongodb/User");
const Leitura = require("../models-mongodb/Leitura");

class DispositivoController {
  static async listar(req, res) {
    try {
      const usuarioId = req.userId;

      const isAdmin =
        !!req.adminId ||
        req.userRole === "admin" ||
        req.userRole === "master" ||
        req.nivel === "superadmin";

      const { incluir_inativos } = req.query;

      let filtro = {};

      if (!isAdmin) {
        filtro.usuario = usuarioId;
      }

      if (incluir_inativos !== "true") {
        filtro.ativo = true;
      }

      const dispositivos = await Dispositivo.find(filtro)
        .populate("planta", "especie status")
        .populate("usuario", "nome_completo email")
        .sort({ nome: 1 });

      return res.status(200).json({
        success: true,
        data: dispositivos,
        total: dispositivos.length,
        modo_visualizacao: isAdmin ? "visao_geral_admin" : "visao_usuario",
      });
    } catch (error) {
      console.error("Erro ao listar dispositivos:", error);

      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }

  static async buscar(req, res) {
    try {
      const { id } = req.params;

      const dispositivo = await Dispositivo.findById(id)
        .populate("planta")
        .populate("usuario", "nome_completo email");

      if (!dispositivo) {
        return res.status(404).json({
          success: false,
          message: "Dispositivo não Encontrado",
        });
      }

      return res.status(200).json({
        success: true,
        data: dispositivo,
      });
    } catch (error) {
      console.error("Erro ao buscar dispositivo:", error);

      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }

  static async criar(req, res) {
    try {
      const { mac_address, nome, tipo, localizacao, planta_id, usuario_id } =
        req.body;

      if (!mac_address) {
        return res.status(400).json({
          success: false,
          message: "MAC address é obrigatório",
        });
      }

      if (!usuario_id) {
        return res.status(400).json({
          success: false,
          message: "Usuário é obrigatório",
        });
      }

      const usuarioExiste = await User.findById(usuario_id);

      if (!usuarioExiste) {
        return res.status(404).json({
          success: false,
          message: "Usuário não encontrado",
        });
      }

      const dispositivoExistente = await Dispositivo.findOne({
        mac_address,
      });

      if (dispositivoExistente) {
        return res.status(400).json({
          success: false,
          message: "MAC address já cadastrado",
        });
      }

      const dispositivo = await Dispositivo.create({
        mac_address,
        nome: nome || `ESP32_${mac_address.slice(-6)}`,
        tipo: tipo || "ESP32_SENSORES",
        localizacao,
        planta: planta_id || null,
        usuario: usuario_id,
        online: true,
        ativo: true,
        ultima_comunicacao: new Date(),
      });

      return res.status(201).json({
        success: true,
        message: "Dispositivo criado com sucesso",
        data: dispositivo,
      });
    } catch (error) {
      console.error("Erro ao criar dispositivo:", error);

      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }

  static async atualizar(req, res) {
    try {
      const { id } = req.params;

      const { nome, tipo, localizacao, planta_id, usuario_id, mac_address } =
        req.body;

      const dispositivo = await Dispositivo.findById(id);

      if (!dispositivo) {
        return res.status(404).json({
          success: false,
          message: "Dispositivo não encontrado",
        });
      }

      if (usuario_id) {
        const usuarioExiste = await User.findById(usuario_id);

        if (!usuarioExiste) {
          return res.status(404).json({
            success: false,
            message: "Usuário não encontrado",
          });
        }
      }

      if (planta_id) {
        const plantaExiste = await Planta.findById(planta_id);

        if (!plantaExiste) {
          return res.status(404).json({
            success: false,
            message: "Planta não encontrada",
          });
        }
      }

      const atualizado = await Dispositivo.findByIdAndUpdate(
        id,
        {
          nome,
          tipo,
          localizacao,
          mac_address,
          planta: planta_id || null,
          usuario: usuario_id,
        },
        {
          new: true,
          runValidators: true,
        },
      )
        .populate("usuario", "nome_completo email")
        .populate("planta");

      return res.status(200).json({
        success: true,
        message: "Dispositivo atualizado com sucesso",
        data: atualizado,
      });
    } catch (error) {
      console.error("Erro ao atualizar dispositivo:", error);

      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }

  static async atualizarStatus(req, res) {
    try {
      const { id } = req.params;
      const { online } = req.body;

      const dispositivo = await Dispositivo.findById(id);

      if (!dispositivo) {
        return res.status(404).json({
          success: false,
          message: "Dispositivo não encontrado",
        });
      }

      const atualizado = await Dispositivo.findByIdAndUpdate(
        id,
        {
          online,
          ultima_comunicacao: new Date(),
        },
        {
          new: true,
        },
      );

      return res.status(200).json({
        success: true,
        message: `Dispositivo ${online ? "online" : "offline"}`,
        data: atualizado,
      });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);

      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }

  static async alterarStatusDispositivo(req, res) {
    try {
      const { id } = req.params;
      const { ativo } = req.body;

      const dispositivo = await Dispositivo.findById(id);

      if (!dispositivo) {
        return res.status(404).json({
          success: false,
          message: "Dispositivo não encontrado",
        });
      }

      const statusAnterior = dispositivo.ativo;

      dispositivo.ativo = ativo === true;

      await dispositivo.save();

      return res.status(200).json({
        success: true,
        message: `Dispositivo ${
          dispositivo.ativo ? "ativado" : "desativado"
        } com sucesso`,
        data: {
          id: dispositivo._id,
          nome: dispositivo.nome,
          mac_address: dispositivo.mac_address,
          ativo: dispositivo.ativo,
          status_anterior: statusAnterior,
        },
      });
    } catch (error) {
      console.error("Erro ao alterar status do dispositivo:", error);

      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }

  static async listarTodos(req, res) {
    try {
      const dispositivos = await Dispositivo.find()
        .populate("usuario", "nome_completo email")
        .populate("planta")
        .sort({ nome: 1 });

      return res.status(200).json({
        success: true,
        data: dispositivos,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }

  static async deletar(req, res) {
    try {
      const { id } = req.params;

      const dispositivo = await Dispositivo.findByIdAndDelete(id);

      if (!dispositivo) {
        return res.status(404).json({
          success: false,
          message: "Dispositivo não encontrado",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Dispositivo removido com sucesso",
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        success: false,
        message: "Erro ao remover dispositivo",
      });
    }
  }

  static async buscarLeituras(req, res) {
    try {
      const { id } = req.params;

      const limite = parseInt(req.query.limite) || 40;

      const leituras = await Leitura.find({
        dispositivo: id,
      })
        .sort({ timestamp: -1 })
        .limit(limite);

      return res.status(200).json({
        success: true,
        data: leituras,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        success: false,
        message: "Erro ao buscar leituras",
      });
    }
  }

  static async buscarResumo(req, res) {
    try {
      const { id } = req.params;

      const [totalLeituras, totalCapturas, totalSensores] = await Promise.all([
        Leitura.countDocuments({ dispositivo: id }),

        Leitura.countDocuments({
          dispositivo: id,
          tipo_leitura: "CAMERA",
        }),

        Leitura.countDocuments({
          dispositivo: id,
          tipo_leitura: "SENSORES",
        }),
      ]);

      const totalGeral = totalCapturas + totalSensores;

      return res.status(200).json({
        success: true,
        data: {
          totalLeituras,
          totalCapturas,
          totalSensores,
          totalGeral,
        },
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        success: false,
        message: "Erro ao buscar resumo",
      });
    }
  }
}

module.exports = DispositivoController;
