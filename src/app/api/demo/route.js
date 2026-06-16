import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import ActivityLog from '@/models/ActivityLog';
import Goal from '@/models/Goal';
import { calculateBaseline } from '@/lib/calculator';

export async function POST(request) {
  try {
    await connectDB();

    const email = 'demo@ecotrack.org';

    // 1. Delete existing demo entries
    let user = await User.findOne({ email });
    let userId;

    if (user) {
      userId = user._id;
      // Clear logs and goals for this user
      await ActivityLog.deleteMany({ userId });
      await Goal.deleteMany({ userId });
    } else {
      // Create new user (using create will auto-hash password via schema)
      const newUser = await User.create({
        name: 'Demo User',
        email,
        password: 'password123', // Minimum 8 characters
      });
      userId = newUser._id;
      user = newUser;
    }

    // 2. Set Profile
    user.profile = {
      location: 'London',
      country: 'United Kingdom',
      householdSize: 2,
      diet: 'avg_meat',
      transportMode: 'car_hybrid',
      energySource: 'mixed',
      onboardingComplete: true,
    };

    // Calculate baseline
    user.baseline = {
      annualKgCO2e: calculateBaseline(user.profile),
      calculatedAt: new Date(),
    };

    // Gamification
    user.gamification = {
      level: 3,
      streakDays: 5,
      totalPoints: 1250,
      badges: ['First Step', 'Green Energy', 'Commute Hero'],
    };

    await user.save();

    // 3. Seed Activities (Spread over the last 30 days)
    const now = new Date();
    const mockActivities = [
      { category: 'transport', subType: 'train', amount: 45, unit: 'km', co2e: 1.6, notes: 'Commute to office' },
      { category: 'transport', subType: 'car_hybrid', amount: 20, unit: 'km', co2e: 2.1, notes: 'Grocery shopping' },
      { category: 'energy', subType: 'electricity_grid', amount: 12, unit: 'kWh', co2e: 2.8, notes: 'Daily home run' },
      { category: 'food', subType: 'meal_avg_meat', amount: 2, unit: 'meals', co2e: 5.0, notes: 'Lunch and dinner' },
      { category: 'food', subType: 'meal_vegan', amount: 1, unit: 'meals', co2e: 0.5, notes: 'Breakfast toast' },
      { category: 'waste', subType: 'general_waste_kg', amount: 4.5, unit: 'kg', co2e: 2.6, notes: 'Weekly bin empty' },
      { category: 'waste', subType: 'recycled_kg', amount: 3.0, unit: 'kg', co2e: -0.63, notes: 'Sorted plastics/glass' },
      { category: 'shopping', subType: 'clothing_sustainable', amount: 1, unit: 'units', co2e: 5.0, notes: 'Thrift shop jacket' },
      { category: 'transport', subType: 'bus', amount: 8, unit: 'km', co2e: 0.7, notes: 'Evening trip' },
      { category: 'food', subType: 'meal_vegetarian', amount: 1, unit: 'meals', co2e: 0.8, notes: 'Vegetarian dinner' },
    ];

    for (let i = 0; i < 15; i++) {
      const template = mockActivities[i % mockActivities.length];
      const logDate = new Date();
      logDate.setDate(now.getDate() - i * 2); // Spread logs 2 days apart

      await ActivityLog.create({
        userId,
        category: template.category,
        subType: template.subType,
        amount: template.amount,
        unit: template.unit,
        co2e: template.co2e,
        notes: template.notes,
        loggedAt: logDate,
        createdAt: logDate,
        updatedAt: logDate,
      });
    }

    // 4. Seed Goals
    // Completed Goal
    await Goal.create({
      userId,
      title: 'Ditch the Petrol Car',
      description: 'Use trains or buses for commutes this week',
      type: 'reduction_percentage',
      category: 'transport',
      targetValue: 20,
      targetUnit: '%',
      currentValue: 25,
      status: 'completed',
      startDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      completedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
      milestones: [
        { at: 25, label: 'Started strong! 🌱', reached: true, reachedAt: new Date() },
        { at: 100, label: 'Goal Achieved! 🏆', reached: true, reachedAt: new Date() }
      ]
    });

    // Active Goal
    await Goal.create({
      userId,
      title: 'Low Carbon Energy Week',
      description: 'Limit grid electricity consumption',
      type: 'category_limit',
      category: 'energy',
      targetValue: 50,
      targetUnit: 'kWh',
      currentValue: 12,
      status: 'active',
      startDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      milestones: [
        { at: 25, label: 'Started strong! 🌱', reached: true, reachedAt: new Date() },
        { at: 100, label: 'Goal Achieved! 🏆', reached: false }
      ]
    });

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully for Demo mode. Log in using demo@ecotrack.org / password123',
    });

  } catch (error) {
    console.error('[DEMO SEED ERROR]', error);
    return NextResponse.json({ error: 'Internal server error seeding database' }, { status: 500 });
  }
}
