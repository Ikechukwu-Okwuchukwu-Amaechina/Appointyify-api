# Appointyify API

Quick starter for the API using Express + Mongoose. This API handles authentication, business management, and appointment bookings.

## Features

- **Authentication**: JWT-based registration and login, profile management (including image uploads), and email-based password recovery.
- **Business Management**: CRUD operations with image support, search, category filtering, and pagination support.
- **Booking System**: Automated slot generation based on working hours, availability checking, and appointment lifecycle management (confirm/cancel).
- **Messaging System**: WebSocket-based real-time chat between clients and businesses with REST API fallbacks.
- **Image Management**: Integrated Cloudinary support for profile pictures and business images.
- **Admin Dashboard**: Built-in web interface for system-wide management of users (including role updates), businesses, and bookings.
- **API Documentation**: Interactive Swagger/OpenAPI documentation for easy endpoint testing.
- **Role-based Access**: Specific permissions for Users, Businesses, and Admins.
- **Testing**: Integrated test suite using Jest and Supertest.

## Steps to run locally:

1. **Install dependencies:**

bash
npm install

2. **Start MongoDB locally** (e.g., `mongod` or your MongoDB service).

3. **Copy `.env` and update secrets** (e.g., `MONGODB_URI`, `JWT_SECRET`, `CLOUDINARY` credentials, and `SMTP` credentials for emails).

4. **Run the server:**

For development (with nodemon):
bash
npm run dev

For production:
bash
npm start

Server will run on the `PORT` from `.env` (default 5000).

## Documentation & Administration

- **API Docs**: Access the interactive Swagger UI at `http://localhost:5000/api-docs`
- **WebSocket Guide**: Detailed real-time messaging implementation details in `WEBSOCKET.md`
- **Admin Panel**: Access the management dashboard at `http://localhost:5000/admin.html`

## Testing

Run the automated test suite:

bash
npm test

## API Routes

- `/api/auth` - Registration, Login, Profile & Image Updates, and Password Reset
- `/api/businesses` - Listing (search/filter), management (including images), and owner views
- `/api/bookings` - Availability checks, scheduling, status tracking, and cancellation
- `/api/messages` - Real-time chat history, REST fallback messaging, and conversation management
- `/api/admin` - Global statistics and administrative management of users (including role management), businesses, and bookings
- `/api-docs` - Swagger UI documentation