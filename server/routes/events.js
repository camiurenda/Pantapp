const express = require('express');
const router = express.Router();
const Evento = require('../models/events');

router.get('/', async (req, res) => {
  try {
    const eventos = await Evento.find().sort({ marca_tiempo: -1 });
    res.json(eventos);
  } catch (err) {
    console.error('Error obteniendo eventos:', err.message);
    res.status(500).send('Error del servidor');
  }
});

router.post('/', async (req, res) => {
  try {
    const { fecha, hora, tipo, valor, notas, marca_tiempo } = req.body;
    
    const nuevoEvento = new Evento({
      fecha,
      hora,
      tipo,
      valor,
      notas,
      marca_tiempo
    });
    
    const evento = await nuevoEvento.save();
    res.json(evento);
  } catch (err) {
    console.error('Error creando evento:', err.message);
    res.status(500).send('Error del servidor');
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const evento = await Evento.findById(req.params.id);
    
    if (!evento) {
      return res.status(404).json({ msg: 'Evento no encontrado' });
    }
    
    await evento.deleteOne();
    res.json({ msg: 'Evento eliminado' });
  } catch (err) {
    console.error('Error eliminando evento:', err.message);
    res.status(500).send('Error del servidor');
  }
});

module.exports = router;