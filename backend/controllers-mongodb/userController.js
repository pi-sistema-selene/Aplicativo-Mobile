const User = require("../models-mongodb/User");
const bcrypt = require("bcryptjs");

class userController {
  static async perfil(req, res) {
    try {
      const user = await User.findById(req.userId).select("-senha");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Usuário não encontrado",
        });
      }

      return res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro ao buscar perfil",
      });
    }
  }

  static async listar(req, res) {
    try {
      const usuarios = await User.find({ tipo: "user" }).select(
        "_id nome_completo email telefone endereco criado_em",
      );

      return res.json({
        success: true,
        data: usuarios,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro ao listar usuários",
      });
    }
  }

  static async atualizarPerfil(req, res) {
    try {
      const { nome_completo, email } = req.body;

      const user = await User.findByIdAndUpdate(
        req.userId,
        { nome_completo, email },
        { new: true },
      ).select("-senha");

      return res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro ao atualizar perfil",
      });
    }
  }

  static async criar(req, res) {
    try {
      const { nome_completo, email, senha, telefone, data_nascimento, tipo } =
        req.body;

      const userExists = await User.findOne({ email });

      if (userExists) {
        return res.status(400).json({
          success: false,
          message: "Email já está em uso",
        });
      }

      const senhaHash = await bcrypt.hash(senha, 10);

      const user = await User.create({
        nome_completo,
        email,
        senha: senhaHash,
        telefone: telefone || null,
        data_nascimento: data_nascimento || null,
        tipo: tipo || "user",
        ativo: true,
      });

      return res.status(201).json({
        success: true,
        data: user,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro ao criar usuário",
      });
    }
  }

  static async ping(req, res) {
    return res.json({
      success: true,
      message: "online",
      user: req.userId,
    });
  }

  static async notificationPreferences(req, res) {
    try {
      if (req.userRole === "admin") {
        return res.status(403).json({
          success: false,
          message: "Configurações de notificação indisponíveis para administradores",
        });
      }

      const user = await User.findById(req.userId).select(
        "notificationPreferences",
      );
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Usuário não encontrado",
        });
      }

      return res.json({
        success: true,
        data: user.notificationPreferences,
      });
    } catch (error) {
      console.error("Erro ao buscar preferências de notificação:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao buscar preferências de notificação",
      });
    }
  }

  static async atualizarNotificationPreferences(req, res) {
    try {
      if (req.userRole === "admin") {
        return res.status(403).json({
          success: false,
          message: "Configurações de notificação indisponíveis para administradores",
        });
      }

      const allowedKeys = [
        "geral",
        "som",
        "celular",
        "vibrar",
        "personalizadas",
        "baixos",
      ];
      const updates = {};
      for (const key of allowedKeys) {
        if (key in req.body) {
          if (typeof req.body[key] !== "boolean") {
            return res.status(400).json({
              success: false,
              message: `A configuração "${key}" deve ser booleana`,
            });
          }
          updates[`notificationPreferences.${key}`] = req.body[key];
        }
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          success: false,
          message: "Nenhuma configuração de notificação válida foi enviada",
        });
      }

      const user = await User.findByIdAndUpdate(
        req.userId,
        { $set: updates },
        { new: true, runValidators: true },
      ).select("notificationPreferences");
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Usuário não encontrado",
        });
      }

      return res.json({
        success: true,
        data: user.notificationPreferences,
      });
    } catch (error) {
      console.error("Erro ao atualizar preferências de notificação:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao atualizar preferências de notificação",
      });
    }
  }

  static async registrarPushToken(req, res) {
    try {
      if (req.userRole === "admin") {
        return res.status(403).json({
          success: false,
          message: "Notificações push indisponíveis para administradores",
        });
      }

      const { token } = req.body;
      if (
        typeof token !== "string" ||
        !/^(Exponent|Expo)PushToken\[[^\]]+\]$/.test(token)
      ) {
        return res.status(400).json({
          success: false,
          message: "Token de notificação push inválido",
        });
      }

      const user = await User.findByIdAndUpdate(
        req.userId,
        { $addToSet: { pushTokens: token } },
        { new: true },
      ).select("_id");
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Usuário não encontrado",
        });
      }

      return res.json({ success: true });
    } catch (error) {
      console.error("Erro ao registrar token de notificação:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao registrar token de notificação",
      });
    }
  }

  static async removerPushToken(req, res) {
    try {
      if (req.userRole === "admin") {
        return res.status(403).json({
          success: false,
          message: "Notificações push indisponíveis para administradores",
        });
      }

      const { token } = req.body;
      if (typeof token !== "string") {
        return res.status(400).json({
          success: false,
          message: "Token de notificação push inválido",
        });
      }

      await User.updateOne(
        { _id: req.userId },
        { $pull: { pushTokens: token } },
      );
      return res.json({ success: true });
    } catch (error) {
      console.error("Erro ao remover token de notificação:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao remover token de notificação",
      });
    }
  }

  static async buscarPorId(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findById(id).select("-senha");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Usuário não encontrado",
        });
      }

      return res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro ao buscar usuário",
      });
    }
  }
  static async atualizarPorId(req, res) {
    try {
      const { id } = req.params;

      const { nome_completo, email, telefone, endereco } = req.body;

      const user = await User.findByIdAndUpdate(
        id,
        {
          nome_completo,
          email,
          telefone,
          endereco,
        },
        { new: true },
      ).select("-senha");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Usuário não encontrado",
        });
      }

      return res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro ao atualizar usuário",
      });
    }
  }
  static async deletarPorId(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findByIdAndDelete(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Usuário não encontrado",
        });
      }

      return res.json({
        success: true,
        message: "Usuário deletado com sucesso",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro ao deletar usuário",
      });
    }
  }
}

module.exports = userController;
