const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { connectDB } = require('./config/mongodb');

const app = express();
const PORT = process.env.PORT || 3000;
const API_PREFIX = process.env.API_PREFIX || '/api/v1';

app.use(helmet());

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    const allowedOrigins = [
      'http://seusite.com',
      'https://seusite.com',
      'http://dashboard.seusite.com'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  exposedHeaders: ['Content-Disposition']
}));

app.use('/fotos', cors(), express.static(path.join(__dirname, '..', 'fotos_plantas')));
app.use('/fotos_perfil', cors(), express.static(path.join(__dirname, '..', 'fotos_perfil')));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use((req, res, next) => {
  console.log(`📡 ${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.use(API_PREFIX, routes);

app.use(errorHandler);

async function startServer() {
  try {
    await connectDB();
    
    console.log('✅ Conectado ao MongoDB com sucesso');

    app.listen(PORT, () => {
      console.log(`
🚀 SERVIDOR INICIADO COM SUCESSO!
================================
📡 URL: http://localhost:${PORT}
🔗 API: http://localhost:${PORT}${API_PREFIX}
🏥 Health Check: http://localhost:${PORT}${API_PREFIX}/health
🧪 Teste DB: http://localhost:${PORT}${API_PREFIX}/test-db
================================
      `);
    });
    
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;