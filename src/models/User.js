import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxLength: [80, 'Name cannot exceed 80 characters'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minLength: [8, 'Password must be at least 8 characters'],
      select: false,
    },

    profile: {
      location: {
        type: String,
        default: '',
      },

      country: {
        type: String,
        default: '',
      },

      householdSize: {
        type: Number,
        default: 1,
      },

      diet: {
        type: String,
        enum: [
          'high_meat',
          'avg_meat',
          'pescatarian',
          'vegetarian',
          'vegan',
        ],
        default: 'avg_meat',
      },

      transportMode: {
        type: String,
        default: 'car_petrol',
      },

      energySource: {
        type: String,
        enum: ['grid', 'solar', 'wind', 'mixed'],
        default: 'grid',
      },

      onboardingComplete: {
        type: Boolean,
        default: false,
      },
    },

    baseline: {
      annualKgCO2e: {
        type: Number,
        default: 0,
      },

      calculatedAt: {
        type: Date,
      },
    },

    gamification: {
      level: {
        type: Number,
        default: 1,
      },

      streakDays: {
        type: Number,
        default: 0,
      },

      lastLogDate: {
        type: Date,
      },

      badges: {
        type: [String],
        default: [],
      },

      totalPoints: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Hash password before saving
 * IMPORTANT:
 * Do NOT use next() inside async middleware.
 */
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 12);
});

/**
 * Compare password during login
 */
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User =
  mongoose.models.User || mongoose.model('User', UserSchema);

import { MockUser } from '@/lib/dbMock';

export default process.env.MONGODB_URI ? User : MockUser;