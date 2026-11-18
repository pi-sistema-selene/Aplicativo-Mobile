const mongoose = require("mongoose");

const ChatSchema = new mongoose.Schema(
  {
    nome: {
      type: String,
      default: "Suporte",
    },

    status: {
      type: String,
      enum: ["ativo", "encerrado"],
      default: "ativo",
    },

    userId: {
      type: String,
      required: true,
    },
    encerradoPor: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "encerradoPorTipo",
    },
    encerradoPorTipo: {
      type: String,
      enum: ["User", "Admin"],
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Chat", ChatSchema);
