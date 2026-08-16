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
  },
  { timestamps: true },
);

module.exports = mongoose.model("Chat", ChatSchema);
