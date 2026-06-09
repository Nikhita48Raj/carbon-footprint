import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/db';
import ActivityLog from '@/models/ActivityLog';
import { computeActivityEmission } from '@/lib/calculator';

// GET /api/activities?period=month  — fetch logs for the current user
export async function GET(request) {
  try {
    const session = await getServerSession();
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
    const session = await getServerSession();
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

    return NextResponse.json({ activity, co2e }, { status: 201 });
  } catch (error) {
    console.error('[ACTIVITIES POST ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
