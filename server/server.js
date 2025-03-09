const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB conectado'))
  .catch(err => console.error('❌ Error MongoDB:', err));

const eventoSchema = new mongoose.Schema({
  fecha: String,
  hora: String,
  tipo: {
    type: String,
    enum: ['glucose', 'insulin', 'medication', 'food']
  },
  valor: String,
  notas: String,
  marca_tiempo: String
}, { timestamps: true });

const Evento = mongoose.model('Evento', eventoSchema);

// Ruta raíz para verificar que el servidor está funcionando
app.get('/', (req, res) => {
  res.json({
    mensaje: 'API de Pantera funcionando correctamente',
    endpoints: {
      GET_eventos: '/api/eventos',
      POST_nuevo_evento: '/api/eventos',
      DELETE_evento: '/api/eventos/:id'
    },
    estado: {
      servidor: 'activo',
      version: '1.0.0'
    }
  });
});

// Ruta para verificar estado de la API
app.get('/api', (req, res) => {
  res.json({
    estado: 'activo',
    mensaje: 'API de eventos para Pantera'
  });
});

app.get('/api/eventos', async (req, res) => {
  try {
    const eventos = await Evento.find().sort({ marca_tiempo: -1 });
    console.log(`Eventos encontrados: ${eventos.length}`);
    res.json(eventos);
  } catch (error) {
    console.error('Error obteniendo eventos:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.post('/api/eventos', async (req, res) => {
  try {
    console.log('Creando nuevo evento:', req.body);
    const evento = new Evento(req.body);
    await evento.save();
    console.log('Evento creado:', evento._id);
    res.status(201).json(evento);
  } catch (error) {
    console.error('Error creando evento:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.delete('/api/eventos/:id', async (req, res) => {
  try {
    console.log('Eliminando evento:', req.params.id);
    await Evento.findByIdAndDelete(req.params.id);
    console.log('Evento eliminado exitosamente');
    res.json({ mensaje: 'Evento eliminado' });
  } catch (error) {
    console.error('Error eliminando evento:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Middleware para manejar rutas no encontradas
app.use((req, res) => {
  console.log(`Ruta no encontrada: ${req.method} ${req.url}`);
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor en puerto ${PORT}`);
  console.log(`📍 Rutas disponibles:
    - GET  /
    - GET  /api
    - GET  /api/eventos
    - POST /api/eventos
    - DEL  /api/eventos/:id`);
});