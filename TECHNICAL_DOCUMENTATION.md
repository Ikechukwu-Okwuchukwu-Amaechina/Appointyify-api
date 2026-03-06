# Appointify API - Technical Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Data Models](#data-models)
5. [Authentication & Authorization](#authentication--authorization)
6. [API Endpoints](#api-endpoints)
7. [Real-time Messaging](#real-time-messaging)
8. [File Upload System](#file-upload-system)
9. [Business Logic](#business-logic)
10. [Testing](#testing)
11. [Configuration](#configuration)
12. [Deployment](#deployment)

---

## System Overview

Appointify is a comprehensive appointment booking platform API that enables users to discover businesses, book appointments, and communicate in real-time. The system supports three user roles: regular users (clients), business owners, and administrators.

### Key Features
- **User Management**: JWT-based authentication with role-based access control
- **Business Management**: Full CRUD operations for business listings with image support
- **Booking System**: Smart slot generation based on working hours with conflict detection
- **Real-time Messaging**: WebSocket-based chat with REST API fallback
- **Admin Dashboard**: System-wide management and statistics
- **Image Management**: Cloudinary integration for profile and business images
- **API Documentation**: Interactive Swagger/OpenAPI documentation

---

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  (Web/Mobile Apps, Admin Dashboard, API Consumers)          │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                   API Gateway Layer                          │
│  - CORS Middleware                                           │
│  - Request Validation (express-validator)                    │
│  - JWT Authentication Middleware                             │
│  - Rate Limiting (future consideration)                      │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                  Application Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Routes     │  │ Controllers  │  │  Validators  │      │
│  │              │  │              │  │              │      │
│  │ - Auth       │  │ - Auth       │  │ - Auth       │      │
│  │ - Business   │  │ - Business   │  │ - Business   │      │
│  │ - Booking    │  │ - Booking    │  │ - Booking    │      │
│  │ - Messages   │  │ - Messages   │  │ - ID         │      │
│  │ - Admin      │  │ - Admin      │  │ - Date       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                  Data Access Layer                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Mongoose ODM                             │   │
│  │  - User Model      - Business Model                  │   │
│  │  - Booking Model   - Message Model                   │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                  External Services                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  MongoDB    │  │  Cloudinary │  │  NodeMailer │         │
│  │  Database   │  │  Image CDN  │  │  Email SMTP │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              Real-time Communication Layer                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Socket.IO WebSocket Server              │    │
│  │  - Authentication via JWT                            │    │
│  │  - Room-based messaging (booking-specific)          │    │
│  │  - Real-time message delivery                        │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Request Flow

```
1. HTTP Request → CORS → JSON Parser → Routes
2. Route → Validators → Authentication Middleware
3. Middleware → Authorization Check → Controller
4. Controller → Business Logic → Model Operations
5. Model → MongoDB Query → Response
6. Response → JSON Transform → Client

WebSocket Flow:
1. Connect → JWT Validation → Session Established
2. Event → Authorization → Database Operation
3. Operation → Emit to Room → Clients Receive
```

---

## Technology Stack

### Core Technologies
- **Runtime**: Node.js
- **Framework**: Express.js 4.22.1
- **Database**: MongoDB with Mongoose 7.8.9 ODM
- **Real-time**: Socket.IO 4.8.3
- **Authentication**: JSON Web Tokens (jsonwebtoken 9.0.3)
- **Password Hashing**: bcryptjs 2.4.3

### Supporting Libraries
- **Validation**: express-validator 6.15.0
- **File Upload**: multer 2.0.2, multer-storage-cloudinary 4.0.0
- **Image Storage**: cloudinary 1.41.3
- **Email**: nodemailer 8.0.1
- **CORS**: cors 2.8.6
- **Documentation**: swagger-jsdoc 6.2.8, swagger-ui-express 5.0.1
- **Environment**: dotenv 17.2.3

### Development & Testing
- **Testing Framework**: Jest 29.7.0
- **API Testing**: Supertest 6.3.4
- **Test DB**: mongodb-memory-server 8.16.1
- **Dev Server**: nodemon 2.0.22
- **Cross-platform**: cross-env 10.1.0

---

## Data Models

### User Model
**Collection**: `users`

```javascript
{
  _id: ObjectId,
  name: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  phone: String (optional),
  role: String (enum: ['user', 'business', 'admin'], default: 'user'),
  profileImage: String (Cloudinary URL),
  profileImagePublicId: String (Cloudinary ID),
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

**Indexes**:
- `email`: Unique index for fast lookup and authentication
- `role`: Index for role-based queries

**Methods**:
- `comparePassword(candidatePassword)`: Compares input password with hashed password

**Hooks**:
- Pre-save: Automatically hashes password using bcrypt (10 rounds) when modified

**Security**:
- Password field excluded from JSON responses
- Password reset tokens hashed with SHA-256

---

### Business Model
**Collection**: `businesses`

```javascript
{
  _id: ObjectId,
  owner: ObjectId (ref: 'User', required),
  name: String (required),
  description: String,
  category: String,
  address: String,
  phone: String,
  email: String,
  workingHours: String (format: "HH:MM-HH:MM", e.g., "09:00-17:00"),
  slotDuration: Number (default: 30, in minutes),
  image: String (Cloudinary URL),
  imagePublicId: String (Cloudinary ID),
  isActive: Boolean (default: true),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

**Indexes**:
- `owner`: Index for owner queries
- `category`: Index for category filtering
- `name`: Text index for search functionality

**Business Rules**:
- Only users with role 'business' or 'admin' can create businesses
- Working hours must follow "HH:MM-HH:MM" format
- Slot duration is used for generating available time slots

---

### Booking Model
**Collection**: `bookings`

```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: 'User', required),
  business: ObjectId (ref: 'Business', required),
  date: Date (required),
  startTime: String (format: "HH:MM", required),
  endTime: String (format: "HH:MM", required),
  status: String (enum: ['pending', 'confirmed', 'cancelled'], default: 'pending'),
  notes: String,
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

**Indexes**:
- `user`: Index for user bookings
- `business`: Index for business bookings
- `date`: Index for date-based queries
- Compound index: `(business, date, startTime)` for conflict detection

**Business Rules**:
- Prevents double booking (same business, date, and startTime)
- Validates time slots against business working hours
- Only cancelled bookings excluded from conflict checking

---

### Message Model
**Collection**: `messages`

```javascript
{
  _id: ObjectId,
  booking: ObjectId (ref: 'Booking', required),
  sender: ObjectId (ref: 'User', required),
  senderType: String (enum: ['client', 'business'], required),
  content: String (required),
  isRead: Boolean (default: false),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

**Indexes**:
- `booking`: Index for fetching conversation messages
- `sender`: Index for sender queries
- Compound index: `(booking, isRead)` for unread counts

**Business Rules**:
- Messages tied to specific booking conversations
- Sender must be either the booking user or business owner
- Real-time delivery via WebSocket with REST fallback

---

## Authentication & Authorization

### Authentication Flow

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ POST /api/auth/register or /login
       │ { email, password, ... }
       ▼
┌──────────────┐
│   Server     │
│  Validates   │──→ Check email/password
│  Credentials │
└──────┬───────┘
       │ bcrypt.compare()
       ▼
┌──────────────┐
│  Generate    │
│  JWT Token   │──→ jwt.sign({ user: { id } }, SECRET, { expiresIn: '1h' })
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Return     │
│   Token      │──→ { token: "eyJhbGc..." }
└──────────────┘
```

### JWT Token Structure
```javascript
{
  user: {
    id: "userId"
  },
  iat: 1234567890,  // Issued at
  exp: 1234571490   // Expires in 1 hour
}
```

### Authorization Middleware

#### `protect` Middleware
Verifies JWT token and attaches user to request:

```javascript
// Usage in routes
router.get('/api/bookings', protect, getMyBookings);

// Process:
1. Extract token from "Authorization: Bearer TOKEN"
2. Verify token with JWT_SECRET
3. Fetch user from database
4. Attach user to req.user
5. Call next() or return 401
```

#### `restrictTo` Middleware
Restricts access based on user roles:

```javascript
// Usage in routes
router.use('/api/admin', protect, restrictTo('admin'));

// Process:
1. Check if req.user.role matches allowed roles
2. Return 403 if unauthorized
3. Call next() if authorized
```

### Role-Based Access Control (RBAC)

| Role | Capabilities |
|------|-------------|
| **user** | - Create bookings<br/>- View own bookings<br/>- Send messages as client<br/>- Update own profile |
| **business** | - All 'user' capabilities<br/>- Create businesses<br/>- Manage own businesses<br/>- View business bookings<br/>- Update booking status<br/>- Send messages as business |
| **admin** | - All capabilities<br/>- Access admin dashboard<br/>- Manage all users<br/>- Update user roles<br/>- Delete any resource<br/>- View system statistics |

### Password Reset Flow

```
1. User requests reset: POST /api/auth/forgot-password
   → Generate random token (32 bytes)
   → Hash token with SHA-256
   → Store hash in user.resetPasswordToken
   → Set expiration (1 hour)
   → Send email with reset link

2. User clicks link: http://domain/reset-password/{token}
   → Token passed in URL

3. User submits new password: POST /api/auth/reset-password/:token
   → Hash provided token
   → Find user with matching hash and valid expiration
   → Update password
   → Clear reset token fields
```

---

## API Endpoints

### Authentication Endpoints
**Base Path**: `/api/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | None | Register new user |
| POST | `/login` | None | Login and get JWT token |
| GET | `/me` | Required | Get current user profile |
| PUT | `/profile` | Required | Update user profile |
| POST | `/forgot-password` | None | Request password reset email |
| POST | `/reset-password/:token` | None | Reset password with token |
| POST | `/profile/image` | Required | Upload profile image |
| DELETE | `/profile/image` | Required | Delete profile image |

**Register & Login**
```javascript
// POST /api/auth/register
Request: {
  name: "John Doe",
  email: "john@example.com",
  password: "securepassword",
  phone: "1234567890",
  role: "user" // or "business"
}
Response: { token: "jwt_token_here" }

// POST /api/auth/login
Request: {
  email: "john@example.com",
  password: "securepassword"
}
Response: { token: "jwt_token_here" }
```

---

### Business Endpoints
**Base Path**: `/api/businesses`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | Business/Admin | Create new business |
| GET | `/` | None | List all businesses (with filters) |
| GET | `/mine` | Required | Get current user's businesses |
| GET | `/:id` | None | Get business details |
| PATCH | `/:id` | Owner/Admin | Update business |
| DELETE | `/:id` | Owner/Admin | Delete business |
| POST | `/:id/image` | Owner/Admin | Upload business image |
| DELETE | `/:id/image` | Owner/Admin | Delete business image |

**Business Listing with Filters**
```javascript
// GET /api/businesses?search=coffee&category=cafe&isActive=true&page=1&limit=20
Query Parameters:
- search: Search by name (regex, case-insensitive)
- category: Filter by category
- isActive: Filter by active status (true/false)
- page: Page number (default: 1)
- limit: Items per page (default: 20)

Response: [
  {
    _id: "business_id",
    owner: { _id, name, email },
    name: "Coffee Shop",
    description: "Best coffee in town",
    category: "cafe",
    workingHours: "08:00-20:00",
    slotDuration: 30,
    image: "cloudinary_url",
    isActive: true,
    createdAt: "2026-02-15T00:00:00.000Z"
  }
]
```

---

### Booking Endpoints
**Base Path**: `/api/bookings`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | Required | Create new booking |
| GET | `/` | Required | Get user's bookings |
| GET | `/:id` | Required | Get booking details |
| GET | `/availability/:businessId` | None | Get available slots |
| GET | `/business/:businessId` | Owner/Admin | Get business bookings |
| PATCH | `/:id/cancel` | User/Owner/Admin | Cancel booking |
| PATCH | `/:id/status` | Owner/Admin | Update booking status |

**Create Booking**
```javascript
// POST /api/bookings
Request: {
  business: "business_id",
  date: "2026-02-20", // YYYY-MM-DD
  startTime: "10:00",
  notes: "Need consultation"
}
Response: {
  _id: "booking_id",
  user: "user_id",
  business: "business_id",
  date: "2026-02-20T00:00:00.000Z",
  startTime: "10:00",
  endTime: "10:30",
  status: "pending",
  notes: "Need consultation"
}
```

**Check Availability**
```javascript
// GET /api/bookings/availability/business_id?date=2026-02-20
Response: [
  {
    startTime: "09:00",
    endTime: "09:30",
    available: true
  },
  {
    startTime: "09:30",
    endTime: "10:00",
    available: true
  },
  {
    startTime: "10:00",
    endTime: "10:30",
    available: false // Already booked
  }
]
```

---

### Messaging Endpoints
**Base Path**: `/api/messages`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | Required | Send message (REST fallback) |
| GET | `/:bookingId` | Required | Get booking messages |
| GET | `/conversations` | Required | Get user's conversations |
| GET | `/business/:businessId/conversations` | Owner/Admin | Get business conversations |
| PUT | `/read` | Required | Mark messages as read |

**Conversation Structure**
```javascript
// GET /api/messages/conversations
Response: [
  {
    booking: {
      _id: "booking_id",
      business: { name: "Coffee Shop" },
      date: "2026-02-20T00:00:00.000Z",
      startTime: "10:00",
      status: "confirmed"
    },
    lastMessage: {
      _id: "message_id",
      sender: { name: "John Doe" },
      content: "Looking forward to it!",
      createdAt: "2026-02-15T10:30:00.000Z"
    },
    unreadCount: 2
  }
]
```

---

### Admin Endpoints
**Base Path**: `/api/admin`
**Required Role**: `admin`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/stats` | Get system statistics |
| GET | `/users` | List all users (paginated) |
| GET | `/users/:id` | Get user details |
| DELETE | `/users/:id` | Delete user and related data |
| PUT | `/users/:id/role` | Update user role |
| GET | `/businesses` | List all businesses (paginated) |
| GET | `/bookings` | List all bookings (paginated) |

**System Statistics**
```javascript
// GET /api/admin/stats
Response: {
  usersCount: 150,
  businessesCount: 45,
  bookingsCount: 320,
  byRole: [
    { _id: "user", count: 120 },
    { _id: "business", count: 28 },
    { _id: "admin", count: 2 }
  ]
}
```

---

## Real-time Messaging

### WebSocket Architecture

The application uses Socket.IO for real-time bidirectional communication.

**Connection Establishment**
```javascript
// Client-side connection
const socket = io('http://localhost:5000', {
  auth: {
    token: 'jwt_token_here'
  }
});

// Server-side authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));
  
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  socket.userId = decoded.userId;
  next();
});
```

### WebSocket Events

#### Client → Server Events

**1. joinBooking**
```javascript
socket.emit('joinBooking', bookingId);
// Joins a booking-specific room for targeted message delivery
```

**2. sendMessage**
```javascript
socket.emit('sendMessage', {
  bookingId: 'booking_id',
  content: 'Hello!',
  senderType: 'client' // or 'business'
});

// Server validates:
// - Booking exists
// - User is authorized (client or business owner)
// - Creates message in database
// - Broadcasts to all users in booking room
```

**3. markAsRead**
```javascript
socket.emit('markAsRead', {
  messageIds: ['msg_id_1', 'msg_id_2']
});
// Updates message read status in database
```

#### Server → Client Events

**1. newMessage**
```javascript
socket.on('newMessage', (message) => {
  // Emitted to all users in booking room
  // message: { _id, booking, sender, senderType, content, isRead, createdAt }
});
```

**2. messagesMarkedAsRead**
```javascript
socket.on('messagesMarkedAsRead', (data) => {
  // data: { messageIds: [...] }
});
```

**3. error**
```javascript
socket.on('error', (error) => {
  // error: { message: 'Error description' }
});
```

### Room-based Architecture

```
Booking Room: "booking_{bookingId}"
├── Client Socket (userId: client_id)
└── Business Owner Socket (userId: owner_id)

When message sent:
1. Validate sender is in room
2. Save to database
3. io.to(`booking_${bookingId}`).emit('newMessage', message)
4. All sockets in room receive message
```

### REST API Fallback

For scenarios where WebSocket isn't available:
- POST `/api/messages` - Send message via HTTP
- GET `/api/messages/:bookingId` - Fetch message history
- Polling can be implemented client-side if needed

---

## File Upload System

### Architecture Overview

```
Client Upload → Multer → Cloudinary → URL Stored in DB
                  ↓
              Validation
              - File type
              - File size
              - Authentication
```

### Cloudinary Configuration

**Storage Folders**:
- User profiles: `appointify/users`
- Business images: `appointify/businesses`

**Image Transformations**:
- User profiles: 400x400px, quality: auto
- Business images: 800x800px, quality: auto

**Configuration** (`config/cloudinary.js`):
```javascript
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
```

### Upload Endpoints

**Profile Image Upload**
```javascript
// POST /api/auth/profile/image
Headers: {
  Authorization: "Bearer jwt_token",
  Content-Type: "multipart/form-data"
}
Body: FormData {
  image: File (max 5MB, jpg/jpeg/png/webp)
}

Process:
1. Multer validates file type and size
2. Upload to Cloudinary (/users folder)
3. Delete old image if exists
4. Update user.profileImage and user.profileImagePublicId
5. Return image URL
```

**Business Image Upload**
```javascript
// POST /api/businesses/:id/image
// Same process, uploads to /businesses folder
// Validates ownership (owner or admin)
```

### Image Deletion
```javascript
// DELETE /api/auth/profile/image
Process:
1. Check if image exists
2. Delete from Cloudinary using publicId
3. Clear profileImage and profileImagePublicId fields
4. Return success message
```

### Security Measures
- File type validation (images only)
- Size limit: 5MB per file
- Authentication required
- Ownership verification for business images
- Automatic cleanup of old images

---

## Business Logic

### Slot Generation Algorithm

The system automatically generates available time slots based on business working hours.

**Implementation** (`controllers/bookingController.js`):

```javascript
function generateSlotsFromWorkingHours(workingHours, slotDuration) {
  // Input: "09:00-17:00", 30 (minutes)
  // Output: Array of time slots
  
  const [start, end] = workingHours.split('-');
  const slots = [];
  let current = start;
  
  while (true) {
    const next = addMinutesToTime(current, slotDuration);
    if (next > end) break;
    
    slots.push({
      startTime: current,  // "09:00"
      endTime: next        // "09:30"
    });
    
    current = next;
  }
  
  return slots;
}

// Example: workingHours="09:00-12:00", slotDuration=30
// Returns: [
//   { startTime: "09:00", endTime: "09:30" },
//   { startTime: "09:30", endTime: "10:00" },
//   { startTime: "10:00", endTime: "10:30" },
//   { startTime: "10:30", endTime: "11:00" },
//   { startTime: "11:00", endTime: "11:30" },
//   { startTime: "11:30", endTime: "12:00" }
// ]
```

### Availability Checking

```javascript
// GET /api/bookings/availability/:businessId?date=2026-02-20
Process:
1. Generate all possible slots from working hours
2. Query existing bookings for that date (exclude cancelled)
3. Mark slots as unavailable if booking exists
4. Return slot array with availability flags
```

### Double Booking Prevention

```javascript
// Before creating booking:
const existing = await Booking.findOne({
  business: businessId,
  date: requestedDate,
  startTime: requestedStartTime,
  status: { $ne: 'cancelled' }
});

if (existing) {
  return res.status(409).json({ msg: 'Slot already booked' });
}
```

### Booking Status Workflow

```
pending → confirmed → cancelled
   ↓                      ↑
   └──────────────────────┘
   
- pending: Initial state when booking created
- confirmed: Business owner accepts booking
- cancelled: User, business owner, or admin cancels
```

**Authorization Rules**:
- User can cancel own bookings
- Business owner can cancel/confirm their business bookings
- Admin can perform any action

### Date Handling

All dates stored in ISO 8601 format:

```javascript
// Input: "2026-02-20" (YYYY-MM-DD)
// Parsed to: Date object (2026-02-20T00:00:00.000Z)
// Stored in MongoDB: ISODate("2026-02-20T00:00:00.000Z")
// Output in JSON: "2026-02-20T00:00:00.000Z"

// Custom parser function:
function parseDateOnly(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d)) return null;
  return d;
}
```

---

## Testing

### Test Configuration

**Framework**: Jest with Supertest for API testing

**Test Environment Setup**:
```javascript
// Uses mongodb-memory-server for isolated test database
// NODE_ENV=test triggers special database handling
// Each test file creates its own in-memory MongoDB instance
```

**Running Tests**:
```bash
npm test                 # Run all tests
npm test auth.test.js    # Run specific test file
```

### Test Structure

Each module has corresponding test file:
- `tests/auth.test.js` - Authentication tests
- `tests/business.test.js` - Business management tests
- `tests/booking.test.js` - Booking system tests
- `tests/admin.test.js` - Admin functionality tests

**Example Test Pattern**:
```javascript
describe('Auth Controller', () => {
  beforeAll(async () => {
    // Connect to test database
  });
  
  beforeEach(async () => {
    // Clear collections
  });
  
  afterAll(async () => {
    // Cleanup and disconnect
  });
  
  test('POST /api/auth/register - should create new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });
    
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
  });
});
```

### Test Coverage Areas

1. **Authentication**
   - User registration
   - Login with valid/invalid credentials
   - JWT token generation and validation
   - Password reset flow
   - Profile updates

2. **Authorization**
   - Role-based access control
   - Token validation
   - Protected route access

3. **Business Operations**
   - CRUD operations
   - Ownership validation
   - Search and filtering

4. **Booking System**
   - Slot generation
   - Availability checking
   - Double booking prevention
   - Status updates

5. **Admin Functions**
   - Statistics retrieval
   - User management
   - Role updates

---

## Configuration

### Environment Variables

**Required Variables**:
```bash
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/appointify

# JWT Authentication
JWT_SECRET=your_secure_secret_key_here

# Cloudinary (Image Storage)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=noreply@appointify.com
```

**Optional Variables**:
```bash
# Test Environment
NODE_ENV=test  # Uses in-memory MongoDB

# Production Overrides
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/appointify
JWT_SECRET=production_secret_key
```

### Database Configuration

**Connection Handling** (`database.js`):
```javascript
// Development/Production: Connects to MONGODB_URI
// Test: Skips connection (mongodb-memory-server handles it)
// Retry logic with process.exit(1) on failure
// Uses Mongoose connection options:
// - useNewUrlParser: true
// - useUnifiedTopology: true
```

**Connection States**:
- 0: Disconnected
- 1: Connected
- 2: Connecting
- 3: Disconnecting

### CORS Configuration

```javascript
// app.js
app.use(cors());
// Allows all origins in development

// Production recommendation:
app.use(cors({
  origin: ['https://yourdomain.com'],
  credentials: true
}));
```

### Swagger Documentation

Accessible at: `http://localhost:5000/api-docs`

**Configuration** (`swagger.js`):
- OpenAPI 3.0.0 specification
- Interactive API testing interface
- Authentication scheme: Bearer JWT
- Detailed endpoint documentation with examples

---

## Deployment

### Pre-deployment Checklist

1. **Environment Variables**
   - Set all required environment variables
   - Use strong JWT_SECRET (minimum 32 characters)
   - Configure production MongoDB URI
   - Set up Cloudinary production account
   - Configure production SMTP service

2. **Database**
   - Create production MongoDB database
   - Set up database backups
   - Configure connection pooling
   - Create indexes for performance:
     ```javascript
     db.users.createIndex({ email: 1 }, { unique: true })
     db.bookings.createIndex({ business: 1, date: 1, startTime: 1 })
     db.messages.createIndex({ booking: 1, createdAt: 1 })
     ```

3. **Security**
   - Enable CORS with specific origins
   - Add rate limiting middleware
   - Enable Helmet.js for security headers
   - Implement request size limits
   - Add DDoS protection

4. **Monitoring**
   - Set up error tracking (e.g., Sentry)
   - Configure logging (Winston/Morgan)
   - Add health check endpoint
   - Monitor database connections

### Deployment Platforms

#### Render (Recommended)
```bash
# Render deployment via Git
# 1. Push code to GitHub/GitLab
# 2. Connect repository to Render
# 3. Configure as Web Service

# Build Command:
npm install

# Start Command:
npm start

# Environment Variables (Set in Render Dashboard):
NODE_ENV=production
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_password
SMTP_FROM=noreply@appointify.com
```

**Render Configuration Tips**:
- Use Render's free tier for MongoDB or connect to MongoDB Atlas
- Enable auto-deploy from your Git branch
- Set up health check path: `/health`
- Configure custom domain if needed
- Use environment groups for shared variables

#### Heroku (Alternative)
```bash
# Install Heroku CLI
heroku login
heroku create appointify-api

# Set environment variables
heroku config:set JWT_SECRET=your_secret
heroku config:set MONGODB_URI=your_mongodb_uri
# ... set all other variables

# Deploy
git push heroku main

# Scale dynos
heroku ps:scale web=1
```

#### Docker Deployment
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "5000:5000"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/appointify
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - mongo
  
  mongo:
    image: mongo:7
    volumes:
      - mongo-data:/data/db
    ports:
      - "27017:27017"

volumes:
  mongo-data:
```

### Production Optimizations

**1. Process Management**
```bash
# Use PM2 for process management
npm install -g pm2

# ecosystem.config.js
module.exports = {
  apps: [{
    name: 'appointify-api',
    script: 'app.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    }
  }]
};

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

**2. Add Rate Limiting**
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

**3. Add Compression**
```javascript
const compression = require('compression');
app.use(compression());
```

**4. Database Optimization**
- Enable MongoDB connection pooling
- Add appropriate indexes
- Implement pagination on all list endpoints
- Use lean queries where possible

**5. Logging**
```javascript
const morgan = require('morgan');
const winston = require('winston');

// HTTP request logging
app.use(morgan('combined'));

// Application logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### Scaling Considerations

**Horizontal Scaling**:
- Use load balancer (NGINX, AWS ALB)
- Deploy multiple API instances
- Configure sticky sessions for WebSocket
- Use Redis for session storage if needed

**WebSocket Scaling**:
```javascript
// Use Redis adapter for Socket.IO
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');

const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));
```

**Database Scaling**:
- Use MongoDB Atlas for managed scaling
- Implement read replicas for read-heavy operations
- Consider caching layer (Redis) for frequent queries

### Monitoring & Maintenance

**Health Check Endpoint**:
```javascript
app.get('/health', async (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});
```

**Backup Strategy**:
- Automated daily MongoDB backups
- Cloudinary images are managed by their service
- Keep configuration in version control
- Document restore procedures

---

## Additional Resources

### Code Organization Best Practices

**Current Structure Benefits**:
- **Separation of Concerns**: Routes, controllers, models, and middleware are clearly separated
- **Reusability**: Validators and middleware can be reused across routes
- **Testability**: Each component can be tested in isolation
- **Maintainability**: Clear file structure makes onboarding easier

**Best Practices Implemented**:
1. ✅ Environment-based configuration
2. ✅ Centralized error handling
3. ✅ Input validation on all endpoints
4. ✅ JWT-based authentication
5. ✅ Role-based authorization
6. ✅ Password hashing
7. ✅ API documentation (Swagger)
8. ✅ Test coverage

**Potential Improvements**:
- Add rate limiting
- Implement request ID tracking
- Add comprehensive error logging
- Implement API versioning
- Add health check monitoring
- Implement caching for frequently accessed data

### API Design Patterns Used

1. **RESTful Design**: Standard HTTP methods and status codes
2. **JWT Authentication**: Stateless authentication mechanism
3. **Pagination**: Query parameters for data limiting
4. **Filtering**: Query parameters for data filtering
5. **Nested Resources**: `/business/:id/bookings` pattern
6. **WebSocket Integration**: Real-time features alongside REST

### Security Best Practices

1. **Authentication**: JWT tokens with 1-hour expiration
2. **Authorization**: Role-based access control on all endpoints
3. **Password Security**: bcrypt hashing with 10 rounds
4. **Input Validation**: express-validator on all inputs
5. **SQL Injection**: Protected via Mongoose parameterization
6. **File Upload**: Type and size validation
7. **CORS**: Configurable origin restrictions
8. **Password Reset**: Hashed tokens with expiration

---

## Conclusion

This technical documentation covers the complete Appointify API system architecture, implementation details, and deployment guidelines. The system is built with modern best practices, scalability in mind, and comprehensive security measures.

For additional support or questions:
- API Documentation: http://localhost:5000/api-docs
- Repository: Check README.md for setup instructions
- Contact: support@appointify.com

**Version**: 0.1.0  
**Last Updated**: February 2026  
**Maintained By**: Development Team
