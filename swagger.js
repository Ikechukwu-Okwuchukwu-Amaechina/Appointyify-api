const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Appointyify API',
      version: '1.0.0',
      description: `
# Appointyify API Documentation

A comprehensive appointment booking platform API with real-time messaging capabilities.

## Features
- **User Management**: Registration, authentication, and profile management
- **Business Management**: Create and manage businesses with custom working hours
- **Booking System**: Book appointments with availability checking
- **Real-time Messaging**: WebSocket-based chat between clients and businesses
- **Admin Panel**: Platform statistics and user management

## Date Format
All dates in this API use **ISO 8601 format**:
- Date fields: Full ISO timestamp (e.g., \`2026-02-15T00:00:00.000Z\`)
- Input dates: Can accept YYYY-MM-DD format, will be converted to ISO
- Response dates: Always returned in ISO 8601 format

## WebSocket Connection
Connect to WebSocket server for real-time messaging:
\`\`\`javascript
const socket = io('http://localhost:5000', {
  auth: { token: 'YOUR_JWT_TOKEN' }
});

// Join a booking conversation
socket.emit('joinBooking', bookingId);

// Send a message
socket.emit('sendMessage', {
  bookingId: '123',
  content: 'Hello!',
  senderType: 'client' // or 'business'
});

// Listen for new messages
socket.on('newMessage', (message) => {
  console.log('New message:', message);
});

// Mark messages as read
socket.emit('markAsRead', { messageIds: ['msg1', 'msg2'] });
\`\`\`

## Authentication
Most endpoints require a Bearer token in the Authorization header:
\`Authorization: Bearer YOUR_JWT_TOKEN\`
      `,
      contact: {
        name: 'API Support',
        email: 'support@appointyify.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
      {
        url: 'https://api.appointyify.com',
        description: 'Production server',
      },
    ],
    tags: [
      {
        name: 'Auth',
        description: 'User authentication and registration endpoints'
      },
      {
        name: 'Business',
        description: 'Business management operations - create, update, and manage business listings'
      },
      {
        name: 'Booking',
        description: 'Appointment booking and availability checking'
      },
      {
        name: 'Messages',
        description: 'Real-time messaging between clients and businesses (REST API for message history)'
      },
      {
        name: 'Admin',
        description: 'Administrative operations - requires admin role'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token obtained from /api/auth/login or /api/auth/register'
        },
      },
      schemas: {
        User: {
          type: 'object',
          required: ['name', 'email', 'role'],
          properties: {
            _id: { 
              type: 'string', 
              description: 'Unique identifier',
              example: '507f1f77bcf86cd799439011'
            },
            name: { 
              type: 'string', 
              description: 'Full name of the user',
              example: 'John Doe'
            },
            email: { 
              type: 'string', 
              format: 'email',
              description: 'User email address',
              example: 'john.doe@example.com'
            },
            role: { 
              type: 'string', 
              enum: ['user', 'business', 'admin'],
              description: 'User role in the system',
              default: 'user',
              example: 'user'
            },
            phone: { 
              type: 'string',
              description: 'Contact phone number',
              example: '+1234567890'
            },
            createdAt: { 
              type: 'string', 
              format: 'date-time',
              description: 'Account creation timestamp (ISO 8601)',
              example: '2026-02-09T10:30:00.000Z'
            },
            updatedAt: { 
              type: 'string', 
              format: 'date-time',
              description: 'Last update timestamp (ISO 8601)',
              example: '2026-02-09T10:30:00.000Z'
            },
          },
        },
        Business: {
          type: 'object',
          required: ['name', 'owner'],
          properties: {
            _id: { 
              type: 'string',
              description: 'Unique business identifier',
              example: '507f1f77bcf86cd799439012'
            },
            owner: { 
              type: 'string',
              description: 'User ID of the business owner',
              example: '507f1f77bcf86cd799439011'
            },
            name: { 
              type: 'string',
              description: 'Business name',
              example: 'Downtown Hair Salon'
            },
            description: { 
              type: 'string',
              description: 'Detailed business description',
              example: 'Premium hair styling and beauty services in downtown area'
            },
            category: { 
              type: 'string',
              description: 'Business category or industry',
              example: 'Beauty & Wellness'
            },
            address: { 
              type: 'string',
              description: 'Physical business address',
              example: '123 Main St, New York, NY 10001'
            },
            phone: { 
              type: 'string',
              description: 'Business contact phone',
              example: '+1234567890'
            },
            email: { 
              type: 'string',
              format: 'email',
              description: 'Business contact email',
              example: 'contact@salon.com'
            },
            workingHours: { 
              type: 'string',
              description: 'Operating hours in HH:MM-HH:MM format',
              example: '09:00-17:00'
            },
            slotDuration: { 
              type: 'number',
              description: 'Duration of each booking slot in minutes',
              default: 30,
              example: 30
            },
            isActive: { 
              type: 'boolean',
              description: 'Whether the business is currently active',
              default: true,
              example: true
            },
            createdAt: { 
              type: 'string', 
              format: 'date-time',
              description: 'Business creation timestamp (ISO 8601)',
              example: '2026-02-09T10:30:00.000Z'
            },
            updatedAt: { 
              type: 'string', 
              format: 'date-time',
              description: 'Last update timestamp (ISO 8601)',
              example: '2026-02-09T10:30:00.000Z'
            },
          },
        },
        Booking: {
          type: 'object',
          required: ['user', 'business', 'date', 'startTime', 'endTime'],
          properties: {
            _id: { 
              type: 'string',
              description: 'Unique booking identifier',
              example: '507f1f77bcf86cd799439013'
            },
            user: { 
              type: 'string',
              description: 'ID of the user making the booking',
              example: '507f1f77bcf86cd799439011'
            },
            business: { 
              type: 'string',
              description: 'ID of the business being booked',
              example: '507f1f77bcf86cd799439012'
            },
            date: { 
              type: 'string', 
              format: 'date-time',
              description: 'Booking date in ISO 8601 format',
              example: '2026-02-15T00:00:00.000Z'
            },
            startTime: { 
              type: 'string',
              description: 'Appointment start time in HH:MM format',
              example: '10:00'
            },
            endTime: { 
              type: 'string',
              description: 'Appointment end time in HH:MM format',
              example: '10:30'
            },
            status: { 
              type: 'string', 
              enum: ['pending', 'confirmed', 'cancelled'],
              description: 'Current booking status',
              default: 'pending',
              example: 'confirmed'
            },
            notes: { 
              type: 'string',
              description: 'Additional notes or special requests',
              example: 'Please call upon arrival'
            },
            createdAt: { 
              type: 'string', 
              format: 'date-time',
              description: 'Booking creation timestamp (ISO 8601)',
              example: '2026-02-09T10:30:00.000Z'
            },
            updatedAt: { 
              type: 'string', 
              format: 'date-time',
              description: 'Last update timestamp (ISO 8601)',
              example: '2026-02-09T10:30:00.000Z'
            },
          },
        },
        Message: {
          type: 'object',
          required: ['booking', 'sender', 'senderType', 'content'],
          properties: {
            _id: { 
              type: 'string',
              description: 'Unique message identifier',
              example: '507f1f77bcf86cd799439014'
            },
            booking: { 
              type: 'string',
              description: 'ID of the booking this message belongs to',
              example: '507f1f77bcf86cd799439013'
            },
            sender: { 
              type: 'string',
              description: 'ID of the user who sent the message',
              example: '507f1f77bcf86cd799439011'
            },
            senderType: { 
              type: 'string', 
              enum: ['client', 'business'],
              description: 'Type of sender - client or business owner',
              example: 'client'
            },
            content: { 
              type: 'string',
              description: 'Message text content',
              example: 'Hi, I would like to confirm my appointment time.'
            },
            isRead: { 
              type: 'boolean',
              description: 'Whether the message has been read by the recipient',
              default: false,
              example: false
            },
            createdAt: { 
              type: 'string', 
              format: 'date-time',
              description: 'Message creation timestamp (ISO 8601)',
              example: '2026-02-09T10:30:00.000Z'
            },
            updatedAt: { 
              type: 'string', 
              format: 'date-time',
              description: 'Last update timestamp (ISO 8601)',
              example: '2026-02-09T10:30:00.000Z'
            },
          },
        },
        Conversation: {
          type: 'object',
          properties: {
            booking: {
              $ref: '#/components/schemas/Booking',
              description: 'The booking associated with this conversation'
            },
            lastMessage: {
              $ref: '#/components/schemas/Message',
              description: 'The most recent message in the conversation'
            },
            unreadCount: {
              type: 'number',
              description: 'Number of unread messages for the current user',
              example: 3
            }
          }
        },
        TimeSlot: {
          type: 'object',
          properties: {
            startTime: {
              type: 'string',
              description: 'Slot start time in HH:MM format',
              example: '10:00'
            },
            endTime: {
              type: 'string',
              description: 'Slot end time in HH:MM format',
              example: '10:30'
            },
            isAvailable: {
              type: 'boolean',
              description: 'Whether this slot is available for booking',
              example: true
            }
          }
        },
        PlatformStats: {
          type: 'object',
          properties: {
            totalUsers: {
              type: 'number',
              description: 'Total number of registered users',
              example: 1250
            },
            totalBusinesses: {
              type: 'number',
              description: 'Total number of businesses',
              example: 340
            },
            totalBookings: {
              type: 'number',
              description: 'Total number of bookings',
              example: 5680
            },
            pendingBookings: {
              type: 'number',
              description: 'Number of pending bookings',
              example: 45
            },
            confirmedBookings: {
              type: 'number',
              description: 'Number of confirmed bookings',
              example: 4890
            },
            cancelledBookings: {
              type: 'number',
              description: 'Number of cancelled bookings',
              example: 745
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            msg: { 
              type: 'string',
              description: 'Error message',
              example: 'Validation failed'
            },
            errors: {
              type: 'array',
              description: 'Detailed validation errors',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string', example: 'email' },
                  message: { type: 'string', example: 'Invalid email format' }
                }
              }
            }
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
              description: 'JWT authentication token',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            },
            user: {
              $ref: '#/components/schemas/User'
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                msg: 'No token provided'
              }
            }
          }
        },
        ForbiddenError: {
          description: 'User does not have permission to access this resource',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                msg: 'Access denied. Admin only.'
              }
            }
          }
        },
        NotFoundError: {
          description: 'The requested resource was not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                msg: 'Resource not found'
              }
            }
          }
        },
        ValidationError: {
          description: 'Request validation failed',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                msg: 'Validation failed',
                errors: [
                  { field: 'email', message: 'Valid email is required' }
                ]
              }
            }
          }
        }
      }
    },
    security: [],
  },
  apis: ['./routes/*.js', './controllers/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
