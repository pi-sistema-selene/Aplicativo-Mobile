const mongoose = require("mongoose");
const plantaSchema = new mongoose.Schema(
  {
    especie: {
      type: String,
      required: [true, "Espécie é obrigatória"],
      trim: true,
      maxlength: 50,
    },
    variedade: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    data_plantio: {
      type: Date,
      default: Date.now,
    },
    data_colheita_estimada: {
      type: Date,
      required: false,
    },
    data_colheita_real: {
      type: Date,
      required: false,
    },
    localizacao: {
      type: String,
      required: [true, "Localização é obrigatória"],
      trim: true,
      maxlength: 100,
    },
    status: {
      type: String,
      enum: [
        "GERMINACAO",
        "CRESCENDO",
        "FLORECENDO",
        "FRUTIFICANDO",
        "COLHIDA",
        "MORTA",
      ],
      default: "GERMINACAO",
    },
    notas: {
      type: String,
      maxlength: 1000,
      required: false,
    },
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Usuário é obrigatório"],
    },
    ativo: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: {
      createdAt: "criado_em",
      updatedAt: "atualizado_em",
    },
  },
);
plantaSchema.index({ usuario: 1 });
plantaSchema.index({ especie: 1 });
plantaSchema.index({ status: 1 });
plantaSchema.index({ localizacao: 1 });
plantaSchema.index({ ativo: 1 });
module.exports = mongoose.model("Planta", plantaSchema);
