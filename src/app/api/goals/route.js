import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/db';
import Goal from '@/models/Goal';

// GET /api/goals  — return all goals for the current user
export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const goals = await Goal.find({ userId: session.user.id }).sort({ createdAt: -1 });
    return NextResponse.json({ goals }, { status: 200 });
  } catch (error) {
    console.error('[GOALS GET ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/goals  — create a new goal
export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, type, category, targetValue, targetUnit, period, endDate } = body;

    if (!title || !type || !targetValue || !targetUnit || !endDate) {
      return NextResponse.json(
        { error: 'title, type, targetValue, targetUnit, and endDate are required' },
        { status: 400 }
      );
    }

    await connectDB();

    const goal = await Goal.create({
      userId: session.user.id,
      title,
      description,
      type,
      category: category ?? 'overall',
      targetValue,
      targetUnit,
      period: period ?? 'monthly',
      endDate: new Date(endDate),
      milestones: [
        { at: 25, label: 'Quarter way there! 🌱' },
        { at: 50, label: 'Halfway to your goal! 🌿' },
        { at: 75, label: 'Three quarters done! 🌳' },
        { at: 100, label: 'Goal Achieved! 🏆' },
      ],
    });

    return NextResponse.json({ goal }, { status: 201 });
  } catch (error) {
    console.error('[GOALS POST ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
