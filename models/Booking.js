const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  // for single-date bookings use `date`; for recurring bookings use `days` + `recurring`
  date: { type: Date },
  days: [{ type: String }],
  recurring: { type: Boolean, default: false },
  startTime: { type: String },
  endTime: { type: String },
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
  notes: { type: String },
}, { timestamps: true });

// Ensure dates are returned in ISO format and strip internal fields
bookingSchema.set('toJSON', {
  transform: function(doc, ret) {
    if (ret.date) ret.date = ret.date.toISOString();
    if (ret.createdAt) ret.createdAt = ret.createdAt.toISOString();
    if (ret.updatedAt) ret.updatedAt = ret.updatedAt.toISOString();
    
    // Changing _id to id and stripping internals!
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Booking', bookingSchema);
