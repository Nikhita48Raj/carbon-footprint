import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/db';
import ActivityLog from '@/models/ActivityLog';
import User from '@/models/User';
import Goal from '@/models/Goal';
import { computeActivityEmission, calculateCategoryBaseline } from '@/lib/calculator';

// GET /api/activities?period=month  — fetch logs for the current user
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') ?? 'month';

    const now = new Date();
    let startDate = new Date();
    if (period === 'week')  startDate.setDate(now.getDate() - 7);
    if (period === 'month') startDate.setMonth(now.getMonth() - 1);
    if (period === 'year')  startDate.setFullYear(now.getFullYear() - 1);

    await connectDB();

    const activities = await ActivityLog.find({
      userId:   session.user.id,
      loggedAt: { $gte: startDate },
    }).sort({ loggedAt: -1 });

    return NextResponse.json({ activities }, { status: 200 });
  } catch (error) {
    console.error('[ACTIVITIES GET ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/activities  — log a new activity
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { category, subType, amount, unit, notes, source } = body;

    if (!category || !subType || amount == null || !unit) {
      return NextResponse.json(
        { error: 'category, subType, amount, and unit are required' },
        { status: 400 }
      );
    }

    if (Number(amount) <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than zero' },
        { status: 400 }
      );
    }

    // Calculate real CO₂e using the scientific calculation engine
    const co2e = computeActivityEmission({ category, subType, amount });

    await connectDB();

    const activity = await ActivityLog.create({
      userId: session.user.id,
      category,
      subType,
      amount,
      unit,
      co2e,
      notes,
      source: source ?? 'manual',
    });

    // --- Dynamic Goal and Streak Calculation ---
    const user = await User.findById(session.user.id);
    if (user) {
      const activeGoals = await Goal.find({
        userId: session.user.id,
        status: 'active',
      });

      for (const goal of activeGoals) {
        // Calculate actual emissions for this goal's period
        const query = {
          userId: session.user.id,
          loggedAt: { $gte: goal.startDate, $lte: goal.endDate },
        };
        if (goal.category !== 'overall') {
          query.category = goal.category;
        }

        const logs = await ActivityLog.find(query);
        const actualEmissions = logs.reduce((sum, act) => sum + (act.co2e || 0), 0);

        if (goal.type === 'category_limit') {
          goal.currentValue = Math.round(actualEmissions * 100) / 100;
          if (goal.currentValue > goal.targetValue) {
            goal.status = 'failed';
          }
        } else if (goal.type === 'reduction_percentage') {
          // Calculate baseline for the goal's duration
          const days = Math.max(
            1,
            Math.ceil((goal.endDate.getTime() - goal.startDate.getTime()) / (1000 * 60 * 60 * 24))
          );
          const annualCategoryBaseline = calculateCategoryBaseline(user.profile, goal.category);
          const periodBaseline = (annualCategoryBaseline / 365) * days;

          const savings = periodBaseline - actualEmissions;
          const reductionPct = periodBaseline > 0 ? (savings / periodBaseline) * 100 : 0;

          goal.currentValue = Math.round(Math.max(0, reductionPct) * 100) / 100;
          if (goal.currentValue >= goal.targetValue) {
            goal.status = 'completed';
            goal.completedAt = new Date();
          }
        } else if (goal.type === 'streak') {
          // Streak is consecutive days logged
          const allUserLogs = await ActivityLog.find({ userId: session.user.id }).sort({ loggedAt: -1 });
          let streak = 0;
          if (allUserLogs.length > 0) {
            const uniqueDayStrings = Array.from(
              new Set(allUserLogs.map(l => new Date(l.loggedAt).toDateString()))
            );
            const uniqueDays = uniqueDayStrings.map(d => new Date(d));

            let current = new Date();
            current.setHours(0, 0, 0, 0);

            const latestLogDate = new Date(uniqueDays[0]);
            latestLogDate.setHours(0, 0, 0, 0);

            const diffMs = current.getTime() - latestLogDate.getTime();
            const diffDays = diffMs / (1000 * 60 * 60 * 24);

            if (diffDays <= 1) {
              let lastDate = latestLogDate;
              streak = 1;
              for (let i = 1; i < uniqueDays.length; i++) {
                const prevDate = new Date(uniqueDays[i]);
                prevDate.setHours(0, 0, 0, 0);
                const dayDiff = (lastDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
                if (dayDiff === 1) {
                  streak++;
                  lastDate = prevDate;
                } else {
                  break;
                }
              }
            }
          }
          goal.currentValue = streak;

          user.gamification.streakDays = streak;
          await user.save();

          if (goal.currentValue >= goal.targetValue) {
            goal.status = 'completed';
            goal.completedAt = new Date();
          }
        }

        // Check milestones
        if (goal.targetValue > 0) {
          const pct = (goal.currentValue / goal.targetValue) * 100;
          goal.milestones.forEach(m => {
            if (!m.reached && pct >= m.at) {
              m.reached = true;
              m.reachedAt = new Date();
            }
          });
        }

        await goal.save();
      }
    }

    return NextResponse.json({ activity, co2e }, { status: 201 });
  } catch (error) {
    console.error('[ACTIVITIES POST ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
