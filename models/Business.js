const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: { type: String },
  category: { type: String },
  address: { type: String },
  phone: { type: String },
  email: { type: String },
  workingHours: { type: String },
  slotDuration: { type: Number, default: 30 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Ensure dates are returned in ISO format
businessSchema.set('toJSON', {
  transform: function(doc, ret) {
    if (ret.createdAt) ret.createdAt = ret.createdAt.toISOString();
    if (ret.updatedAt) ret.updatedAt = ret.updatedAt.toISOString();
    return ret;
  }
});

module.exports = mongoose.model('Business', businessSchema);
