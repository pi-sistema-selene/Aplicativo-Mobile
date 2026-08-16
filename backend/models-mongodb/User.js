const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    nome_completo: {
      type: String,
      required: [true, "Nome completo é obrigatório"],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, "Email é obrigatório"],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Por favor, use um email válido"],
    },
    senha: {
      type: String,
      required: [true, "Senha é obrigatória"],
      minlength: 6,
      select: false,
    },

    tipo: {
      type: String,
      enum: ["user"],
      default: "user",
    },

    telefone: {
      type: String,
      trim: true,
      maxlength: 20,
    },
    endereco: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    data_nascimento: {
      type: Date,
      validate: {
        validator: function (value) {
          return value < new Date();
        },
        message: "Data de nascimento deve ser no passado",
      },
    },
    foto_perfil: {
      type: String,
      trim: true,
    },
    ativo: {
      type: Boolean,
      default: true,
    },
    ultimo_login: {
      type: Date,
    },
  },
  {
    timestamps: {
      createdAt: "criado_em",
      updatedAt: "atualizado_em",
    },
  },
);

userSchema.pre("save", async function () {
  if (!this.isModified("senha")) return;
  this.senha = await bcrypt.hash(this.senha, 12);
});

userSchema.methods.verificarSenha = async function (senha) {
  return await bcrypt.compare(senha, this.senha);
};

userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.senha;
  return user;
};

module.exports = mongoose.model("User", userSchema);
