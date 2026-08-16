const Admin = require("../models-mongodb/Admin");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

class adminController {
  static async login(req, res) {
    try {
      const { usuario, senha } = req.body;

      if (!usuario || !senha) {
        return res.status(400).json({
          success: false,
          message: "Usuário e senha são obrigatórios",
        });
      }

      const login = usuario.trim().toLowerCase();

      const admin = await Admin.findOne({
        $or: [{ usuario: login }, { email: login }],
      }).select("+senha");

      if (!admin || !(await admin.verificarSenha(senha))) {
        return res.status(401).json({
          success: false,
          message: "Usuário ou senha inválidos",
        });
      }

      if (!admin.ativo) {
        return res.status(401).json({
          success: false,
          message: "Administrador desativado",
        });
      }

      admin.ultimo_login = new Date();
      await admin.save();

      const token = jwt.sign(
        {
          adminId: admin._id,
          usuario: admin.usuario,
          nivel: admin.nivel_acesso,
        },
        process.env.JWT_SECRET || "secret_fallback",
        { expiresIn: "24h" },
      );

      res.json({
        success: true,
        message: "Login de administrador realizado com sucesso",
        data: {
          token,
          admin: admin.toJSON(),
        },
      });
    } catch (error) {
      console.error("Erro no login admin:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }

  static async recuperarSenha(req, res) {
    try {
      const { email, usuario } = req.body;

      const login = (email || usuario || "").toLowerCase();

      const admin = await Admin.findOne({
        $or: [{ email: login }, { usuario: login }],
      }).select("+senha");

      if (!admin) {
        return res.json({
          success: true,
          message: "Se o usuário existir, você receberá instruções",
        });
      }

      const novaSenha = Math.random().toString(36).slice(-8);

      admin.senha = novaSenha;
      await admin.save();

      res.json({
        success: true,
        message: "Senha redefinida",
        data: {
          nova_senha: novaSenha,
        },
      });
    } catch (error) {
      console.error("Erro ao recuperar senha admin:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }

  static async resetarSenha(req, res) {
    try {
      const { token, novaSenha } = req.body;

      const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      const admin = await Admin.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpire: { $gt: Date.now() },
      }).select("+senha");

      if (!admin) {
        return res.status(400).json({
          success: false,
          message: "Token inválido ou expirado",
        });
      }

      admin.senha = novaSenha;
      admin.resetPasswordToken = undefined;
      admin.resetPasswordExpire = undefined;

      await admin.save();

      res.json({
        success: true,
        message: "Senha redefinida com sucesso",
      });
    } catch (error) {
      console.error("Erro ao resetar senha admin:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }

  static async alterarSenha(req, res) {
    try {
      const { senhaAtual, novaSenha } = req.body;

      const admin = await Admin.findById(req.admin._id).select("+senha");

      const senhaValida = await admin.verificarSenha(senhaAtual);

      if (!senhaValida) {
        return res.status(400).json({
          success: false,
          message: "Senha atual incorreta",
        });
      }

      admin.senha = novaSenha;
      await admin.save();

      res.json({
        success: true,
        message: "Senha alterada com sucesso",
      });
    } catch (error) {
      console.error("Erro ao alterar senha admin:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }

  static async criarAdmin(req, res) {
    try {
      const { usuario, senha, nome_completo, email, nivel_acesso } = req.body;

      const adminExistente = await Admin.findOne({
        $or: [{ usuario }, { email: email.toLowerCase() }],
      });

      if (adminExistente) {
        return res.status(400).json({
          success: false,
          message: "Usuário ou email já cadastrado",
        });
      }

      const admin = await Admin.create({
        usuario,
        senha,
        nome_completo,
        email: email.toLowerCase(),
        nivel_acesso: nivel_acesso || "admin",
      });

      res.status(201).json({
        success: true,
        message: "Administrador criado com sucesso",
        data: admin.toJSON(),
      });
    } catch (error) {
      console.error("Erro ao criar admin:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }

  static async listarAdmins(req, res) {
    try {
      const admins = await Admin.find().select("-senha");

      res.json({
        success: true,
        data: admins,
      });
    } catch (error) {
      console.error("Erro ao listar admins:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }

  static async perfil(req, res) {
    res.json({
      data: req.admin,
    });
  }

  static async atualizarPerfil(req, res) {
    try {
      const adminId = req.admin._id;
      const { nome_completo, email, telefone } = req.body;

      const updateData = {};

      if (nome_completo) updateData.nome_completo = nome_completo;
      if (email) updateData.email = email.toLowerCase();
      if (telefone) updateData.telefone = telefone;

      const adminAtualizado = await Admin.findByIdAndUpdate(
        adminId,
        updateData,
        { new: true },
      );

      res.json({
        message: "Perfil atualizado",
        data: adminAtualizado,
      });
    } catch (error) {
      res.status(500).json({
        message: "Erro ao atualizar perfil",
      });
    }
  }

  static async verificarToken(req, res) {
    res.json({
      success: true,
      data: req.admin,
    });
  }

  static async excluirAdmin(req, res) {
    try {
      const { id } = req.params;

      const admin = await Admin.findById(id);

      if (!admin) {
        return res.status(404).json({
          success: false,
          message: "Administrador não encontrado",
        });
      }

      await Admin.findByIdAndDelete(id);

      res.json({
        success: true,
        message: "Administrador excluído com sucesso",
      });
    } catch (error) {
      console.error("Erro ao excluir admin:", error);

      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }

  static async editarAdmin(req, res) {
    try {
      const { id } = req.params;

      const { nome_completo, email, telefone, usuario, nivel_acesso } =
        req.body;

      const admin = await Admin.findById(id);

      if (!admin) {
        return res.status(404).json({
          success: false,
          message: "Administrador não encontrado",
        });
      }

      if (nome_completo) admin.nome_completo = nome_completo;

      if (email) admin.email = email.toLowerCase();

      if (telefone) admin.telefone = telefone;

      if (usuario) admin.usuario = usuario;

      if (nivel_acesso) admin.nivel_acesso = nivel_acesso;

      await admin.save();

      res.json({
        success: true,
        message: "Administrador atualizado com sucesso",
        data: admin,
      });
    } catch (error) {
      console.error("Erro ao editar admin:", error);

      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }
}

module.exports = adminController;
