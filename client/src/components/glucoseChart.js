import React, { useState, useEffect } from 'react';
import { Card, Radio, Empty, Spin } from 'antd';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine 
} from 'recharts';
import dayjs from 'dayjs';

const GlucoseChart = ({ events, isMobile }) => {
  const [timeRange, setTimeRange] = useState('day');
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    prepareChartData();
  }, [events, timeRange]);

  const prepareChartData = () => {
    setLoading(true);
    
    if (!events || events.length === 0) {
      setChartData([]);
      setLoading(false);
      return;
    }

    // Filtrar solo eventos de glucosa
    const glucoseEvents = events.filter(event => event.type === 'glucose');
    
    if (glucoseEvents.length === 0) {
      setChartData([]);
      setLoading(false);
      return;
    }

    // Obtener fecha actual
    const hoy = dayjs().format('YYYY-MM-DD');
    
    let filteredEvents;
    let dateFormat;

    switch (timeRange) {
      case 'day': // Un día (hoy)
        filteredEvents = glucoseEvents.filter(event => event.date === hoy);
        dateFormat = 'HH:mm';
        break;
      case '3days': // Últimos 3 días
        filteredEvents = glucoseEvents.filter(event => {
          const eventDate = dayjs(event.date);
          return dayjs().diff(eventDate, 'day') < 3;
        });
        dateFormat = 'DD/MM HH:mm';
        break;
      case 'week': // Última semana
        filteredEvents = glucoseEvents.filter(event => {
          const eventDate = dayjs(event.date);
          return dayjs().diff(eventDate, 'day') < 7;
        });
        dateFormat = 'DD/MM';
        break;
      default:
        filteredEvents = glucoseEvents;
        dateFormat = 'DD/MM HH:mm';
    }

    // Ordenar eventos por fecha y hora
    filteredEvents.sort((a, b) => {
      return dayjs(`${a.date} ${a.time}`).valueOf() - dayjs(`${b.date} ${b.time}`).valueOf();
    });

    // Formatear datos para el gráfico
    const formattedData = filteredEvents.map(event => ({
      fecha: dayjs(`${event.date} ${event.time}`).format(dateFormat),
      valor: parseFloat(event.value),
      timestamp: dayjs(`${event.date} ${event.time}`).valueOf(),
      notas: event.notes
    }));

    setChartData(formattedData);
    setLoading(false);
  };

  const handleRangeChange = e => {
    setTimeRange(e.target.value);
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{ 
          backgroundColor: '#fff', 
          padding: '10px', 
          border: '1px solid #ccc',
          borderRadius: '4px'
        }}>
          <p><strong>Fecha:</strong> {data.fecha}</p>
          <p><strong>Glucosa:</strong> {data.valor} mg/dL</p>
          {data.notas && <p><strong>Notas:</strong> {data.notas}</p>}
        </div>
      );
    }
    return null;
  };

  return (
    <Card 
      title="Gráfico de Glucosa" 
      extra={
        <Radio.Group 
          value={timeRange} 
          onChange={handleRangeChange}
          size={isMobile ? "small" : "middle"}
        >
          <Radio.Button value="day">Hoy</Radio.Button>
          <Radio.Button value="3days">3 días</Radio.Button>
          <Radio.Button value="week">Semana</Radio.Button>
        </Radio.Group>
      }
      style={{ marginTop: 16, marginBottom: 16 }}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin />
        </div>
      ) : chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="fecha" 
              tick={{ fontSize: isMobile ? 10 : 12 }}
              interval={isMobile ? 'preserveStartEnd' : 0}
            />
            <YAxis 
              label={{ 
                value: 'mg/dL', 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle' }
              }} 
              domain={['dataMin - 20', 'dataMax + 20']}
              tick={{ fontSize: isMobile ? 10 : 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={80} stroke="red" strokeDasharray="3 3" label="Mínimo" />
            <ReferenceLine y={180} stroke="red" strokeDasharray="3 3" label="Máximo" />
            <Line 
              type="monotone" 
              dataKey="valor" 
              stroke="#1890ff" 
              activeDot={{ r: 8 }} 
              dot={{ stroke: '#1890ff', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <Empty 
          description={
            <span>
              No hay datos de glucosa para este período.
            </span>
          }
        />
      )}
    </Card>
  );
};

export default GlucoseChart;