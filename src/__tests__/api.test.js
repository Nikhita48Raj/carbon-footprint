import { GET as getActivities, POST as postActivities } from '@/app/api/activities/route';
import { GET as getProfile, PATCH as patchProfile } from '@/app/api/user/profile/route';
import { GET as getGoals, POST as postGoals } from '@/app/api/goals/route';
import { POST as postCoach } from '@/app/api/coach/route';

import { getServerSession } from 'next-auth/next';
import User from '@/models/User';
import ActivityLog from '@/models/ActivityLog';
import Goal from '@/models/Goal';
import { getGridCarbonIntensity } from '@/lib/gridFactors';

// Mock NextAuth
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

// Mock Database Models
jest.mock('@/models/User', () => ({
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findOne: jest.fn(),
}));

jest.mock('@/models/ActivityLog', () => ({
  find: jest.fn(),
  create: jest.fn(),
}));

jest.mock('@/models/Goal', () => ({
  find: jest.fn(),
  create: jest.fn(),
}));

// Mock Grid API Lookup
jest.mock('@/lib/gridFactors', () => ({
  getGridCarbonIntensity: jest.fn(),
  getGridFactors: jest.fn(),
}));

describe('EcoTrack API Routes Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('/api/activities API Route', () => {
    test('GET - returns 401 when unauthorized', async () => {
      getServerSession.mockResolvedValue(null);

      const request = new Request('http://localhost/api/activities');
      const response = await getActivities(request);

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.error).toBe('Unauthorized');
    });

    test('GET - returns user activities when authorized', async () => {
      getServerSession.mockResolvedValue({ user: { id: 'user-1' } });
      const mockLogs = [
        { _id: 'log-1', category: 'transport', subType: 'train', amount: 10, unit: 'km', co2e: 0.3549 }
      ];
      ActivityLog.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockLogs)
      });

      const request = new Request('http://localhost/api/activities?period=week');
      const response = await getActivities(request);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.activities).toEqual(mockLogs);
    });

    test('POST - returns 400 when missing fields', async () => {
      getServerSession.mockResolvedValue({ user: { id: 'user-1' } });

      const request = new Request('http://localhost/api/activities', {
        method: 'POST',
        body: JSON.stringify({ category: 'transport' }),
      });
      const response = await postActivities(request);

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toContain('required');
    });

    test('POST - validates invalid numeric amounts', async () => {
      getServerSession.mockResolvedValue({ user: { id: 'user-1' } });

      const request = new Request('http://localhost/api/activities', {
        method: 'POST',
        body: JSON.stringify({ category: 'transport', subType: 'train', amount: -5, unit: 'km' }),
      });
      const response = await postActivities(request);

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toBe('Amount must be a positive number under 100,000');
    });

    test('POST - logs activity and calculates dynamic goals updates', async () => {
      getServerSession.mockResolvedValue({ user: { id: 'user-1' } });
      User.findById.mockResolvedValue({
        _id: 'user-1',
        profile: { diet: 'avg_meat', transportMode: 'car_petrol', energySource: 'grid' },
        gamification: { streakDays: 2 }
      });
      ActivityLog.create.mockResolvedValue({
        _id: 'log-2',
        category: 'transport',
        subType: 'car_petrol',
        amount: 20,
        unit: 'km',
        co2e: 3.4098,
      });

      const mockGoalSave = jest.fn();
      const mockGoal = {
        _id: 'goal-1',
        type: 'category_limit',
        category: 'transport',
        targetValue: 50,
        startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        currentValue: 10,
        milestones: [],
        save: mockGoalSave
      };
      Goal.find.mockResolvedValue([mockGoal]);
      ActivityLog.find.mockResolvedValue([
        { category: 'transport', co2e: 3.4098, loggedAt: new Date() }
      ]);

      const request = new Request('http://localhost/api/activities', {
        method: 'POST',
        body: JSON.stringify({ category: 'transport', subType: 'car_petrol', amount: 20, unit: 'km', notes: '<script>alert()</script>' }),
      });
      const response = await postActivities(request);

      expect(response.status).toBe(201);
      const json = await response.json();
      expect(json.activity.co2e).toBeDefined();
      expect(mockGoalSave).toHaveBeenCalled();
    });
  });

  describe('/api/user/profile API Route', () => {
    test('GET - returns user profile context', async () => {
      getServerSession.mockResolvedValue({ user: { id: 'user-1' } });
      const mockUser = {
        profile: { location: 'London', country: 'UK', householdSize: 2 },
        baseline: { annualKgCO2e: 4800 },
        gamification: { level: 2 }
      };
      User.findById.mockResolvedValue(mockUser);

      const response = await getProfile();
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.profile).toEqual(mockUser.profile);
    });

    test('PATCH - validates input profiles and computes new baseline', async () => {
      getServerSession.mockResolvedValue({ user: { id: 'user-1' } });
      User.findByIdAndUpdate.mockResolvedValue({
        _id: 'user-1',
        profile: { location: 'Paris', country: 'France', householdSize: 1, diet: 'vegan' }
      });

      const request = new Request('http://localhost/api/user/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          location: 'Paris',
          country: 'France',
          householdSize: 1,
          diet: 'vegan',
          transportMode: 'cycling',
          energySource: 'solar'
        }),
      });

      const response = await patchProfile(request);
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.baseline.annualKgCO2e).toBeGreaterThan(0);
    });

    test('PATCH - rejects invalid selections', async () => {
      getServerSession.mockResolvedValue({ user: { id: 'user-1' } });

      const request = new Request('http://localhost/api/user/profile', {
        method: 'PATCH',
        body: JSON.stringify({ diet: 'junk_food' }),
      });

      const response = await patchProfile(request);
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toBe('Invalid diet selection');
    });
  });

  describe('/api/goals API Route', () => {
    test('GET - returns active and completed goals', async () => {
      getServerSession.mockResolvedValue({ user: { id: 'user-1' } });
      const mockGoalsList = [{ title: 'Walk more', type: 'streak' }];
      Goal.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockGoalsList)
      });

      const response = await getGoals();
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.goals).toEqual(mockGoalsList);
    });

    test('POST - creates a new target goal with default milestones', async () => {
      getServerSession.mockResolvedValue({ user: { id: 'user-1' } });
      Goal.create.mockImplementation((data) => Promise.resolve({ _id: 'goal-new', ...data }));

      const request = new Request('http://localhost/api/goals', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Solar panels reduction',
          type: 'reduction_percentage',
          targetValue: 15,
          targetUnit: 'percent',
          endDate: '2026-12-31'
        }),
      });

      const response = await postGoals(request);
      expect(response.status).toBe(201);
      const json = await response.json();
      expect(json.goal.title).toBe('Solar panels reduction');
      expect(json.goal.milestones).toHaveLength(4);
    });
  });

  describe('/api/coach AI Advisor Route', () => {
    test('POST - returns AI advice or dynamic rule response', async () => {
      getServerSession.mockResolvedValue({ user: { id: 'user-1' } });
      User.findById.mockResolvedValue({
        name: 'Alex',
        profile: { diet: 'avg_meat', transportMode: 'car_petrol', energySource: 'grid' },
        baseline: { annualKgCO2e: 5000 }
      });
      ActivityLog.find.mockResolvedValue([]);
      getGridCarbonIntensity.mockResolvedValue({ intensity: 0.2331, status: 'moderate', source: 'fallback' });

      const request = new Request('http://localhost/api/coach', {
        method: 'POST',
        body: JSON.stringify({ message: 'How do I optimize my diet?' }),
        headers: { 'x-forwarded-for': '127.0.0.1' }
      });

      const response = await postCoach(request);
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.text).toContain('diet');
    });

    test('POST - generates weekly actions plan', async () => {
      getServerSession.mockResolvedValue({ user: { id: 'user-1' } });
      User.findById.mockResolvedValue({
        name: 'Alex',
        profile: { diet: 'high_meat', transportMode: 'car_petrol', energySource: 'grid' },
        baseline: { annualKgCO2e: 6000 }
      });
      ActivityLog.find.mockResolvedValue([
        { category: 'transport', co2e: 15.0, loggedAt: new Date() }
      ]);
      getGridCarbonIntensity.mockResolvedValue({ intensity: 0.18, status: 'low', source: 'fallback' });

      const request = new Request('http://localhost/api/coach', {
        method: 'POST',
        body: JSON.stringify({ action: 'generateWeeklyPlan' }),
        headers: { 'x-forwarded-for': '127.0.0.1' }
      });

      const response = await postCoach(request);
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.text).toContain('Weekly Action Plan');
      expect(json.text).toContain('Transport');
    });
  });
});
