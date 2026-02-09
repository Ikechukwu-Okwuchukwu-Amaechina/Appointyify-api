const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Appointyify API',
      version: '1.0.0',
      description: 'Appointment booking platform API with user, business, and admin features',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string', enum: ['user', 'business', 'admin'] },
            phone: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Business: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            owner: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            category: { type: 'string' },
            address: { type: 'string' },
            phone: { type: 'string' },
            email: { type: 'string' },
            workingHours: { type: 'string', example: '09:00-17:00' },
            slotDuration: { type: 'number', default: 30 },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Booking: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            user: { type: 'string' },
            business: { type: 'string' },
            date: { type: 'string', format: 'date' },
            startTime: { type: 'string', example: '10:00' },
            endTime: { type: 'string', example: '10:30' },
            status: { type: 'string', enum: ['pending', 'confirmed', 'cancelled'] },
            notes: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            msg: { type: 'string' },
          },
        },
      },
    },
    security: [],
  },
  apis: ['./routes/*.js', './controllers/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
