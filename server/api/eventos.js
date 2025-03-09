import mongoose from 'mongoose';
import { EventoSchema } from '../../server/models/events';

// Asegurar una sola conexión a MongoDB
let cachedDb = null;

async function conectarDB() {
  if (cachedDb) {
    console.log('Usando conexión MongoDB existente');
    return cachedDb;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Nueva conexión MongoDB establecida');
    cachedDb = conn;
    return conn;
  } catch (error) {
    console.error('Error conectando a MongoDB:', error);
    throw error;
  }
}

// Modelo solo se crea si no existe
const Evento = mongoose.models.Evento || mongoose.model('Evento', EventoSchema);

export default async function handler(req, res) {
  try {
    // Conectar a MongoDB
    await conectarDB();
    
    // Log para debugging
    console.log(`API Request: ${req.method} ${req.url}`);

    switch (req.method) {
      case 'GET':
        const eventos = await Evento.find().sort({ marca_tiempo: -1 });
        return res.status(200).json(eventos);

      case 'POST':
        const { fecha, hora, tipo, valor, notas, marca_tiempo } = req.body;
        
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

        const eventoGuardado = await nuevoEvento.save();
        return res.status(201).json(eventoGuardado);

      case 'DELETE':
        const id = req.query.id;
        
        if (!id?.match(/^[0-9a-fA-F]{24}$/)) {
          return res.status(400).json({
            error: 'ID inválido',
            mensaje: 'El formato del ID no es válido'
          });
        }

        const eventoEliminado = await Evento.findByIdAndDelete(id);
        
        if (!eventoEliminado) {
          return res.status(404).json({
            error: 'No encontrado',
            mensaje: 'Evento no encontrado'
          });
        }

        return res.status(200).json({ mensaje: 'Evento eliminado correctamente' });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        return res.status(405).json({ 
          error: 'Método no permitido',
          mensaje: `Método ${req.method} no está permitido` 
        });
    }
  } catch (error) {
    console.error('Error en API:', error);
    return res.status(500).json({
      error: 'Error del servidor',
      mensaje: process.env.NODE_ENV === 'production' 
        ? 'Ha ocurrido un error inesperado'
        : error.message
    });
  }
}