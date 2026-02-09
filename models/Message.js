const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderType: { type: String, enum: ['client', 'business'], required: true },
  content: { type: String, required: true },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

// Ensure dates are returned in ISO format
messageSchema.set('toJSON', {
  transform: function(doc, ret) {
    if (ret.createdAt) ret.createdAt = ret.createdAt.toISOString();
    if (ret.updatedAt) ret.updatedAt = ret.updatedAt.toISOString();
    return ret;
  }
});

module.exports = mongoose.model('Message', messageSchema);
