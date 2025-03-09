const express = require('express');
const router = express.Router();
const Evento = require('../models/events');

// Middleware para manejo de errores en rutas asíncronas
const asyncHandler = fn => (req, res, next) => {
  return Promise.resolve(fn(req, res, next)).catch(next);
};

// Obtener todos los eventos
router.get('/', asyncHandler(async (req, res) => {
  const eventos = await Evento.find().sort({ marca_tiempo: -1 });
  res.json(eventos);
}));

// Crear un nuevo evento
router.post('/', asyncHandler(async (req, res) => {
  const { fecha, hora, tipo, valor, notas, marca_tiempo } = req.body;
  
  // Validación básica
  if (!fecha || !hora || !tipo) {
    return res.status(400).json({ 
      error: 'Datos incompletos', 
      mensaje: 'Se requieren fecha, hora y tipo' 
    });
  }
  
  const nuevoEvento = new Evento({
    fecha,
    hora,
    tipo,
    valor: valor || '',
    notas: notas || '',
    marca_tiempo: marca_tiempo || `${fecha}T${hora}`
  });
  
  const evento = await nuevoEvento.save();
  res.status(201).json(evento);
}));

// Eliminar un evento
router.delete('/:id', asyncHandler(async (req, res) => {
  // Validación de formato de ID para MongoDB
  if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({ 
      error: 'ID inválido', 
      mensaje: 'El formato del ID no es válido' 
    });
  }
  
  const evento = await Evento.findById(req.params.id);
  
  if (!evento) {
    return res.status(404).json({ 
      error: 'No encontrado', 
      mensaje: 'Evento no encontrado' 
    });
  }
  
  await evento.deleteOne();
  res.json({ mensaje: 'Evento eliminado correctamente' });
}));

// Middleware para manejar errores
router.use((err, req, res, next) => {
  console.error('Error en ruta de eventos:', err);
  res.status(500).json({ 
    error: 'Error del servidor', 
    mensaje: process.env.NODE_ENV === 'production' 
      ? 'Ha ocurrido un error inesperado' 
      : err.message 
  });
});

module.exports = router;