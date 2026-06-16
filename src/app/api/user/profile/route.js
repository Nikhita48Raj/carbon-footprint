import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { calculateBaseline } from '@/lib/calculator';

// PATCH /api/user/profile  — saves onboarding data and computes carbon baseline
export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      location,
      country,
      householdSize,
      diet,
      transportMode,
      energySource,
    } = body;

    const profileUpdate = {
      'profile.onboardingComplete': true,
      ...(location      != null && { 'profile.location':      location      }),
      ...(country       != null && { 'profile.country':       country       }),
      ...(householdSize != null && { 'profile.householdSize': Number(householdSize) }),
      ...(diet          != null && { 'profile.diet':          diet          }),
      ...(transportMode != null && { 'profile.transportMode': transportMode }),
      ...(energySource  != null && { 'profile.energySource':  energySource  }),
    };

    // Compute baseline from updated profile
    const profileForBaseline = {
      householdSize: Number(householdSize) || 1,
      diet:          diet          || 'avg_meat',
      transportMode: transportMode || 'car_petrol',
      energySource:  energySource  || 'grid',
    };
    const annualKgCO2e = calculateBaseline(profileForBaseline);

    profileUpdate['baseline.annualKgCO2e'] = annualKgCO2e;
    profileUpdate['baseline.calculatedAt'] = new Date();

    await connectDB();

    const user = await User.findByIdAndUpdate(
      session.user.id,
      { $set: profileUpdate },
      { new: true, runValidators: true }
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Profile saved',
      baseline: { annualKgCO2e, calculatedAt: profileUpdate['baseline.calculatedAt'] },
    }, { status: 200 });

  } catch (error) {
    console.error('[PROFILE PATCH ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/user/profile  — return current user's profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.user.id);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({
      profile:      user.profile,
      baseline:     user.baseline,
      gamification: user.gamification,
    });
  } catch (error) {
    console.error('[PROFILE GET ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
