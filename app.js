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
const allowedOrigins = (process.env.CLIENT_URL || process.env.CORS_ORIGIN || 'http://127.0.0.1:5500')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

function corsOriginHandler(origin, callback) {
  if (!origin || allowedOrigins.includes(origin)) {
    callback(null, true);
    return;
  }

  callback(new Error('Not allowed by CORS'));
}

const io = new Server(server, {
  cors: {
    origin: corsOriginHandler, // Restricting origin to something specific!
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Setting CSP, X-Frame-Options, HSTS... you name it!
// BUT we tell Helmet to allow our Swagger CDN links, otherwise it blocks them!
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"], // Allowing Cloudinary images too just in case!
      connectSrc: ["'self'", "https://api.cloudinary.com", ...allowedOrigins]
    },
  },
}));
app.use(cors({
  origin: corsOriginHandler,
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

function getSocketToken(socket) {
  const authToken = socket.handshake.auth && socket.handshake.auth.token;
  if (authToken) return authToken;

  const header = socket.handshake.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    return header.split(' ')[1];
  }

  if (socket.handshake.query && socket.handshake.query.token) {
    return socket.handshake.query.token;
  }

  return null;
}

function getSocketUserId(decoded) {
  return decoded?.user?.id || decoded?.userId || decoded?.id || null;
}

function emitSocketError(socket, message, extra = {}) {
  const payload = { message, ...extra };
  socket.emit('socketError', payload);
  socket.emit('error', payload);
}

async function getAuthorizedBookingForSocket(bookingId, userId) {
  const booking = await Booking.findById(bookingId).populate('business');

  if (!booking) {
    return { error: 'Booking not found' };
  }

  const isClient = String(booking.user) === String(userId);
  const isBusiness = String(booking.business.owner) === String(userId);

  if (!isClient && !isBusiness) {
    return { error: 'Unauthorized' };
  }

  return {
    booking,
    senderType: isClient ? 'client' : 'business'
  };
}

// WebSocket authentication middleware
io.use((socket, next) => {
  const token = getSocketToken(socket);
  if (!token) {
    return next(new Error('Authentication error'));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');
    const userId = getSocketUserId(decoded);
    if (!userId) {
      return next(new Error('Authentication error'));
    }
    socket.userId = userId;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.userId);
  socket.join(`user_${socket.userId}`);

  // Join a booking-specific room
  socket.on('joinBooking', async (bookingId, callback) => {
    try {
      const access = await getAuthorizedBookingForSocket(bookingId, socket.userId);
      if (access.error) {
        emitSocketError(socket, access.error, { bookingId });
        if (typeof callback === 'function') callback({ ok: false, message: access.error });
        return;
      }

      socket.join(`booking_${bookingId}`);
      const payload = { ok: true, bookingId: String(bookingId) };
      socket.emit('joinedBooking', payload);
      if (typeof callback === 'function') callback(payload);
      console.log(`User ${socket.userId} joined booking ${bookingId}`);
    } catch (error) {
      emitSocketError(socket, error.message, { bookingId });
      if (typeof callback === 'function') callback({ ok: false, message: error.message });
    }
  });

  // Send message
  socket.on('sendMessage', async (data = {}, callback) => {
    try {
      const { bookingId, content, senderType } = data;
      if (!bookingId || !content || !String(content).trim()) {
        const message = 'bookingId and content are required';
        emitSocketError(socket, message);
        if (typeof callback === 'function') callback({ ok: false, message });
        return;
      }

      const access = await getAuthorizedBookingForSocket(bookingId, socket.userId);
      if (access.error) {
        emitSocketError(socket, access.error, { bookingId });
        if (typeof callback === 'function') callback({ ok: false, message: access.error });
        return;
      }

      if (senderType && senderType !== access.senderType) {
        const message = 'senderType does not match the authenticated user';
        emitSocketError(socket, message, { bookingId });
        if (typeof callback === 'function') callback({ ok: false, message });
        return;
      }

      // Create and save message
      const message = await Message.create({
        booking: bookingId,
        sender: socket.userId,
        senderType: access.senderType,
        content: String(content).trim()
      });

      const populatedMessage = await Message.findById(message._id)
        .populate('sender', 'name email')
        .populate('booking');

      // Broadcast to all users in the booking room
      io.to(`booking_${bookingId}`).emit('newMessage', populatedMessage.toJSON());
      if (typeof callback === 'function') {
        callback({ ok: true, message: populatedMessage.toJSON() });
      }
    } catch (error) {
      emitSocketError(socket, error.message);
      if (typeof callback === 'function') callback({ ok: false, message: error.message });
    }
  });

  // Mark messages as read
  socket.on('markAsRead', async (data = {}, callback) => {
    try {
      const { messageIds, bookingId } = data;

      let messages = [];
      if (bookingId) {
        const access = await getAuthorizedBookingForSocket(bookingId, socket.userId);
        if (access.error) {
          emitSocketError(socket, access.error, { bookingId });
          if (typeof callback === 'function') callback({ ok: false, message: access.error });
          return;
        }

        messages = await Message.find({
          booking: bookingId,
          sender: { $ne: socket.userId },
          isRead: false
        });
      } else if (Array.isArray(messageIds) && messageIds.length > 0) {
        messages = await Message.find({ _id: { $in: messageIds } }).populate({
          path: 'booking',
          populate: { path: 'business', select: 'owner' }
        });
      } else {
        const message = 'messageIds array or bookingId is required';
        emitSocketError(socket, message);
        if (typeof callback === 'function') callback({ ok: false, message });
        return;
      }

      const authorizedMessageIds = [];
      const bookingIds = new Set();

      messages.forEach((messageDoc) => {
        const booking = messageDoc.booking && messageDoc.booking._id ? messageDoc.booking : null;
        const bookingUserId = booking ? booking.user : null;
        const bookingOwnerId = booking && booking.business ? booking.business.owner : null;

        if (booking && (String(bookingUserId) === String(socket.userId) || String(bookingOwnerId) === String(socket.userId))) {
          authorizedMessageIds.push(messageDoc._id);
          bookingIds.add(String(booking._id));
          return;
        }

        if (!booking && bookingId) {
          authorizedMessageIds.push(messageDoc._id);
          bookingIds.add(String(bookingId));
        }
      });

      if (authorizedMessageIds.length === 0) {
        const payload = { ok: true, messageIds: [], bookingIds: Array.from(bookingIds) };
        socket.emit('messagesMarkedAsRead', payload);
        if (typeof callback === 'function') callback(payload);
        return;
      }

      await Message.updateMany(
        { _id: { $in: authorizedMessageIds } },
        { isRead: true }
      );

      const payload = {
        ok: true,
        messageIds: authorizedMessageIds.map((id) => String(id)),
        bookingIds: Array.from(bookingIds)
      };

      payload.bookingIds.forEach((id) => {
        io.to(`booking_${id}`).emit('messagesMarkedAsRead', payload);
      });

      if (typeof callback === 'function') callback(payload);
    } catch (error) {
      emitSocketError(socket, error.message);
      if (typeof callback === 'function') callback({ ok: false, message: error.message });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.userId);
  });
});

// Make io available to routes
app.set('io', io);

// Fixing Vercel Swagger UI CSS and JS issues by loading all assets from CDNs!
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.1.0/swagger-ui.min.css',
  customJs: [
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.1.0/swagger-ui-bundle.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.1.0/swagger-ui-standalone-preset.min.js'
  ]
}));

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
