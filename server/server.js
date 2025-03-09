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

app.get('/api/eventos', async (req, res) => {
  try {
    const eventos = await Evento.find().sort({ marca_tiempo: -1 });
    res.json(eventos);
  } catch (error) {
    console.error('Error obteniendo eventos:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.post('/api/eventos', async (req, res) => {
  try {
    const evento = new Evento(req.body);
    await evento.save();
    res.status(201).json(evento);
  } catch (error) {
    console.error('Error creando evento:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.delete('/api/eventos/:id', async (req, res) => {
  try {
    await Evento.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Evento eliminado' });
  } catch (error) {
    console.error('Error eliminando evento:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor en puerto ${PORT}`);
});