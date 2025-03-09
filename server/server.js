const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const eventosRutas = require('./routes/events');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const conectarDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI
    
    await mongoose.connect(mongoURI);
    console.log('Conexión a MongoDB establecida');
  } catch (err) {
    console.error('Error conectando a MongoDB:', err.message);
    console.log('La aplicación continuará en modo local (sin persistencia de datos)');
  }
};

conectarDB();

app.get('/', (req, res) => {
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
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Servidor para el control de Pantera 🐕</h1>
          <p><span class="badge">Funcionando</span> El servidor está ejecutándose correctamente en el puerto ${PORT}</p>
          <p>Esta es la API que maneja los datos para la aplicación de seguimiento de diabetes de Pantera.</p>
          <p>Estado de MongoDB: ${mongoose.connection.readyState ? 'Conectado' : 'Desconectado'}</p>
          <p>Para acceder a la aplicación web, visita la ruta principal desde un navegador.</p>
        </div>
      </body>
    </html>
  `);
});

app.use('/api/eventos', eventosRutas);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '..', 'client', 'build', 'index.html'));
  });
}

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