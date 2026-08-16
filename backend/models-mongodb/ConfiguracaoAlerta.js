const mongoose = require("mongoose");
const configuracaoAlertaSchema = new mongoose.Schema(
  {
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dispositivo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dispositivo",
      default: null,
    },
    tipo: {
      type: String,
      required: true,
      enum: [
        "TEMPERATURA",
        "UMIDADE",
        "LUMINOSIDADE",
        "NIVEL_AGUA",
        "BATERIA",
        "CONEXAO",
        "OUTRO",
      ],
    },
    subtipo: {
      type: String,
      enum: ["CO2", "PRAGA", "CONTAMINACAO", "COLHEITA", "OUTRO"],
      required: function () {
        return this.tipo === "OUTRO";
      },
    },
    ativo: {
      type: Boolean,
      default: true,
    },
    limite_min: {
      type: Number,
      required: function () {
        return ["TEMPERATURA", "UMIDADE"].includes(this.tipo);
      },
    },
    limite_max: {
      type: Number,
      required: function () {
        return (
          ["TEMPERATURA", "UMIDADE", "NIVEL_AGUA"].includes(this.tipo) ||
          (this.tipo === "OUTRO" && this.subtipo === "CO2")
        );
      },
    },
    unidade: {
      type: String,
      enum: ["°C", "%", "ppm", "lux", "dias", ""],
      default: "",
    },
    severidade: {
      type: String,
      enum: ["BAIXA", "MEDIA", "ALTA", "CRITICA"],
      default: "MEDIA",
    },
    mensagem_template: {
      type: String,
      maxlength: 200,
      default: function () {
        const defaults = {
          TEMPERATURA:
            "Temperatura {direcao} do ideal: {valor_lido}°C (limite: {valor_limite}°C)",
          UMIDADE:
            "Umidade {direcao} do ideal: {valor_lido}% (limite: {valor_limite}%)",
          NIVEL_AGUA:
            "Umidade do substrato baixa: {valor_lido}% (mínimo: {valor_limite}%)",
          BATERIA: "Bateria baixa: {valor_lido}% (limite: {valor_limite}%)",
          CONEXAO: "Dispositivo offline por mais de {valor_lido} minutos",
          OUTRO_CO2: "CO2 alto: {valor_lido}ppm (limite: {valor_limite}ppm)",
          OUTRO_COLHEITA: "Colheita prevista para daqui {valor_lido} dias",
          OUTRO_PRAGA: "Possível praga detectada: {mensagem_adicional}",
          OUTRO_CONTAMINACAO:
            "Possível contaminação detectada: {mensagem_adicional}",
        };
        if (this.tipo === "OUTRO" && this.subtipo) {
          return (
            defaults[`OUTRO_${this.subtipo}`] || "Alerta: {mensagem_adicional}"
          );
        }
        return defaults[this.tipo] || "Alerta de {tipo}";
      },
    },
    dias_antecedencia_colheita: {
      type: Number,
      min: 1,
      max: 10,
      required: function () {
        return this.tipo === "OUTRO" && this.subtipo === "COLHEITA";
      },
    },
    observacoes: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  },
);
configuracaoAlertaSchema.index(
  {
    usuario: 1,
    dispositivo: 1,
    tipo: 1,
    subtipo: 1,
  },
  {
    unique: true,
    partialFilterExpression: { tipo: "OUTRO" },
  },
);
configuracaoAlertaSchema.index({ usuario: 1, dispositivo: 1 });
configuracaoAlertaSchema.index({ tipo: 1, ativo: 1 });
const ConfiguracaoAlerta = mongoose.model(
  "ConfiguracaoAlerta",
  configuracaoAlertaSchema,
);
module.exports = ConfiguracaoAlerta;
