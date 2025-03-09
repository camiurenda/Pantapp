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

app.use('/api/eventos', eventosRutas);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '..', 'client', 'build', 'index.html'));
  });
}

app.listen(PORT, () => console.log(`Servidor iniciado en puerto ${PORT}`));