const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

const eventosRoutes = require('./routes/events');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/pantera_db';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ Conexión a MongoDB establecida');
  })
  .catch((err) => {
    console.error('❌ Error conectando a MongoDB:', err);
  });

app.use('/api/eventos', eventosRoutes);

app.get('/', (req, res) => {
  res.send('API del servidor para la aplicación de Pantera está en funcionamiento');
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

app.use((err, req, res, next) => {
  console.error('Error global:', err);
  res.status(500).json({
    error: 'Error del servidor',
    mensaje: process.env.NODE_ENV === 'production' 
      ? 'Ha ocurrido un error inesperado' 
      : err.message
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor iniciado en el puerto ${PORT}`);
  });
}

module.exports = app;