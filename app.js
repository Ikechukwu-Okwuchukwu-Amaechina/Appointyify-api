const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./database');
const cors = require('cors');
const helmet = require('helmet'); // Newbie note: Helmet makes things super secure!
const session = require('express-session');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Message = require('./models/Message');
const Booking = require('./models/Booking');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://127.0.0.1:5500', // Restricting origin to something specific!
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.use(helmet()); // Setting CSP, X-Frame-Options, HSTS... you name it!
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://127.0.0.1:5500',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Setting up secure session to prevent session fixation!
app.use(session({
  secret: process.env.SESSION_SECRET || 'my-super-secret-key-that-no-one-will-guess',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict', // Strict same-site cookie!
    maxAge: 30 * 60 * 1000 // 30 minutes
  }
}));

app.use(express.static(path.join(__dirname, 'public')));

connectDB();

// WebSocket authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    socket.userId = decoded.userId;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.userId);

  // Join a booking-specific room
  socket.on('joinBooking', (bookingId) => {
    socket.join(`booking_${bookingId}`);
    console.log(`User ${socket.userId} joined booking ${bookingId}`);
  });

  // Send message
  socket.on('sendMessage', async (data) => {
    try {
      const { bookingId, content, senderType } = data;

      // Verify booking exists and user is authorized
      const booking = await Booking.findById(bookingId).populate('business');
      if (!booking) {
        socket.emit('error', { message: 'Booking not found' });
        return;
      }

      // Verify user is part of this booking
      const isClient = String(booking.user) === String(socket.userId);
      const isBusiness = String(booking.business.owner) === String(socket.userId);

      if (!isClient && !isBusiness) {
        socket.emit('error', { message: 'Unauthorized' });
        return;
      }

      // Create and save message
      const message = await Message.create({
        booking: bookingId,
        sender: socket.userId,
        senderType: senderType,
        content: content
      });

      await message.populate('sender');

      // Broadcast to all users in the booking room
      io.to(`booking_${bookingId}`).emit('newMessage', message.toJSON());
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Mark messages as read
  socket.on('markAsRead', async (data) => {
    try {
      const { messageIds } = data;
      await Message.updateMany(
        { _id: { $in: messageIds } },
        { isRead: true }
      );
      socket.emit('messagesMarkedAsRead', { messageIds });
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.userId);
  });
});

// Make io available to routes
app.set('io', io);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/businesses', require('./routes/business'));
app.use('/api/bookings', require('./routes/booking'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/messages', require('./routes/messages'));

app.get('/', (req, res) => res.send('Hello Appointly'));

const PORT = process.env.PORT || 5000;
if (require.main === module) {
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
