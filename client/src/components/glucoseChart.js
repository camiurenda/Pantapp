// client/src/components/glucoseChart.js
import React, { useState, useEffect } from 'react';
import { Card, Radio, Empty, Spin, Typography } from 'antd';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine,
  Legend
} from 'recharts';
import dayjs from 'dayjs';

const { Text } = Typography;

const GlucoseChart = ({ events, isMobile }) => {
  const [timeRange, setTimeRange] = useState('day');
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartHeight, setChartHeight] = useState(300);

  // Ajustar altura del gráfico según el dispositivo
  useEffect(() => {
    // En móviles, usar una altura que se adapte mejor al tamaño de pantalla
    setChartHeight(isMobile ? 250 : 300);
  }, [isMobile]);

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

    console.log(`Datos del gráfico preparados: ${formattedData.length} registros para el rango ${timeRange}`);
    setChartData(formattedData);
    setLoading(false);
  };

  const handleRangeChange = e => {
    console.log(`Cambio de rango temporal a: ${e.target.value}`);
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
          borderRadius: '4px',
          fontSize: isMobile ? '12px' : '14px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <p style={{ margin: '0 0 5px' }}><strong>Fecha:</strong> {data.fecha}</p>
          <p style={{ margin: '0 0 5px' }}><strong>Glucosa:</strong> {data.valor} mg/dL</p>
          {data.notas && <p style={{ margin: '0' }}><strong>Notas:</strong> {data.notas}</p>}
        </div>
      );
    }
    return null;
  };

  // Determinar si hay suficientes datos para mostrar el gráfico correctamente
  const hasSufficientData = chartData.length > 1;

  return (
    <Card 
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <span>Gráfico de Glucosa</span>
          <Radio.Group 
            value={timeRange} 
            onChange={handleRangeChange}
            size={isMobile ? "small" : "middle"}
            style={{ marginLeft: isMobile ? '0' : '10px', marginTop: isMobile ? '5px' : '0' }}
          >
            <Radio.Button value="day">Hoy</Radio.Button>
            <Radio.Button value="3days">3 días</Radio.Button>
            <Radio.Button value="week">Semana</Radio.Button>
          </Radio.Group>
        </div>
      }
      style={{ marginTop: 16, marginBottom: 16 }}
      bodyStyle={{ padding: isMobile ? '8px' : '24px' }}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin />
        </div>
      ) : chartData.length > 0 ? (
        <>
          {!hasSufficientData && (
            <Text type="warning" style={{ display: 'block', marginBottom: '10px', textAlign: 'center' }}>
              Se necesitan más datos para una visualización óptima del gráfico.
            </Text>
          )}
          <ResponsiveContainer width="100%" height={chartHeight}>
            <LineChart
              data={chartData}
              margin={{ 
                top: 5, 
                right: isMobile ? 5 : 20, 
                left: isMobile ? 0 : 10, 
                bottom: 5 
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="fecha" 
                tick={{ fontSize: isMobile ? 10 : 12 }}
                interval={isMobile ? 'preserveStartEnd' : 0}
                tickMargin={8}
                height={isMobile ? 40 : 30}
                angle={isMobile ? -45 : 0}
                textAnchor={isMobile ? 'end' : 'middle'}
              />
              <YAxis 
                label={!isMobile ? { 
                  value: 'mg/dL', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle' }
                } : null} 
                domain={['dataMin - 20', 'dataMax + 20']}
                tick={{ fontSize: isMobile ? 10 : 12 }}
                tickMargin={isMobile ? 3 : 5}
                width={isMobile ? 30 : 40}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine 
                y={80} 
                stroke="red" 
                strokeDasharray="3 3" 
                label={
                  !isMobile ? {
                    value: "Mínimo", 
                    position: "insideBottomLeft",
                    fontSize: 12
                  } : { 
                    value: "Mín", 
                    position: "insideBottomLeft",
                    fontSize: 10
                  }
                } 
              />
              <ReferenceLine 
                y={220} 
                stroke="red" 
                strokeDasharray="3 3" 
                label={
                  !isMobile ? {
                    value: "Máximo", 
                    position: "insideTopLeft",
                    fontSize: 12
                  } : { 
                    value: "Máx", 
                    position: "insideTopLeft",
                    fontSize: 10
                  }
                }
              />
              <Legend 
                verticalAlign={isMobile ? "top" : "bottom"} 
                height={30} 
                payload={[{ value: 'Nivel de Glucosa', type: 'line', color: '#1890ff' }]}
              />
              <Line 
                name="Nivel de Glucosa"
                type="monotone" 
                dataKey="valor" 
                stroke="#1890ff" 
                activeDot={{ r: isMobile ? 6 : 8 }} 
                dot={{ stroke: '#1890ff', strokeWidth: 2, r: isMobile ? 3 : 4 }}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
          
          {isMobile && (
            <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '12px' }}>
              <Text type="secondary">Valores en mg/dL - Toca para más detalles</Text>
            </div>
          )}
        </>
      ) : (
        <Empty 
          description={
            <span>
              No hay datos de glucosa para este período.
            </span>
          }
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ margin: '20px 0' }}
        />
      )}
    </Card>
  );
};

export default GlucoseChart;