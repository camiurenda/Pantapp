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
  Grid
} from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  WarningOutlined,
  ExperimentOutlined,
  MedicineBoxOutlined,
  CoffeeOutlined,
  MenuOutlined
} from '@ant-design/icons';
import es_ES from 'antd/lib/locale/es_ES';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

import './App.css';

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { useBreakpoint } = Grid;

// Configurar dayjs para usar español
dayjs.locale('es');

const DiabetesPetTracker = () => {
  // Detectar tamaño de pantalla para responsividad
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  
  // Estado para almacenar todos los eventos
  const [events, setEvents] = useState(() => {
    const savedEvents = localStorage.getItem('petDiabetesEvents');
    return savedEvents ? JSON.parse(savedEvents) : [];
  });
  
  // Estado para el modal de nuevo evento
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  
  // Estado para la lista de eventos recientes
  const [recentEvents, setRecentEvents] = useState([]);
  
  // Guardar eventos en localStorage cuando cambian
  useEffect(() => {
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
  const handleSubmit = (values) => {
    const newEvent = {
      id: Date.now(),
      date: values.date.format('YYYY-MM-DD'),
      time: values.time.format('HH:mm'),
      type: values.type,
      value: values.value !== undefined ? values.value : '',
      notes: values.notes || '',
      timestamp: `${values.date.format('YYYY-MM-DD')}T${values.time.format('HH:mm')}`
    };
    
    setEvents([...events, newEvent]);
    setIsModalVisible(false);
  };
  
  // Eliminar un evento
  const deleteEvent = (id) => {
    setEvents(events.filter(event => event.id !== id));
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
          <Title level={isMobile ? 4 : 3} style={{ color: 'white', margin: 0 }}>
            {isMobile ? "Tracker" : "Cuidados para pantera 🐕"}
          </Title>
        </Header>
        
        <Content className="site-layout-content">
          <div className="container">
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
            <Card className="calendar-card">
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