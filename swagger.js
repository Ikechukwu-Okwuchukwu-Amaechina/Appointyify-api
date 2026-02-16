const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Appointify API',
      version: '1.0.0',
      description: `

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
            profileImage: {
              type: 'string',
              description: 'URL of the user profile image on Cloudinary',
              example: 'https://res.cloudinary.com/your_cloud/image/upload/v123/appointyify/users/abc.jpg'
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
            image: {
              type: 'string',
              description: 'URL of the business image on Cloudinary',
              example: 'https://res.cloudinary.com/your_cloud/image/upload/v123/appointyify/businesses/abc.jpg'
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
    paths: {
      // ── Auth ──
      '/api/auth/register': {
        post: {
          summary: 'Register a new user',
          tags: ['Auth'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'email', 'password'],
                  properties: {
                    name: { type: 'string', example: 'John Doe' },
                    email: { type: 'string', example: 'john.doe@example.com' },
                    password: { type: 'string', example: 'password123' },
                    phone: { type: 'string', example: '+1234567890' },
                    role: { type: 'string', enum: ['user', 'business', 'admin'] },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'User registered successfully',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } },
            },
          },
        },
      },
      '/api/auth/login': {
        post: {
          summary: 'Login user',
          tags: ['Auth'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', example: 'john.doe@example.com' },
                    password: { type: 'string', example: 'password123' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Login successful',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } },
            },
          },
        },
      },
      '/api/auth/me': {
        get: {
          summary: 'Get current user profile',
          tags: ['Auth'],
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'User profile',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } },
            },
            401: { $ref: '#/components/responses/UnauthorizedError' },
          },
        },
      },
      '/api/auth/profile': {
        put: {
          summary: 'Update user profile',
          tags: ['Auth'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    email: { type: 'string' },
                    phone: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Profile updated successfully' } },
        },
      },
      '/api/auth/forgot-password': {
        post: {
          summary: 'Request password reset',
          tags: ['Auth'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email'],
                  properties: { email: { type: 'string' } },
                },
              },
            },
          },
          responses: { 200: { description: 'Reset email sent' } },
        },
      },
      '/api/auth/reset-password/{token}': {
        post: {
          summary: 'Reset password with token',
          tags: ['Auth'],
          parameters: [{ in: 'path', name: 'token', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['password'],
                  properties: { password: { type: 'string' } },
                },
              },
            },
          },
          responses: { 200: { description: 'Password reset successful' } },
        },
      },
      '/api/auth/profile/image': {
        post: {
          summary: 'Upload profile image',
          tags: ['Auth'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['image'],
                  properties: {
                    image: { type: 'string', format: 'binary', description: 'Image file (jpg, jpeg, png, webp - max 5MB)' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Profile image uploaded successfully' },
            400: { description: 'No image file provided' },
            401: { $ref: '#/components/responses/UnauthorizedError' },
          },
        },
        delete: {
          summary: 'Delete profile image',
          tags: ['Auth'],
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Profile image deleted successfully' },
            400: { description: 'No profile image to delete' },
            401: { $ref: '#/components/responses/UnauthorizedError' },
          },
        },
      },

      // ── Business ──
      '/api/businesses': {
        post: {
          summary: 'Create a new business',
          tags: ['Business'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: {
                    name: { type: 'string' },
                    description: { type: 'string' },
                    category: { type: 'string' },
                    address: { type: 'string' },
                    phone: { type: 'string' },
                    email: { type: 'string' },
                    workingHours: { type: 'string', example: '09:00-17:00' },
                    slotDuration: { type: 'number', default: 30 },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Business created',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Business' } } },
            },
          },
        },
        get: {
          summary: 'Get all businesses',
          tags: ['Business'],
          parameters: [
            { in: 'query', name: 'search', schema: { type: 'string' } },
            { in: 'query', name: 'category', schema: { type: 'string' } },
            { in: 'query', name: 'page', schema: { type: 'number' } },
            { in: 'query', name: 'limit', schema: { type: 'number' } },
          ],
          responses: { 200: { description: 'List of businesses' } },
        },
      },
      '/api/businesses/mine': {
        get: {
          summary: 'Get my businesses',
          tags: ['Business'],
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'List of my businesses' } },
        },
      },
      '/api/businesses/my-business': {
        get: {
          summary: 'Get my businesses (alias)',
          tags: ['Business'],
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'List of my businesses' } },
        },
      },
      '/api/businesses/{id}': {
        get: {
          summary: 'Get business by ID',
          tags: ['Business'],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: {
            200: {
              description: 'Business details',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Business' } } },
            },
          },
        },
        patch: {
          summary: 'Update business',
          tags: ['Business'],
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Business' } } },
          },
          responses: { 200: { description: 'Business updated' } },
        },
        delete: {
          summary: 'Delete business',
          tags: ['Business'],
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Business deleted' } },
        },
      },
      '/api/businesses/{id}/image': {
        post: {
          summary: 'Upload business image',
          tags: ['Business'],
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['image'],
                  properties: {
                    image: { type: 'string', format: 'binary', description: 'Image file (jpg, jpeg, png, webp - max 5MB)' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Image uploaded successfully' },
            400: { description: 'No image file provided' },
            403: { description: 'Forbidden - not the business owner' },
            404: { description: 'Business not found' },
          },
        },
        delete: {
          summary: 'Delete business image',
          tags: ['Business'],
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Image deleted successfully' },
            400: { description: 'No image to delete' },
            403: { description: 'Forbidden - not the business owner' },
            404: { description: 'Business not found' },
          },
        },
      },

      // ── Booking ──
      '/api/bookings': {
        post: {
          summary: 'Create a booking',
          tags: ['Booking'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['business', 'date', 'startTime'],
                  properties: {
                    business: { type: 'string' },
                    date: { type: 'string', format: 'date', example: '2026-02-15' },
                    startTime: { type: 'string', example: '10:00' },
                    notes: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Booking created',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Booking' } } },
            },
          },
        },
        get: {
          summary: "Get user's own bookings",
          tags: ['Booking'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'query', name: 'status', schema: { type: 'string', enum: ['pending', 'confirmed', 'cancelled'] } },
            { in: 'query', name: 'business', schema: { type: 'string' } },
          ],
          responses: { 200: { description: 'List of bookings' } },
        },
      },
      '/api/bookings/mine': {
        get: {
          summary: 'Get my bookings',
          tags: ['Booking'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'query', name: 'status', schema: { type: 'string', enum: ['pending', 'confirmed', 'cancelled'] } },
            { in: 'query', name: 'business', schema: { type: 'string' } },
          ],
          responses: { 200: { description: 'List of bookings' } },
        },
      },
      '/api/bookings/availability/{businessId}': {
        get: {
          summary: 'Get available time slots for a business',
          tags: ['Booking'],
          parameters: [
            { in: 'path', name: 'businessId', required: true, schema: { type: 'string' } },
            { in: 'query', name: 'date', required: true, schema: { type: 'string', format: 'date', example: '2026-02-15' } },
          ],
          responses: { 200: { description: 'Available slots' } },
        },
      },
      '/api/bookings/business/{businessId}': {
        get: {
          summary: 'Get bookings for a business (business owner only)',
          tags: ['Booking'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'path', name: 'businessId', required: true, schema: { type: 'string' } },
            { in: 'query', name: 'status', schema: { type: 'string' } },
            { in: 'query', name: 'date', schema: { type: 'string', format: 'date' } },
          ],
          responses: { 200: { description: 'Business bookings' } },
        },
      },
      '/api/bookings/{id}/cancel': {
        patch: {
          summary: 'Cancel a booking',
          tags: ['Booking'],
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Booking cancelled' } },
        },
        put: {
          summary: 'Cancel a booking (PUT)',
          tags: ['Booking'],
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Booking cancelled' } },
        },
      },
      '/api/bookings/{id}/status': {
        patch: {
          summary: 'Update booking status (business owner only)',
          tags: ['Booking'],
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['pending', 'confirmed', 'cancelled'] },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Status updated' } },
        },
      },
      '/api/bookings/{id}': {
        get: {
          summary: 'Get booking by ID',
          tags: ['Booking'],
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: {
            200: {
              description: 'Booking details',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Booking' } } },
            },
          },
        },
        put: {
          summary: 'Update booking status (business owner only)',
          tags: ['Booking'],
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['pending', 'confirmed', 'cancelled'] },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Status updated' } },
        },
      },

      // ── Messages ──
      '/api/messages': {
        post: {
          summary: 'Send a message via REST (fallback for WebSocket)',
          tags: ['Messages'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['bookingId', 'content'],
                  properties: {
                    bookingId: { type: 'string' },
                    content: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Message sent' } },
        },
      },
      '/api/messages/read': {
        put: {
          summary: 'Mark messages as read',
          tags: ['Messages'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    messageIds: { type: 'array', items: { type: 'string' } },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Messages marked as read' } },
        },
      },
      '/api/messages/conversations': {
        get: {
          summary: 'Get all conversations for current user',
          tags: ['Messages'],
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'List of conversations' } },
        },
      },
      '/api/messages/my-conversations': {
        get: {
          summary: 'Get all conversations for current user (alias)',
          tags: ['Messages'],
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'List of conversations' } },
        },
      },
      '/api/messages/mark-read': {
        post: {
          summary: 'Mark messages as read (alternative route)',
          tags: ['Messages'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    messageIds: { type: 'array', items: { type: 'string' } },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Messages marked as read' } },
        },
      },
      '/api/messages/booking/{bookingId}': {
        get: {
          summary: 'Get all messages for a specific booking',
          tags: ['Messages'],
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'bookingId', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'List of messages' },
            403: { description: 'Unauthorized' },
            404: { description: 'Booking not found' },
          },
        },
      },
      '/api/messages/business/{businessId}/conversations': {
        get: {
          summary: 'Get all conversations for a business',
          tags: ['Messages'],
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'businessId', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'List of conversations' } },
        },
      },
      '/api/messages/{bookingId}': {
        get: {
          summary: 'Get message history for a booking',
          tags: ['Messages'],
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'bookingId', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'List of messages' },
            403: { description: 'Unauthorized' },
            404: { description: 'Booking not found' },
          },
        },
      },

      // ── Admin ──
      '/api/admin/stats': {
        get: {
          summary: 'Get platform statistics (admin only)',
          tags: ['Admin'],
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Platform stats',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/PlatformStats' } } },
            },
            401: { $ref: '#/components/responses/UnauthorizedError' },
            403: { $ref: '#/components/responses/ForbiddenError' },
          },
        },
      },
      '/api/admin/users': {
        get: {
          summary: 'Get all users with search and filters (admin only)',
          tags: ['Admin'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'query', name: 'page', schema: { type: 'number' } },
            { in: 'query', name: 'limit', schema: { type: 'number' } },
            { in: 'query', name: 'search', schema: { type: 'string' } },
            { in: 'query', name: 'role', schema: { type: 'string', enum: ['user', 'business', 'admin'] } },
          ],
          responses: { 200: { description: 'Paginated user list' } },
        },
      },
      '/api/admin/users/{id}': {
        get: {
          summary: 'Get user by ID (admin only)',
          tags: ['Admin'],
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'User details' } },
        },
        delete: {
          summary: 'Delete user and related data (admin only)',
          tags: ['Admin'],
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'User deleted' } },
        },
      },
      '/api/admin/users/{id}/role': {
        put: {
          summary: 'Update user role (admin only)',
          tags: ['Admin'],
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['role'],
                  properties: {
                    role: { type: 'string', enum: ['user', 'business', 'admin'] },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'User role updated' } },
        },
      },
      '/api/admin/businesses': {
        get: {
          summary: 'Get all businesses (admin only)',
          tags: ['Admin'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'query', name: 'page', schema: { type: 'number' } },
            { in: 'query', name: 'limit', schema: { type: 'number' } },
            { in: 'query', name: 'search', schema: { type: 'string' } },
            { in: 'query', name: 'category', schema: { type: 'string' } },
            { in: 'query', name: 'owner', schema: { type: 'string' } },
          ],
          responses: { 200: { description: 'Paginated business list' } },
        },
      },
      '/api/admin/bookings': {
        get: {
          summary: 'Get all bookings with filters (admin only)',
          tags: ['Admin'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'query', name: 'page', schema: { type: 'number' } },
            { in: 'query', name: 'limit', schema: { type: 'number' } },
            { in: 'query', name: 'business', schema: { type: 'string' } },
            { in: 'query', name: 'user', schema: { type: 'string' } },
            { in: 'query', name: 'status', schema: { type: 'string' } },
            { in: 'query', name: 'dateFrom', schema: { type: 'string', format: 'date' } },
            { in: 'query', name: 'dateTo', schema: { type: 'string', format: 'date' } },
          ],
          responses: { 200: { description: 'Paginated booking list' } },
        },
      },
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
