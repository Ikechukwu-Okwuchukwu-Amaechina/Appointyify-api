const Message = require('../models/Message');
const Booking = require('../models/Booking');
const Business = require('../models/Business');

// Get messages for a specific booking
exports.getBookingMessages = async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    // Verify booking exists
    const booking = await Booking.findById(bookingId).populate('business');
    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found' });
    }
    
    // Verify user is authorized (either client or business owner)
    const isClient = String(booking.user) === String(req.user._id);
    const isBusiness = String(booking.business.owner) === String(req.user._id);
    
    if (!isClient && !isBusiness && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Unauthorized' });
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
    const { messageIds } = req.body;
    
    if (!messageIds || !Array.isArray(messageIds)) {
      return res.status(400).json({ msg: 'messageIds array is required' });
    }
    
    await Message.updateMany(
      { _id: { $in: messageIds } },
      { isRead: true }
    );
    
    res.json({ msg: 'Messages marked as read', count: messageIds.length });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};
