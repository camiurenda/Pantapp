const mongoose = require('mongoose');

const EventoSchema = new mongoose.Schema({
  fecha: {
    type: String,
    required: true
  },
  hora: {
    type: String,
    required: true
  },
  tipo: {
    type: String,
    required: true,
    enum: ['glucose', 'insulin', 'medication', 'food']
  },
  valor: {
    type: String,
    default: ''
  },
  notas: {
    type: String,
    default: ''
  },
  marca_tiempo: {
    type: String,
    required: true
  },
  fecha_creacion: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Evento', EventoSchema);