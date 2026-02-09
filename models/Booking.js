const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
  notes: { type: String },
}, { timestamps: true });

// Ensure dates are returned in ISO format
bookingSchema.set('toJSON', {
  transform: function(doc, ret) {
    if (ret.date) ret.date = ret.date.toISOString();
    if (ret.createdAt) ret.createdAt = ret.createdAt.toISOString();
    if (ret.updatedAt) ret.updatedAt = ret.updatedAt.toISOString();
    return ret;
  }
});

module.exports = mongoose.model('Booking', bookingSchema);
