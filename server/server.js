const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const eventosRutas = require('./routes/events');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configuración CORS para permitir solicitudes desde el frontend
app.use(cors({
  origin: function(origin, callback) {
    // Permitir solicitudes sin origen (como aplicaciones móviles o curl)
    // y desde dominios específicos (incluidos subdominios de vercel.app)
    const allowedOrigins = [
      'http://localhost:3000',
      /\.vercel\.app$/
    ];
    
    const originIsAllowed = !origin || allowedOrigins.some(allowedOrigin => {
      return typeof allowedOrigin === 'string' 
        ? allowedOrigin === origin
        : allowedOrigin.test(origin);
    });
    
    callback(null, originIsAllowed);
  },
  credentials: true
}));

app.use(express.json());

// Middleware para registrar todas las peticiones
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

const conectarDB = async () => {
  try {
    // Si estamos en Vercel, utilizamos una base de datos en la nube (MongoDB Atlas)
    // Se recomienda usar variables de entorno en Vercel para la URL de MongoDB
    const mongoURI = process.env.MONGO_URI || 'mongodb+srv://user:password@cluster.mongodb.net/pantera-db';
    
    await mongoose.connect(mongoURI);
    console.log('Conexión a MongoDB establecida');
  } catch (err) {
    console.error('Error conectando a MongoDB:', err.message);
    console.log('La aplicación continuará en modo local (sin persistencia de datos)');
  }
};

// Intentar conectar a la base de datos
conectarDB();

// Ruta principal para verificar que el servidor está funcionando
app.get('/', (req, res) => {
  const isVercel = process.env.VERCEL === '1';
  
  res.send(`
    <html>
      <head>
        <title>API de Control para Pantera</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 40px;
            line-height: 1.6;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 5px;
          }
          h1 { color: #1890ff; }
          .badge {
            display: inline-block;
            background: #52c41a;
            color: white;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 14px;
          }
          .info {
            background: #e6f7ff;
            border: 1px solid #91d5ff;
            padding: 10px;
            border-radius: 4px;
            margin: 10px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Servidor para el control de Pantera 🐕</h1>
          <p><span class="badge">Funcionando</span> El servidor está ejecutándose correctamente ${isVercel ? 'en Vercel' : `en el puerto ${PORT}`}</p>
          <p>Esta es la API que maneja los datos para la aplicación de seguimiento de diabetes de Pantera.</p>
          <p>Estado de MongoDB: ${mongoose.connection.readyState ? 'Conectado' : 'Desconectado'}</p>
          
          <div class="info">
            <p><strong>Endpoints disponibles:</strong></p>
            <ul>
              <li>GET /api/eventos - Obtener todos los eventos</li>
              <li>POST /api/eventos - Crear un nuevo evento</li>
              <li>DELETE /api/eventos/:id - Eliminar un evento</li>
            </ul>
          </div>
          
          <p>Para acceder a la aplicación web, visita la ruta principal desde un navegador.</p>
        </div>
      </body>
    </html>
  `);
});

// Rutas de la API
app.use('/api/eventos', eventosRutas);

// Manejar rutas de producción para React
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.resolve(__dirname, '..', 'client', 'build');
  
  app.use(express.static(clientBuildPath));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
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
      - GET  /                 → Página de bienvenida
      - GET  /api/eventos      → Obtener todos los eventos
      - POST /api/eventos      → Crear un nuevo evento
      - DELETE /api/eventos/:id → Eliminar un evento
      ===================================================
    `);
  });
}

// Importante para Vercel: exportar el objeto app para serverless
module.exports = app;