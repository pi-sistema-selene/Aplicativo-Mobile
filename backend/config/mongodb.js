const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI não definida no .env");
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`✅ MongoDB Conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ Erro ao conectar com MongoDB:", error.message);
    process.exit(1);
  }
};

module.exports = { connectDB, mongoose };
