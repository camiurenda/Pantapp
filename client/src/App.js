// App.js
import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Badge, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  DatePicker, 
  TimePicker, 
  Layout, 
  Typography, 
  List, 
  Space, 
  Card, 
  Tag, 
  Popconfirm, 
  Tooltip, 
  ConfigProvider,
  Grid,
  message,
  Spin,
  Alert
} from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  WarningOutlined,
  ExperimentOutlined,
  MedicineBoxOutlined,
  CoffeeOutlined,
  MenuOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import es_ES from 'antd/lib/locale/es_ES';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

import './App.css';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { useBreakpoint } = Grid;

// Configurar dayjs para usar español
dayjs.locale('es');

// URL base de la API
// En producción (Vercel), usamos la ruta relativa /api
// En desarrollo, usamos la URL completa desde .env
const isProduction = process.env.NODE_ENV === 'production';
const API_URL = isProduction 
  ? '/api' 
  : (process.env.REACT_APP_API_URL || 'http://localhost:5000/api');

console.log('API URL:', API_URL);
console.log('Environment:', process.env.NODE_ENV);

const DiabetesPetTracker = () => {
  // Detectar tamaño de pantalla para responsividad
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  
  // Estado para almacenar todos los eventos
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serverStatus, setServerStatus] = useState({ connected: false, message: 'Verificando conexión...' });
  
  // Estado para el modal de nuevo evento
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  
  // Estado para la lista de eventos recientes
  const [recentEvents, setRecentEvents] = useState([]);
  
  // Verificar estado del servidor
  const verificarServidor = async () => {
    try {
      // En Vercel, simplemente verificamos si podemos acceder a la API
      const respuesta = await fetch(`${API_URL}/eventos`, { 
        method: 'HEAD',
        // No usamos credenciales ya que puede causar problemas CORS en Vercel
        credentials: 'omit',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      setServerStatus({
        connected: respuesta.ok,
        message: respuesta.ok ? 'Conectado al servidor' : 'Error de conexión'
      });
      return respuesta.ok;
    } catch (error) {
      console.error("Error verificando servidor:", error);
      setServerStatus({
        connected: false,
        message: 'No se pudo conectar al servidor'
      });
      return false;
    }
  };
  
  // Cargar eventos desde la API
  const cargarEventos = async () => {
    try {
      setLoading(true);
      
      // Verificar primero si el servidor está disponible
      const servidorDisponible = await verificarServidor();
      if (!servidorDisponible) {
        throw new Error('Servidor no disponible');
      }
      
      const respuesta = await fetch(`${API_URL}/eventos`, {
        // No usamos credenciales en Vercel
        credentials: 'omit',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!respuesta.ok) {
        throw new Error(`Error HTTP: ${respuesta.status}`);
      }
      
      const datos = await respuesta.json();
      
      // Transformar datos para compatibilidad con el frontend
      const eventosFormateados = datos.map(evento => ({
        id: evento._id,
        date: evento.fecha,
        time: evento.hora,
        type: evento.tipo,
        value: evento.valor,
        notes: evento.notas,
        timestamp: evento.marca_tiempo
      }));
      
      setEvents(eventosFormateados);
      message.success('Datos cargados correctamente');
    } catch (error) {
      console.error("Error cargando eventos:", error);
      message.warning("Usando datos almacenados localmente debido a problemas de conexión");
      
      // Fallback a localStorage si la API falla
      const savedEvents = localStorage.getItem('petDiabetesEvents');
      if (savedEvents) {
        setEvents(JSON.parse(savedEvents));
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Cargar datos al iniciar
  useEffect(() => {
    cargarEventos();
  }, []);
  
  // Actualizar eventos recientes cuando cambian los eventos
  useEffect(() => {
    // Guardar una copia en localStorage como respaldo
    localStorage.setItem('petDiabetesEvents', JSON.stringify(events));
    
    // Actualizar eventos recientes
    const sortedEvents = [...events].sort((a, b) => 
      dayjs(`${b.date} ${b.time}`).valueOf() - dayjs(`${a.date} ${a.time}`).valueOf()
    );
    setRecentEvents(sortedEvents.slice(0, 10));
  }, [events]);
  
  // Mostrar el modal para agregar evento
  const showModal = () => {
    form.resetFields();
    form.setFieldsValue({
      date: dayjs(),
      time: dayjs(),
      type: 'glucose'
    });
    setIsModalVisible(true);
  };
  
  // Manejar la cancelación del modal
  const handleCancel = () => {
    setIsModalVisible(false);
  };
  
  // Manejar el envío del formulario
  const handleSubmit = async (values) => {
    const formattedDate = values.date.format('YYYY-MM-DD');
    const formattedTime = values.time.format('HH:mm');
    const timestamp = `${formattedDate}T${formattedTime}`;
    
    const nuevoEvento = {
      fecha: formattedDate,
      hora: formattedTime,
      tipo: values.type,
      valor: values.value !== undefined ? values.value : '',
      notas: values.notes || '',
      marca_tiempo: timestamp
    };
    
    try {
      // Verificar si el servidor está disponible
      const servidorDisponible = await verificarServidor();
      
      if (!servidorDisponible) {
        throw new Error('Servidor no disponible');
      }
      
      const respuesta = await fetch(`${API_URL}/eventos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify(nuevoEvento),
        credentials: 'omit'
      });
      
      if (!respuesta.ok) {
        throw new Error(`Error HTTP: ${respuesta.status}`);
      }
      
      const eventoGuardado = await respuesta.json();
      
      // Transformar para frontend
      const eventoFormateado = {
        id: eventoGuardado._id || Date.now().toString(), // Fallback ID si no hay _id
        date: eventoGuardado.fecha,
        time: eventoGuardado.hora,
        type: eventoGuardado.tipo,
        value: eventoGuardado.valor,
        notes: eventoGuardado.notas,
        timestamp: eventoGuardado.marca_tiempo
      };
      
      setEvents([...events, eventoFormateado]);
      message.success('Evento registrado correctamente');
    } catch (error) {
      console.error("Error guardando evento:", error);
      message.error("Error al guardar en el servidor");
      
      // Guardar localmente si falla la API
      const eventoLocal = {
        id: Date.now().toString(),
        date: formattedDate,
        time: formattedTime,
        type: values.type,
        value: values.value !== undefined ? values.value : '',
        notes: values.notes || '',
        timestamp: timestamp
      };
      
      setEvents([...events, eventoLocal]);
      message.warning("Guardado localmente. Se sincronizará cuando el servidor esté disponible.");
    }
    
    setIsModalVisible(false);
  };
  
  // Eliminar un evento
  const deleteEvent = async (id) => {
    try {
      // Verificar si el servidor está disponible
      const servidorDisponible = await verificarServidor();
      
      if (!servidorDisponible) {
        throw new Error('Servidor no disponible');
      }
      
      const respuesta = await fetch(`${API_URL}/eventos/${id}`, {
        method: 'DELETE',
        credentials: 'omit',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!respuesta.ok) {
        throw new Error(`Error HTTP: ${respuesta.status}`);
      }
      
      setEvents(events.filter(event => event.id !== id));
      message.success('Evento eliminado correctamente');
    } catch (error) {
      console.error("Error eliminando evento:", error);
      message.error("Error al eliminar del servidor");
      
      // Eliminar localmente si falla la API
      setEvents(events.filter(event => event.id !== id));
      message.warning("Eliminado localmente.");
    }
  };
  
  // Obtener color y título según tipo de evento
  const getEventTypeInfo = (type) => {
    switch(type) {
      case 'glucose':
        return {
          color: 'blue',
          title: 'Glucosa',
          icon: <ExperimentOutlined />
        };
      case 'insulin':
        return {
          color: 'green',
          title: 'Insulina',
          icon: <MedicineBoxOutlined />
        };
      case 'medication':
        return {
          color: 'purple',
          title: 'Medicamento',
          icon: <MedicineBoxOutlined />
        };
      case 'food':
        return {
          color: 'orange',
          title: 'Comida',
          icon: <CoffeeOutlined />
        };
      default:
        return {
          color: 'default',
          title: 'Evento',
          icon: null
        };
    }
  };
  
  // Evaluar nivel de glucosa
  const evaluateGlucoseLevel = (value) => {
    const numValue = parseFloat(value);
    if (numValue < 80) return { color: 'red', status: 'bajo' };
    if (numValue > 180) return { color: 'red', status: 'alto' };
    return { color: 'green', status: 'normal' };
  };
  
  // Función para renderizar el contenido de cada celda del calendario
  const dateCellRender = (value) => {
    const dateString = value.format('YYYY-MM-DD');
    const dayEvents = events.filter(event => event.date === dateString);
    
    // Contar eventos por tipo
    const eventCounts = dayEvents.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {});
    
    return (
      <ul className="events">
        {Object.entries(eventCounts).map(([type, count]) => {
          const { color, title, icon } = getEventTypeInfo(type);
          return (
            <li key={type}>
              <Badge color={color} text={`${title} (${count})`} />
            </li>
          );
        })}
      </ul>
    );
  };
  
  return (
    <ConfigProvider locale={es_ES}>
      <Layout className="layout">
        <Header className="header">
          <div className="logo" />
          <Title level={isMobile ? 4 : 3} style={{ color: 'white', margin: 0, flex: 1 }}>
            {isMobile ? "Pantera 🐕" : "Cuidados para Pantera 🐕"}
          </Title>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={cargarEventos}
            type="text"
            style={{ color: 'white' }}
            title="Recargar datos"
          />
        </Header>
        
        <Content className="site-layout-content">
          <div className="container">
            {/* Alerta de estado del servidor */}
            {!serverStatus.connected && (
              <Alert
                message="Sin conexión al servidor"
                description="Los datos se están guardando localmente y se sincronizarán cuando el servidor esté disponible."
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
                closable
              />
            )}
            
            {/* Leyenda y botón de agregar */}
            <div className="legend-container">
              <div className="legend-tags">
                <Tag color="blue" icon={<ExperimentOutlined />}>Glucosa</Tag>
                <Tag color="green" icon={<MedicineBoxOutlined />}>Insulina</Tag>
                <Tag color="purple" icon={<MedicineBoxOutlined />}>Medicamento</Tag>
                <Tag color="orange" icon={<CoffeeOutlined />}>Comida</Tag>
              </div>
              
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={showModal}
                size={isMobile ? "middle" : "large"}
              >
                {isMobile ? "Agregar" : "Agregar evento"}
              </Button>
            </div>
            
            {/* Calendario */}
            <Card className="calendar-card" loading={loading}>
              <Calendar 
                dateCellRender={dateCellRender}
                mode="month"
                fullscreen={!isMobile}
                className={isMobile ? "mobile-calendar" : ""}
              />
            </Card>
            
            {/* Lista de eventos recientes */}
            <Card 
              title="Eventos Recientes" 
              className="recent-events-card"
              style={{ marginTop: 16 }}
              loading={loading}
              extra={
                <Text type="secondary">
                  {recentEvents.length > 0 ? `${recentEvents.length} eventos` : "Sin eventos"}
                </Text>
              }
            >
              <List
                itemLayout="horizontal"
                dataSource={recentEvents}
                locale={{ emptyText: 'No hay eventos registrados' }}
                renderItem={event => {
                  const { color, title, icon } = getEventTypeInfo(event.type);
                  let valueDisplay = null;
                  
                  if (event.type === 'glucose') {
                    const evaluation = evaluateGlucoseLevel(event.value);
                    valueDisplay = (
                      <Tooltip title={`Nivel ${evaluation.status}`}>
                        <Tag color={evaluation.color}>
                          {event.value} mg/dL
                          {evaluation.color === 'red' && <WarningOutlined style={{ marginLeft: 5 }} />}
                        </Tag>
                      </Tooltip>
                    );
                  } else if (event.type === 'insulin') {
                    valueDisplay = <Tag>{event.value} unidades</Tag>;
                  }
                  
                  return (
                    <List.Item
                      actions={[
                        <Popconfirm
                          title="¿Estás seguro de eliminar este evento?"
                          onConfirm={() => deleteEvent(event.id)}
                          okText="Sí"
                          cancelText="No"
                        >
                          <Button 
                            type="text" 
                            danger 
                            icon={<DeleteOutlined />} 
                          />
                        </Popconfirm>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={<Tag color={color} icon={icon}>{title}</Tag>}
                        title={
                          <Space>
                            {dayjs(`${event.date} ${event.time}`).format('DD/MM/YYYY HH:mm')}
                            {valueDisplay}
                          </Space>
                        }
                        description={event.notes ? `Nota: ${event.notes}` : null}
                      />
                    </List.Item>
                  );
                }}
              />
            </Card>
          </div>
        </Content>
        
        <Footer style={{ textAlign: 'center', padding: isMobile ? '10px' : '24px' }}>
          Cuidados para Pantera ©{new Date().getFullYear()} - Control de diabetes
        </Footer>
      </Layout>
      
      {/* Modal para agregar evento */}
      <Modal
        title="Registrar nuevo evento"
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={isMobile ? "95%" : 520}
        style={{ top: isMobile ? 20 : 100 }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="type"
            label="Tipo de evento"
            rules={[{ required: true, message: 'Por favor selecciona el tipo de evento' }]}
          >
            <Select>
              <Option value="glucose">Medición de Glucosa</Option>
              <Option value="insulin">Inyección de Insulina</Option>
              <Option value="medication">Otro Medicamento</Option>
              <Option value="food">Comida</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="date"
            label="Fecha"
            rules={[{ required: true, message: 'Por favor selecciona la fecha' }]}
          >
            <DatePicker 
              style={{ width: '100%' }} 
              format="DD/MM/YYYY"
            />
          </Form.Item>
          
          <Form.Item
            name="time"
            label="Hora"
            rules={[{ required: true, message: 'Por favor selecciona la hora' }]}
          >
            <TimePicker 
              style={{ width: '100%' }} 
              format="HH:mm"
            />
          </Form.Item>
          
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}
          >
            {({ getFieldValue }) => {
              const type = getFieldValue('type');
              
              if (type === 'glucose') {
                return (
                  <Form.Item
                    name="value"
                    label="Valor (mg/dL)"
                    rules={[{ required: true, message: 'Por favor ingresa el valor de glucosa' }]}
                  >
                    <Input 
                      type="number" 
                      placeholder="ej. 120" 
                      inputMode="numeric" 
                      pattern="[0-9]*"
                    />
                  </Form.Item>
                );
              }
              
              if (type === 'insulin') {
                return (
                  <Form.Item
                    name="value"
                    label="Unidades"
                    rules={[{ required: true, message: 'Por favor ingresa las unidades de insulina' }]}
                  >
                    <Input 
                      type="number" 
                      placeholder="ej. 2" 
                      inputMode="numeric"
                      pattern="[0-9]*"
                    />
                  </Form.Item>
                );
              }
              
              return null;
            }}
          </Form.Item>
          
          <Form.Item
            name="notes"
            label="Notas (opcional)"
          >
            <TextArea rows={3} placeholder="Observaciones adicionales..." />
          </Form.Item>
          
          <Form.Item className="form-buttons">
            <Button type="default" onClick={handleCancel} style={{ marginRight: 8 }}>
              Cancelar
            </Button>
            <Button type="primary" htmlType="submit">
              Guardar
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </ConfigProvider>
  );
};

export default DiabetesPetTracker;