const mongoose = require("mongoose");
const alertaSchema = new mongoose.Schema(
  {
    tipo: {
      type: String,
      required: true,
      enum: [
        "TEMPERATURA",
        "UMIDADE",
        "LUMINOSIDADE",
        "PH",
        "CONDUTIVIDADE",
        "NIVEL_AGUA",
        "BATERIA",
        "CONEXAO",
        "OUTRO",
      ],
    },
    severidade: {
      type: String,
      required: true,
      enum: ["BAIXA", "MEDIA", "ALTA", "CRITICA"],
      default: "MEDIA",
    },
    mensagem: {
      type: String,
      required: true,
      maxlength: 500,
    },
    dispositivo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dispositivo",
      required: true,
    },
    planta: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Planta",
      required: false,
    },
    resolvido: {
      type: Boolean,
      default: false,
    },
    resolvido_em: {
      type: Date,
      required: false,
    },
    observacoes_resolucao: {
      type: String,
      maxlength: 1000,
      required: false,
    },
    dados_referencia: {
      valor_lido: { type: Number, required: false },
      valor_limite: { type: Number, required: false },
      direcao: { type: String, enum: ["ACIMA", "ABAIXO"], required: false },
    },
  },
  {
    timestamps: {
      createdAt: "timestamp",
      updatedAt: "atualizado_em",
    },
  },
);
alertaSchema.index({ resolvido: 1, timestamp: -1 });
alertaSchema.index({ dispositivo: 1, timestamp: -1 });
alertaSchema.index({ tipo: 1, timestamp: -1 });
alertaSchema.index({ severidade: 1, resolvido: 1 });
alertaSchema.index({ timestamp: 1, tipo: 1, severidade: 1 });
const Alerta = mongoose.model("Alerta", alertaSchema);
module.exports = Alerta;    