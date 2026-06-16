import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/db';
import ActivityLog from '@/models/ActivityLog';
import User from '@/models/User';
import { buildCategorySummary, annualise, getRealtimeTickRate } from '@/lib/calculator';
import { GLOBAL_AVERAGES } from '@/lib/emissionFactors';

// GET /api/dashboard/summary  — returns all data needed to populate the dashboard
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(session.user.id);

    // ── Current Month ────────────────────────────────────────
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const monthActivities = await ActivityLog.find({
      userId: session.user.id,
      loggedAt: { $gte: monthStart },
    });

    const monthlySummary = buildCategorySummary(monthActivities);

    // ── Previous Month (for trend comparison) ────────────────
    const prevMonthStart = new Date(monthStart);
    prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);
    const prevMonthEnd = new Date(monthStart);

    const prevMonthActivities = await ActivityLog.find({
      userId: session.user.id,
      loggedAt: { $gte: prevMonthStart, $lt: prevMonthEnd },
    });

    const prevMonthlySummary = buildCategorySummary(prevMonthActivities);

    const monthChange =
      prevMonthlySummary.total > 0
        ? ((monthlySummary.total - prevMonthlySummary.total) / prevMonthlySummary.total) * 100
        : 0;

    // ── 6-Month Trend ─────────────────────────────────────────
    const trend = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date();
      start.setMonth(start.getMonth() - i);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);

      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);

      const activities = await ActivityLog.find({
        userId: session.user.id,
        loggedAt: { $gte: start, $lt: end },
      });

      const summary = buildCategorySummary(activities);
      trend.push({
        label: start.toLocaleString('default', { month: 'short' }),
        total: summary.total,
      });
    }

    // ── Annual Projection & Real-Time Meter ───────────────────
    let earliestDate = monthStart;
    if (monthActivities.length > 0) {
      earliestDate = monthActivities.reduce((minDate, act) => {
        const d = new Date(act.loggedAt);
        return d < minDate ? d : minDate;
      }, new Date(monthActivities[0].loggedAt));
    }
    const annualProjection = annualise(monthlySummary.total, earliestDate);
    const tickRate = getRealtimeTickRate(
      user.baseline.annualKgCO2e || annualProjection
    );

    // ── Global Benchmarking ───────────────────────────────────
    const benchmarks = {
      world: GLOBAL_AVERAGES.world * 1000,    // convert to kg
      target: GLOBAL_AVERAGES.target * 1000,
    };

    return NextResponse.json({
      monthlySummary,
      prevMonthlySummary,
      monthChange: parseFloat(monthChange.toFixed(2)),
      trend,
      annualProjection,
      tickRate,
      benchmarks,
      user: {
        name: user.name,
        gamification: user.gamification,
        baseline: user.baseline,
      },
    });
  } catch (error) {
    console.error('[DASHBOARD SUMMARY ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
