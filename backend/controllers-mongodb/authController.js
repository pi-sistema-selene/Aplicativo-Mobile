const User = require("../models-mongodb/User");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "..", "..", "fotos_perfil");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "perfil-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase(),
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Apenas imagens são permitidas"));
    }
  },
});

class AuthController {
  static uploadFoto() {
    return upload.single("foto_perfil");
  }

  static async registrar(req, res) {
    try {
      const {
        nome_completo,
        email,
        senha,
        telefone,
        endereco,
        data_nascimento,
      } = req.body;

      const usuarioExistente = await User.findOne({
        email: email.toLowerCase(),
      });
      if (usuarioExistente) {
        return res.status(400).json({
          success: false,
          message: "Email já cadastrado",
        });
      }

      const usuarioData = {
        nome_completo,
        email: email.toLowerCase(),
        senha,
        telefone,
        endereco,
        data_nascimento: data_nascimento ? new Date(data_nascimento) : null,
      };

      if (req.file) {
        usuarioData.foto_perfil = `/fotos_perfil/${req.file.filename}`;
      }

      const usuario = await User.create(usuarioData);

      const token = jwt.sign(
        { userId: usuario._id, email: usuario.email },
        process.env.JWT_SECRET || "secret_fallback",
        { expiresIn: "7d" },
      );

      res.status(201).json({
        success: true,
        message: "Usuário criado com sucesso",
        data: { token, usuario: usuario.toJSON() },
      });
    } catch (error) {
      console.error("Erro no cadastro:", error);
      res
        .status(500)
        .json({ success: false, message: "Erro interno do servidor" });
    }
  }

  static async login(req, res) {
    try {
      const { email, senha } = req.body;

      if (!email || !senha) {
        return res
          .status(400)
          .json({ success: false, message: "Email e senha são obrigatórios" });
      }

      const usuario = await User.findOne({ email: email.toLowerCase() }).select(
        "+senha",
      );

      if (!usuario || !(await usuario.verificarSenha(senha))) {
        return res
          .status(401)
          .json({ success: false, message: "Email ou senha inválidos" });
      }

      if (!usuario.ativo) {
        return res
          .status(401)
          .json({ success: false, message: "Usuário desativado" });
      }

      usuario.ultimo_login = new Date();
      usuario.online = true;
      await usuario.save();

      const token = jwt.sign(
        { userId: usuario._id, email: usuario.email },
        process.env.JWT_SECRET || "secret_fallback",
        { expiresIn: "7d" },
      );

      res.json({
        success: true,
        message: "Login realizado com sucesso",
        data: { token, usuario: usuario.toJSON() },
      });
    } catch (error) {
      console.error("Erro no login:", error);
      res
        .status(500)
        .json({ success: false, message: "Erro interno do servidor" });
    }
  }

  static async perfil(req, res) {
    try {
      const usuario = await User.findById(req.userId).select("-senha");

      if (!usuario) {
        return res
          .status(404)
          .json({ success: false, message: "Usuário não encontrado" });
      }

      res.json({ success: true, data: usuario });
    } catch (error) {
      console.error("Erro ao buscar perfil:", error);
      res
        .status(500)
        .json({ success: false, message: "Erro interno do servidor" });
    }
  }

  static async atualizarPerfil(req, res) {
    try {
      const { nome_completo, telefone, endereco, data_nascimento } = req.body;
      const usuario = await User.findById(req.userId);

      if (!usuario) {
        return res
          .status(404)
          .json({ success: false, message: "Usuário não encontrado" });
      }

      usuario.nome_completo = nome_completo || usuario.nome_completo;
      usuario.telefone = telefone || usuario.telefone;
      usuario.endereco = endereco || usuario.endereco;
      usuario.data_nascimento = data_nascimento || usuario.data_nascimento;

      if (req.file) {
        usuario.foto_perfil = `/fotos_perfil/${req.file.filename}`;
      }

      await usuario.save();
      res.json({
        success: true,
        message: "Perfil atualizado com sucesso",
        data: usuario,
      });
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      res
        .status(500)
        .json({ success: false, message: "Erro interno do servidor" });
    }
  }

  static async alterarSenha(req, res) {
    try {
      const { senhaAtual, novaSenha } = req.body;
      const userId = req.userId;

      if (!senhaAtual || !novaSenha) {
        return res.status(400).json({
          success: false,
          message: "Ambas as senhas são obrigatórias",
        });
      }

      const usuario = await User.findById(userId).select("+senha");
      if (!usuario) {
        return res
          .status(404)
          .json({ success: false, message: "Usuário não encontrado" });
      }

      const senhaValida = await usuario.verificarSenha(senhaAtual);
      if (!senhaValida) {
        return res
          .status(401)
          .json({ success: false, message: "A senha atual está incorreta" });
      }

      usuario.senha = novaSenha;
      await usuario.save();

      res.json({ success: true, message: "Senha alterada com sucesso" });
    } catch (error) {
      console.error("Erro ao alterar senha:", error);
      res
        .status(500)
        .json({ success: false, message: "Erro interno do servidor" });
    }
  }

  static async recuperarSenha(req, res) {
    try {
      const { email } = req.body;
      const usuario = await User.findOne({ email: email?.toLowerCase() });

      if (!usuario) {
        return res
          .status(404)
          .json({ success: false, message: "Usuário não encontrado" });
      }

      const novaSenha = Math.random().toString(36).slice(-8) + "A1!";
      usuario.senha = novaSenha;
      await usuario.save();

      res.json({
        success: true,
        message: "E-mail enviado com sucesso (simulado)",
        data: { nova_senha: novaSenha },
      });
    } catch (error) {
      console.error("Erro na recuperação:", error);
      res
        .status(500)
        .json({ success: false, message: "Erro interno do servidor" });
    }
  }

  static async alterarStatusUsuario(req, res) {
    try {
      const { userId } = req.params;
      const { ativo } = req.body;

      const usuario = await User.findById(userId);
      if (!usuario) {
        return res
          .status(404)
          .json({ success: false, message: "Usuário não encontrado" });
      }

      usuario.ativo = ativo === true;
      await usuario.save();

      res.json({
        success: true,
        message: `Usuário ${usuario.ativo ? "ativado" : "desativado"} com sucesso`,
      });
    } catch (error) {
      console.error("Erro ao alterar status:", error);
      res
        .status(500)
        .json({ success: false, message: "Erro interno do servidor" });
    }
  }

  static async logout(req, res) {
    try {
      await User.findByIdAndUpdate(req.userId, {
        online: false,
      });

      return res.json({
        success: true,
        message: "Logout realizado",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro ao fazer logout",
      });
    }
  }

  static async ping(req, res) {
    try {
      await User.findByIdAndUpdate(req.userId, {
        ultimo_login: new Date(),
      });

      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro no ping",
      });
    }
  }
}

module.exports = AuthController;
