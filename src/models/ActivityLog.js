import mongoose from 'mongoose';

const ActivityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // ─── Activity Classification ──────────────────────────────
    category: {
      type: String,
      required: true,
      enum: ['transport', 'energy', 'food', 'shopping', 'waste'],
    },
    subType: {
      type: String,
      required: true,
      // e.g. 'car_petrol', 'electricity_grid', 'meal_vegetarian', 'clothing_new', 'general_waste_kg'
    },

    // ─── Input Value ─────────────────────────────────────────
    amount: {
      type: Number,
      required: true,
      // km for transport, kWh for energy, number of meals for food, units for shopping, kg for waste
    },
    unit: {
      type: String,
      required: true,
      enum: ['km', 'kWh', 'litres', 'meals', 'kg', 'units'],
    },

    // ─── Calculated Emission ──────────────────────────────────
    co2e: {
      type: Number,
      required: true,
      // kg CO₂e — computed by calculator.js on the server before saving
    },

    // ─── Metadata ────────────────────────────────────────────
    loggedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    notes: {
      type: String,
      maxLength: 500,
    },
    source: {
      type: String,
      enum: ['manual', 'smart_home', 'ocr', 'gps'],
      default: 'manual',
    },
  },
  { timestamps: true }
);

// Compound index to efficiently query a user's logs over a date range
ActivityLogSchema.index({ userId: 1, loggedAt: -1 });

import { MockActivityLog } from '@/lib/dbMock';
export default process.env.MONGODB_URI 
  ? (mongoose.models.ActivityLog || mongoose.model('ActivityLog', ActivityLogSchema))
  : MockActivityLog;
