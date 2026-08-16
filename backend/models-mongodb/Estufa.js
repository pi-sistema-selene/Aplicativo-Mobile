const mongoose = require("mongoose");

const EstufaSchema = new mongoose.Schema(
  {
    nome: {
      type: String,
      required: [true, "O nome da estufa é obrigatório."],
      trim: true,
    },
    quantidade_compostos: {
      type: String,
      default: "0",
    },
    endereco_camera: {
      type: String,
      trim: true,
      default: "",
    },
    observacoes: {
      type: String,
      trim: true,
      default: "",
    },
    data_criacao: {
      type: String,
      default: () => new Date().toLocaleDateString("pt-BR"),
    },
    status: {
      type: String,
      enum: ["Baixo", "Médio", "Alto"],
      default: "Baixo",
    },
    usuario_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Estufa", EstufaSchema);
