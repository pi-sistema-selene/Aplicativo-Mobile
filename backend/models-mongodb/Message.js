const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },

    texto: {
      type: String,
      required: true,
      trim: true,
    },

    autor: {
      type: String,
      required: true,
    },

    tipo: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Message", MessageSchema);
