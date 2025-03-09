const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const eventosRutas = require('./routes/events');

// Configurar dotenv
dotenv.config();

// Crear la aplicación Express
const app = express();
const PORT = process.env.PORT || 5000;

// Configuración CORS - Más permisiva para entornos de desarrollo y Vercel
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH'],
  credentials: true
}));

// Middleware para parsear JSON
app.use(express.json());

// Middleware para registro de solicitudes
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Función para conectar a MongoDB
const conectarDB = async () => {
  try {
    // Usar la URL de MongoDB desde las variables de entorno
    const mongoURI = process.env.MONGO_URI || 'mongodb+srv://usuario:password@cluster.mongodb.net/pantera-db';
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Conexión a MongoDB establecida');
    return true;
  } catch (err) {
    console.error('❌ Error conectando a MongoDB:', err.message);
    console.log('La aplicación continuará en modo local (sin persistencia de datos)');
    return false;
  }
};

// Intentar conectar a la base de datos al iniciar, pero no esperar la conexión
conectarDB();

// Rutas de la API
app.use('/api/eventos', eventosRutas);

// Ruta principal para verificar que el servidor está funcionando
app.get('/api', (req, res) => {
  res.json({
    message: "API de Pantera funcionando correctamente",
    status: "online",
    timestamp: new Date().toISOString(),
    mongoStatus: mongoose.connection.readyState ? 'conectado' : 'desconectado'
  });
});

// Verificar si estamos en producción
if (process.env.NODE_ENV === 'production') {
  // Servir archivos estáticos desde la carpeta build
  const clientBuildPath = path.resolve(__dirname, '..', 'client', 'build');
  app.use(express.static(clientBuildPath));
  
  // Para cualquier solicitud que no sea a /api, servir index.html
  app.get('*', (req, res) => {
    if (!req.url.startsWith('/api')) {
      res.sendFile(path.join(clientBuildPath, 'index.html'));
    }
  });
}

// Solo iniciar el servidor si no estamos en Vercel
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`
      ===================================================
      🚀 Servidor iniciado en http://localhost:${PORT}
      ===================================================
      
      Estado de la base de datos: ${mongoose.connection.readyState ? '✅ Conectada' : '❌ Desconectada'}
      
      Endpoints disponibles:
      - GET  /api              → Estado de la API
      - GET  /api/eventos      → Obtener todos los eventos
      - POST /api/eventos      → Crear un nuevo evento
      - DELETE /api/eventos/:id → Eliminar un evento
      ===================================================
    `);
  });
}

// Importante para Vercel: exportar la aplicación para serverless
module.exports = app;