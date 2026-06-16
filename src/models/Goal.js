import mongoose from 'mongoose';

const GoalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: [true, 'Goal title is required'],
      trim: true,
      maxLength: 120,
    },
    description: {
      type: String,
      maxLength: 500,
    },

    // ─── Goal Type ────────────────────────────────────────────
    type: {
      type: String,
      enum: ['reduction_percentage', 'category_limit', 'streak', 'offset'],
      required: true,
    },
    category: {
      type: String,
      enum: ['transport', 'energy', 'food', 'shopping', 'waste', 'overall'],
      default: 'overall',
    },

    // ─── Targets ─────────────────────────────────────────────
    targetValue: {
      type: Number,
      required: true,
      // e.g. 10 (for 10% reduction) or 50 (for 50 kg limit)
    },
    targetUnit: {
      type: String,
      enum: ['percent', 'kg_co2e', 'days'],
      required: true,
    },
    period: {
      type: String,
      enum: ['weekly', 'monthly', 'annual'],
      default: 'monthly',
    },

    // ─── Progress ────────────────────────────────────────────
    currentValue: {
      type: Number,
      default: 0,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },

    // ─── Status ──────────────────────────────────────────────
    status: {
      type: String,
      enum: ['active', 'completed', 'failed', 'paused'],
      default: 'active',
    },
    completedAt: {
      type: Date,
    },

    // ─── Milestones ──────────────────────────────────────────
    milestones: [
      {
        at: Number,       // e.g. 25, 50, 75 (percent)
        label: String,    // e.g. "Quarter way there!"
        reached: Boolean,
        reachedAt: Date,
      },
    ],
  },
  { timestamps: true }
);

import { MockGoal } from '@/lib/dbMock';
export default process.env.MONGODB_URI 
  ? (mongoose.models.Goal || mongoose.model('Goal', GoalSchema))
  : MockGoal;
