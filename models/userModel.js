const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto')

const userRolesEnum = require('../constants/userRolesEnum');

const userSchema = new mongoose.Schema(
  {
  password: {
    type: String,
      required: [true, 'Password is required'],
    select: false,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: [true, 'Duplicated email...'],
  },
  subscription: {
    type: String,
    enum: ['starter', 'pro', 'bussines'],
    default: 'starter',
  },
  token: {
    type: String,
    default: null,
    },
  avatarURL: {
      type: String
    },
    passwordResetToken: String,
  
    passwordResetExpires: Date,
    verify: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      required: [true, "Verify token is required"],
    },
},
  {
    timestamps: true,
    versionKey: false,
  }
)

// Pre save hook. Fires on Create and Save.
userSchema.pre('save', async function(next) {
  if (this.isNew) {
    const emailHash = crypto.createHash('md5').update(this.email).digest('hex');
    this.avatarURL = `https://www.gravatar.com/avatar/${emailHash}.jpg?d=robohash`;
  }

  if (!this.isModified('password')) return next();

  // hash passwd only when passwd changed
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

  next();
});

// Custom method
userSchema.methods.checkPassword = (candidate, hash) => bcrypt.compare(candidate, hash);
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
}

const User = mongoose.model('User', userSchema);

module.exports = {User};