const Message = require('../models/Message');
const Booking = require('../models/Booking');
const Business = require('../models/Business');

function getIo(req) {
  return req.app.get('io');
}

function getBookingRoom(bookingId) {
  return `booking_${String(bookingId)}`;
}

async function getAuthorizedBooking(bookingId, user) {
  const booking = await Booking.findById(bookingId).populate('business');
  if (!booking) {
    return { error: { status: 404, msg: 'Booking not found' } };
  }

  const isClient = String(booking.user) === String(user._id);
  const isBusiness = String(booking.business.owner) === String(user._id);
  const isAdmin = user.role === 'admin';

  if (!isClient && !isBusiness && !isAdmin) {
    return { error: { status: 403, msg: 'Unauthorized' } };
  }

  return {
    booking,
    senderType: isClient ? 'client' : 'business'
  };
}

async function buildRealtimeMessagePayload(messageId) {
  return Message.findById(messageId)
    .populate('sender', 'name email')
    .populate('booking');
}

// Get messages for a specific booking
exports.getBookingMessages = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const access = await getAuthorizedBooking(bookingId, req.user);
    if (access.error) {
      return res.status(access.error.status).json({ msg: access.error.msg });
    }

    // Get messages
    const messages = await Message.find({ booking: bookingId })
      .populate('sender', 'name email')
      .sort({ createdAt: 1 });
    
    res.json(messages);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Get all conversations for a user (as client)
exports.getMyConversations = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('business', 'name')
      .sort({ updatedAt: -1 });
    
    const conversations = [];
    for (const booking of bookings) {
      const lastMessage = await Message.findOne({ booking: booking._id })
        .sort({ createdAt: -1 })
        .populate('sender', 'name');
      
      const unreadCount = await Message.countDocuments({
        booking: booking._id,
        sender: { $ne: req.user._id },
        isRead: false
      });
      
      conversations.push({
        booking: booking,
        lastMessage: lastMessage,
        unreadCount: unreadCount
      });
    }
    
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Get all conversations for a business owner
exports.getBusinessConversations = async (req, res) => {
  try {
    const { businessId } = req.params;
    
    // Verify user owns the business
    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ msg: 'Business not found' });
    }
    
    if (String(business.owner) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Unauthorized' });
    }
    
    const bookings = await Booking.find({ business: businessId })
      .populate('user', 'name email')
      .sort({ updatedAt: -1 });
    
    const conversations = [];
    for (const booking of bookings) {
      const lastMessage = await Message.findOne({ booking: booking._id })
        .sort({ createdAt: -1 })
        .populate('sender', 'name');
      
      const unreadCount = await Message.countDocuments({
        booking: booking._id,
        sender: { $ne: req.user._id },
        isRead: false
      });
      
      conversations.push({
        booking: booking,
        lastMessage: lastMessage,
        unreadCount: unreadCount
      });
    }
    
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Mark messages as read
exports.markMessagesAsRead = async (req, res) => {
  try {
    const { messageIds, bookingId } = req.body;

    if ((!messageIds || !Array.isArray(messageIds)) && !bookingId) {
      return res.status(400).json({ msg: 'messageIds array or bookingId is required' });
    }

    const filter = bookingId
      ? { booking: bookingId, sender: { $ne: req.user._id }, isRead: false }
      : { _id: { $in: messageIds }, sender: { $ne: req.user._id }, isRead: false };

    const messages = await Message.find(filter).populate({
      path: 'booking',
      populate: { path: 'business', select: 'owner' }
    });

    if (messages.length === 0) {
      return res.json({ msg: 'No unread messages found', count: 0, messageIds: [] });
    }

    const authorizedMessageIds = [];
    const bookingIdsToNotify = new Set();

    messages.forEach((message) => {
      const booking = message.booking;
      if (!booking) return;

      const isClient = String(booking.user) === String(req.user._id);
      const isBusiness = String(booking.business.owner) === String(req.user._id);
      const isAdmin = req.user.role === 'admin';

      if (isClient || isBusiness || isAdmin) {
        authorizedMessageIds.push(message._id);
        bookingIdsToNotify.add(String(booking._id));
      }
    });

    if (authorizedMessageIds.length === 0) {
      return res.status(403).json({ msg: 'Unauthorized' });
    }

    await Message.updateMany(
      { _id: { $in: authorizedMessageIds } },
      { isRead: true }
    );

    const payload = {
      messageIds: authorizedMessageIds.map((id) => String(id)),
      bookingIds: Array.from(bookingIdsToNotify)
    };

    const io = getIo(req);
    payload.bookingIds.forEach((id) => {
      io.to(getBookingRoom(id)).emit('messagesMarkedAsRead', payload);
    });

    res.json({ msg: 'Messages marked as read', count: authorizedMessageIds.length, ...payload });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Send a message via REST API (fallback for WebSocket)
exports.sendMessage = async (req, res) => {
  try {
    const { bookingId, content } = req.body;

    if (!bookingId || !content || !String(content).trim()) {
      return res.status(400).json({ msg: 'bookingId and content are required' });
    }

    const access = await getAuthorizedBooking(bookingId, req.user);
    if (access.error) {
      return res.status(access.error.status).json({ msg: access.error.msg });
    }

    const message = await Message.create({
      booking: bookingId,
      sender: req.user._id,
      senderType: access.senderType,
      content: String(content).trim(),
    });

    const populatedMessage = await buildRealtimeMessagePayload(message._id);
    const io = getIo(req);
    io.to(getBookingRoom(bookingId)).emit('newMessage', populatedMessage.toJSON());

    res.status(201).json(populatedMessage);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};
