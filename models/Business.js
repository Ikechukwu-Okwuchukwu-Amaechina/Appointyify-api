const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: { type: String },
  category: { type: String },
  address: { type: String },
  phone: { type: String },
  email: { type: String },
  // workingHours can be stored as:
  //   per-day object: { monday: { open:'09:00', close:'17:00', enabled:true }, ... }
  //   legacy string:  '09:00-17:00'
  workingHours: { type: mongoose.Schema.Types.Mixed },
  slotDuration: { type: Number, default: 30 },
  minPrice: { type: Number },
  maxPrice: { type: Number },
  priceRange: { type: String },
  images: [
    {
      url: { type: String },
      publicId: { type: String },
    }
  ],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Ensure dates are returned in ISO format and strip internal fields
businessSchema.set('toJSON', {
  transform: function(doc, ret) {
    if (ret.createdAt) ret.createdAt = ret.createdAt.toISOString();
    if (ret.updatedAt) ret.updatedAt = ret.updatedAt.toISOString();
    
    // Changing _id to id and stripping internals!
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Business', businessSchema);
