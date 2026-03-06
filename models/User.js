const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  role: { type: String, enum: ['user', 'business', 'admin'], default: 'user' },
  companyName: { type: String },
  profileImage: { type: String },
  profileImagePublicId: { type: String },
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date },
  // Keeping track of old passwords so you don't use them again!
  passwordHistory: [{ type: String }],
  // OTP for MFA!
  otp: { type: String },
  otpExpire: { type: Date }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Ensure dates are returned in ISO format
userSchema.set('toJSON', {
  transform: function(doc, ret) {
    if (ret.createdAt) ret.createdAt = ret.createdAt.toISOString();
    if (ret.updatedAt) ret.updatedAt = ret.updatedAt.toISOString();
    delete ret.password;
    delete ret.passwordHistory;
    delete ret.otp;
    delete ret.otpExpire;
    
    // Changing _id to id and stripping internals like a pro! 
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);
