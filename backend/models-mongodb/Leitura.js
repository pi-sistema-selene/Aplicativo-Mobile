const mongoose = require("mongoose");

const leituraSchema = new mongoose.Schema({
  dispositivo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Dispositivo",
    required: [true, "Dispositivo é obrigatório"],
  },
  tipo_leitura: {
    type: String,
    enum: ["SENSORES", "CAMERA"],
    required: true,
  },
  dados: {
    temperatura: {
      type: Number,
      min: -50,
      max: 100,
    },
    umidade: {
      type: Number,
      min: 0,
      max: 100,
    },
    luminosidade: {
      type: Number,
      min: 0,
    },
    ph: {
      type: Number,
      min: 0,
      max: 14,
    },
    condutividade: {
      type: Number,
      min: 0,
    },
    nivel_agua: {
      type: Boolean,
    },
    bateria: {
      type: Number,
      min: 0,
      max: 100,
    },
    rssi: {
      type: Number,
    },
    altura: {
      type: Number,
      min: 0,
    },
    foto_path: {
      type: String,
    },
    tamanho_arquivo: {
      type: Number,
    },
    client_ip: {
      type: String,
    },
    predicao: {
      classe: { type: String },
      confianca: { type: Number, min: 0, max: 1 },
      anomalia: { type: Boolean },
      probabilidade_saudavel: { type: Number, min: 0, max: 1 },
      threshold_usado: { type: Number },
      processado_em: { type: Date },
    },
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

leituraSchema.index({ dispositivo: 1, timestamp: -1 });
leituraSchema.index({ timestamp: -1 });
leituraSchema.index({ "dados.temperatura": 1 });
leituraSchema.index({ "dados.umidade": 1 });

leituraSchema.methods.toBasicJSON = function () {
  return {
    id: this._id,
    temperatura: this.dados.temperatura,
    umidade: this.dados.umidade,
    luminosidade: this.dados.luminosidade,
    timestamp: this.timestamp,
  };
};

module.exports = mongoose.model("Leitura", leituraSchema);
