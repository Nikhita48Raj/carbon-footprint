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
      select: false, // never returned by default in queries
    },

    // ─── Profile Data (collected during onboarding) ──────────
    profile: {
      location:      { type: String, default: '' },
      country:       { type: String, default: '' },
      householdSize: { type: Number, default: 1 },
      diet:          { type: String, enum: ['high_meat', 'avg_meat', 'pescatarian', 'vegetarian', 'vegan'], default: 'avg_meat' },
      transportMode: { type: String, default: 'car_petrol' },
      energySource:  { type: String, enum: ['grid', 'solar', 'wind', 'mixed'], default: 'grid' },
      onboardingComplete: { type: Boolean, default: false },
    },

    // ─── Carbon Baseline (generated post-onboarding) ─────────
    baseline: {
      annualKgCO2e:  { type: Number, default: 0 }, // calculated from onboarding answers
      calculatedAt:  { type: Date },
    },

    // ─── Gamification ────────────────────────────────────────
    gamification: {
      level:         { type: Number, default: 1 },
      streakDays:    { type: Number, default: 0 },
      lastLogDate:   { type: Date },
      badges:        { type: [String], default: [] },
      totalPoints:   { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.models.User || mongoose.model('User', UserSchema);
