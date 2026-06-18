/**
 * @jest-environment node
 */
import { GET as getActivities, POST as postActivities } from '@/app/api/activities/route';
import { GET as getProfile, PATCH as patchProfile } from '@/app/api/user/profile/route';
import { GET as getGoals, POST as postGoals } from '@/app/api/goals/route';
import { POST as postCoach } from '@/app/api/coach/route';

import { getServerSession } from 'next-auth/next';
import User from '@/models/User';
import ActivityLog from '@/models/ActivityLog';
import Goal from '@/models/Goal';
import { getGridCarbonIntensity } from '@/lib/gridFactors';
import { rateLimit } from '@/lib/rateLimiter';

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
  getGridFactors: jest.fn(() => ({ electricity: 0.23314, transitCarFactor: 1.0 })),
}));

// Mock Rate Limiter
jest.mock('@/lib/rateLimiter', () => ({
  rateLimit: jest.fn(() => true),
}));

describe('EcoTrack API Routes Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    rateLimit.mockReturnValue(true);
    // Mock global fetch to return ok: false by default to force coach route to fall back to Rule Engine
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Mocked error' })
    });
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

    test('GET - returns user activities when authorized (week period)', async () => {
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

    test('GET - returns user activities when authorized (year period)', async () => {
      getServerSession.mockResolvedValue({ user: { id: 'user-1' } });
      const mockLogs = [];
      ActivityLog.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockLogs)
      });

      const request = new Request('http://localhost/api/activities?period=year');
      const response = await getActivities(request);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.activities).toEqual(mockLogs);
    });

    test('GET - returns user activities when authorized (default month period)', async () => {
      getServerSession.mockResolvedValue({ user: { id: 'user-1' } });
      const mockLogs = [];
      ActivityLog.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockLogs)
      });

      const request = new Request('http://localhost/api/activities');
      const response = await getActivities(request);

      expect(response.status).toBe(200);
    });

    test('GET - handles database/internal errors gracefully', async () => {
      getServerSession.mockResolvedValue({ user: { id: 'user-1' } });
      ActivityLog.find.mockImplementation(() => {
        throw new Error('DB Connection Failed');
      });

      const request = new Request('http://localhost/api/activities');
      const response = await getActivities(request);

      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json.error).toBe('Internal server error');
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

    test('POST - logs activity and calculates dynamic goals updates (exceeds limit, fails goal)', async () => {
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
        co2e: 300,
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
        milestones: [{ at: 50, reached: false }],
        save: mockGoalSave
      };
      Goal.find.mockResolvedValue([mockGoal]);
      ActivityLog.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([
          { category: 'transport', co2e: 300, loggedAt: new Date() }
        ])
      });

      const request = new Request('http://localhost/api/activities', {
        method: 'POST',
        body: JSON.stringify({ category: 'transport', subType: 'car_petrol', amount: 20, unit: 'km' }),
      });
      const response = await postActivities(request);

      expect(response.status).toBe(201);
      expect(mockGoal.status).toBe('failed');
      expect(mockGoalSave).toHaveBeenCalled();
    });

    test('POST - logs activity and calculates dynamic goals updates (reduction percentage completed & milestone reached)', async () => {
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
        co2e: 1.0,
      });

      const mockGoalSave = jest.fn();
      const mockGoal = {
        _id: 'goal-1',
        type: 'reduction_percentage',
        category: 'transport',
        targetValue: 10,
        startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        currentValue: 0,
        milestones: [{ at: 50, reached: false }],
        save: mockGoalSave
      };
      Goal.find.mockResolvedValue([mockGoal]);
      ActivityLog.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([
          { category: 'transport', co2e: 1.0, loggedAt: new Date() }
        ])
      });

      const request = new Request('http://localhost/api/activities', {
        method: 'POST',
        body: JSON.stringify({ category: 'transport', subType: 'car_petrol', amount: 20, unit: 'km' }),
      });
      const response = await postActivities(request);

      expect(response.status).toBe(201);
      expect(mockGoal.status).toBe('completed');
      expect(mockGoal.milestones[0].reached).toBe(true);
    });

    test('POST - logs activity and calculates dynamic goals updates (streak goal active)', async () => {
      getServerSession.mockResolvedValue({ user: { id: 'user-1' } });
      const mockUserSave = jest.fn();
      const mockUser = {
        _id: 'user-1',
        profile: { diet: 'avg_meat', transportMode: 'car_petrol', energySource: 'grid' },
        gamification: { streakDays: 0 },
        save: mockUserSave
      };
      User.findById.mockResolvedValue(mockUser);
      ActivityLog.create.mockResolvedValue({
        _id: 'log-2',
        category: 'transport',
        subType: 'car_petrol',
        amount: 20,
        unit: 'km',
        co2e: 3.4,
      });

      const mockGoalSave = jest.fn();
      const mockGoal = {
        _id: 'goal-1',
        type: 'streak',
        category: 'overall',
        targetValue: 3,
        startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        currentValue: 0,
        milestones: [],
        save: mockGoalSave
      };
      Goal.find.mockResolvedValue([mockGoal]);

      // Mock logs for consecutive days: today, yesterday, day before
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      const dayBefore = new Date();
      dayBefore.setDate(today.getDate() - 2);

      ActivityLog.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([
          { category: 'transport', co2e: 3.4, loggedAt: today },
          { category: 'transport', co2e: 3.4, loggedAt: yesterday },
          { category: 'transport', co2e: 3.4, loggedAt: dayBefore },
        ])
      });

      const request = new Request('http://localhost/api/activities', {
        method: 'POST',
        body: JSON.stringify({ category: 'transport', subType: 'car_petrol', amount: 20, unit: 'km' }),
      });
      const response = await postActivities(request);

      expect(response.status).toBe(201);
      expect(mockGoal.currentValue).toBe(3);
      expect(mockGoal.status).toBe('completed');
      expect(mockUser.gamification.streakDays).toBe(3);
      expect(mockUserSave).toHaveBeenCalled();
    });

    test('POST - queries live grid carbon intensity for electricity_grid activities', async () => {
      getServerSession.mockResolvedValue({ user: { id: 'user-1' } });
      User.findById.mockResolvedValue({
        _id: 'user-1',
        profile: { country: 'United Kingdom', location: 'London' }
      });
      getGridCarbonIntensity.mockResolvedValue({ intensity: 0.150 });
      ActivityLog.create.mockResolvedValue({
        _id: 'log-3',
        category: 'energy',
        subType: 'electricity_grid',
        amount: 100,
        unit: 'kWh',
        co2e: 15.0
      });
      Goal.find.mockResolvedValue([]);

      const request = new Request('http://localhost/api/activities', {
        method: 'POST',
        body: JSON.stringify({ category: 'energy', subType: 'electricity_grid', amount: 100, unit: 'kWh' }),
      });
      const response = await postActivities(request);

      expect(response.status).toBe(201);
      expect(getGridCarbonIntensity).toHaveBeenCalledWith('United Kingdom', 'London');
    });

    test('POST - queries live grid intensity, handles lookup failures gracefully', async () => {
      getServerSession.mockResolvedValue({ user: { id: 'user-1' } });
      User.findById.mockResolvedValue({
        _id: 'user-1',
        profile: { country: 'United Kingdom', location: 'London' }
      });
      getGridCarbonIntensity.mockRejectedValue(new Error('Network timeout'));
      ActivityLog.create.mockResolvedValue({
        _id: 'log-3',
        category: 'energy',
        subType: 'electricity_grid',
        amount: 100,
        unit: 'kWh',
        co2e: 23.314
      });
      Goal.find.mockResolvedValue([]);

      const request = new Request('http://localhost/api/activities', {
        method: 'POST',
        body: JSON.stringify({ category: 'energy', subType: 'electricity_grid', amount: 100, unit: 'kWh' }),
      });
      const response = await postActivities(request);

      expect(response.status).toBe(201);
      const json = await response.json();
      expect(json.activity.co2e).toBe(23.314);
    });

    test('POST - handles database/internal errors gracefully', async () => {
      getServerSession.mockResolvedValue({ user: { id: 'user-1' } });
      ActivityLog.create.mockRejectedValue(new Error('DB Write Failure'));

      const request = new Request('http://localhost/api/activities', {
        method: 'POST',
        body: JSON.stringify({ category: 'transport', subType: 'train', amount: 10, unit: 'km' }),
      });
      const response = await postActivities(request);

      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json.error).toBe('Internal server error');
    });
  });

  describe('/api/user/profile API Route', () => {
    test('GET - returns 401 when unauthorized', async () => {
      getServerSession.mockResolvedValue(null);
      const response = await getProfile();
      expect(response.status).toBe(401);
    });

    test('GET - returns 404 if user profile is missing', async () => {
      getServerSession.mockResolvedValue({ user: { id: 'user-1' } });
      User.findById.mockResolvedValue(null);

      const response = await getProfile();
      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json.error).toBe('User not found');
    });

    test('GET - returns user profile context when authorized', async () => {
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

    test('GET - handles errors gracefully', async () => {
      getServerSession.mockResolvedValue({ user: { id: 'user-1' } });
      User.findById.mockRejectedValue(new Error('DB Error'));

      const response = await getProfile();
      expect(response.status).toBe(500);
    });

    test('PATCH - returns 401 when unauthorized', async () => {
      getServerSession.mockResolvedValue(null);
      const request = new Request('http://localhost/api/user/profile', { method: 'PATCH' });
      const response = await patchProfile(request);
      expect(response.status).toBe(401);
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

    test('PATCH - rejects invalid diet selection', async () => {
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

    test('PATCH - rejects invalid energy source selection', async () => {
      getServerSession.mockResolvedValue({ user: { id: 'user-1' } });

      const request = new Request('http://localhost/api/user/profile', {
        method: 'PATCH',
        body: JSON.stringify({ energySource: 'nuclear' }),
      });

      const response = await patchProfile(request);
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toBe('Invalid energy source selection');
    });

    test('PATCH - rejects invalid transport mode selection', async () => {
      getServerSession.mockResolvedValue({ user: { id: 'user-1' } });

      const request = new Request('http://localhost/api/user/profile', {
        method: 'PATCH',
        body: JSON.stringify({ transportMode: 'teleport' }),
      });

      const response = await patchProfile(request);
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toBe('Invalid transport mode selection');
    });

    test('PATCH - rejects invalid household size (too small)', async () => {
      getServerSession.mockResolvedValue({ user: { id: 'user-1' } });

      const request = new Request('http://localhost/api/user/profile', {
        method: 'PATCH',
        body: JSON.stringify({ householdSize: 0 }),
      });

      const response = await patchProfile(request);
      expect(response.status).toBe(400);
    });

    test('PATCH - rejects invalid household size (too large)', async () => {
      getServerSession.mockResolvedValue({ user: { id: 'user-1' } });

      const request = new Request('http://localhost/api/user/profile', {
        method: 'PATCH',
        body: JSON.stringify({ householdSize: 25 }),
      });

      const response = await patchProfile(request);
      expect(response.status).toBe(400);
    });

    test('PATCH - returns 404 if user not found on update', async () => {
      getServerSession.mockResolvedValue({ user: { id: 'user-1' } });
      User.findByIdAndUpdate.mockResolvedValue(null);

      const request = new Request('http://localhost/api/user/profile', {
        method: 'PATCH',
        body: JSON.stringify({ location: 'Boston' }),
      });

      const response = await patchProfile(request);
      expect(response.status).toBe(404);
    });

    test('PATCH - handles errors gracefully', async () => {
      getServerSession.mockResolvedValue({ user: { id: 'user-1' } });
      User.findByIdAndUpdate.mockRejectedValue(new Error('Update failed'));

      const request = new Request('http://localhost/api/user/profile', {
        method: 'PATCH',
        body: JSON.stringify({ location: 'Boston' }),
      });

      const response = await patchProfile(request);
      expect(response.status).toBe(500);
    });
  });

  describe('/api/goals API Route', () => {
    test('GET - returns 401 when unauthorized', async () => {
      getServerSession.mockResolvedValue(null);
      const response = await getGoals();
      expect(response.status).toBe(401);
    });

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

    test('GET - handles errors gracefully', async () => {
      getServerSession.mockResolvedValue({ user: { id: 'user-1' } });
      Goal.find.mockImplementation(() => {
        throw new Error('DB Find Error');
      });

      const response = await getGoals();
      expect(response.status).toBe(500);
    });

    test('POST - returns 401 when unauthorized', async () => {
      getServerSession.mockResolvedValue(null);
      const request = new Request('http://localhost/api/goals', { method: 'POST' });
      const response = await postGoals(request);
      expect(response.status).toBe(401);
    });

    test('POST - returns 400 when missing fields', async () => {
      getServerSession.mockResolvedValue({ user: { id: 'user-1' } });

      const request = new Request('http://localhost/api/goals', {
        method: 'POST',
        body: JSON.stringify({ title: 'New Goal' }),
      });
      const response = await postGoals(request);

      expect(response.status).toBe(400);
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

    test('POST - handles errors gracefully', async () => {
      getServerSession.mockResolvedValue({ user: { id: 'user-1' } });
      Goal.create.mockRejectedValue(new Error('Goal creation failed'));

      const request = new Request('http://localhost/api/goals', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Failing goal',
          type: 'streak',
          targetValue: 5,
          targetUnit: 'days',
          endDate: '2026-12-31'
        }),
      });

      const response = await postGoals(request);
      expect(response.status).toBe(500);
    });
  });

  describe('/api/coach AI Advisor Route', () => {
    test('POST - returns 429 when rate limit is exceeded', async () => {
      rateLimit.mockReturnValue(false);

      const request = new Request('http://localhost/api/coach', {
        method: 'POST',
        body: JSON.stringify({ message: 'Hi' }),
      });

      const response = await postCoach(request);
      expect(response.status).toBe(429);
      const json = await response.json();
      expect(json.error).toBe('Too many requests. Please try again later.');
    });

    test('POST - returns 401 when unauthorized', async () => {
      getServerSession.mockResolvedValue(null);

      const request = new Request('http://localhost/api/coach', {
        method: 'POST',
        body: JSON.stringify({ message: 'Hi' }),
      });

      const response = await postCoach(request);
      expect(response.status).toBe(401);
    });

    test('POST - returns 404 when user is not found', async () => {
      getServerSession.mockResolvedValue({ user: { id: 'user-1' } });
      User.findById.mockResolvedValue(null);

      const request = new Request('http://localhost/api/coach', {
        method: 'POST',
        body: JSON.stringify({ message: 'Hi' }),
      });

      const response = await postCoach(request);
      expect(response.status).toBe(404);
    });

    test('POST - handles errors gracefully', async () => {
      getServerSession.mockResolvedValue({ user: { id: 'user-1' } });
      User.findById.mockRejectedValue(new Error('DB connection lost'));

      const request = new Request('http://localhost/api/coach', {
        method: 'POST',
        body: JSON.stringify({ message: 'Hi' }),
      });

      const response = await postCoach(request);
      expect(response.status).toBe(500);
    });

    describe('Rule Engine Fallbacks (No API Key)', () => {
      beforeEach(() => {
        delete process.env.GEMINI_API_KEY;
      });

      test('POST - generates weekly action plan for transport', async () => {
        getServerSession.mockResolvedValue({ user: { id: 'user-1' } });
        User.findById.mockResolvedValue({
          name: 'Alex',
          profile: { diet: 'high_meat', transportMode: 'car_petrol', energySource: 'grid' },
          baseline: { annualKgCO2e: 6000 }
        });
        ActivityLog.find.mockResolvedValue([
          { category: 'transport', co2e: 150.0, loggedAt: new Date() }
        ]);
        getGridCarbonIntensity.mockResolvedValue({ intensity: 0.18, status: 'low', source: 'fallback' });

        const request = new Request('http://localhost/api/coach', {
          method: 'POST',
          body: JSON.stringify({ action: 'generateWeeklyPlan' }),
        });

        const response = await postCoach(request);
        expect(response.status).toBe(200);
        const json = await response.json();
        expect(json.text).toContain('Weekly Action Plan');
        expect(json.text).toContain('Swap 2 drives');
      });

      test('POST - generates weekly action plan for energy (solar energySource)', async () => {
        getServerSession.mockResolvedValue({ user: { id: 'user-1' } });
        User.findById.mockResolvedValue({
          name: 'Alex',
          profile: { diet: 'vegan', transportMode: 'walking', energySource: 'solar' },
          baseline: { annualKgCO2e: 1000 }
        });
        ActivityLog.find.mockResolvedValue([
          { category: 'energy', co2e: 50.0, loggedAt: new Date() }
        ]);
        getGridCarbonIntensity.mockResolvedValue({ intensity: 0.18, status: 'low', source: 'fallback' });

        const request = new Request('http://localhost/api/coach', {
          method: 'POST',
          body: JSON.stringify({ action: 'generateWeeklyPlan' }),
        });

        const response = await postCoach(request);
        expect(response.status).toBe(200);
        const json = await response.json();
        expect(json.text).toContain('Solar Management');
      });

      test('POST - replies to diet queries for vegans', async () => {
        getServerSession.mockResolvedValue({ user: { id: 'user-1' } });
        User.findById.mockResolvedValue({
          name: 'Alex',
          profile: { diet: 'vegan' },
          baseline: { annualKgCO2e: 2000 }
        });
        ActivityLog.find.mockResolvedValue([]);
        getGridCarbonIntensity.mockResolvedValue({ intensity: 0.23, status: 'moderate', source: 'fallback' });

        const request = new Request('http://localhost/api/coach', {
          method: 'POST',
          body: JSON.stringify({ message: 'Tell me about diet impact.' }),
        });

        const response = await postCoach(request);
        expect(response.status).toBe(200);
        const json = await response.json();
        expect(json.text).toContain('sustainable vegan diet');
      });

      test('POST - replies to diet queries for meat eaters', async () => {
        getServerSession.mockResolvedValue({ user: { id: 'user-1' } });
        User.findById.mockResolvedValue({
          name: 'Alex',
          profile: { diet: 'avg_meat' },
          baseline: { annualKgCO2e: 2000 }
        });
        ActivityLog.find.mockResolvedValue([]);
        getGridCarbonIntensity.mockResolvedValue({ intensity: 0.23, status: 'moderate', source: 'fallback' });

        const request = new Request('http://localhost/api/coach', {
          method: 'POST',
          body: JSON.stringify({ message: 'What about eating beef?' }),
        });

        const response = await postCoach(request);
        expect(response.status).toBe(200);
        const json = await response.json();
        expect(json.text).toContain('current diet profile is avg_meat');
      });

      test('POST - replies to transport/car queries', async () => {
        getServerSession.mockResolvedValue({ user: { id: 'user-1' } });
        User.findById.mockResolvedValue({
          name: 'Alex',
          profile: { transportMode: 'car_diesel' },
          baseline: { annualKgCO2e: 2000 }
        });
        ActivityLog.find.mockResolvedValue([]);
        getGridCarbonIntensity.mockResolvedValue({ intensity: 0.23, status: 'moderate', source: 'fallback' });

        const request = new Request('http://localhost/api/coach', {
          method: 'POST',
          body: JSON.stringify({ message: 'I drive a diesel car.' }),
        });

        const response = await postCoach(request);
        expect(response.status).toBe(200);
        const json = await response.json();
        expect(json.text).toContain('primary transport mode is set to car diesel');
      });

      test('POST - replies to electricity/energy queries', async () => {
        getServerSession.mockResolvedValue({ user: { id: 'user-1' } });
        User.findById.mockResolvedValue({
          name: 'Alex',
          profile: { energySource: 'grid' },
          baseline: { annualKgCO2e: 2000 }
        });
        ActivityLog.find.mockResolvedValue([]);
        getGridCarbonIntensity.mockResolvedValue({ intensity: 0.35, status: 'high', source: 'live' });

        const request = new Request('http://localhost/api/coach', {
          method: 'POST',
          body: JSON.stringify({ message: 'Should I run my laundry now to save energy?' }),
        });

        const response = await postCoach(request);
        expect(response.status).toBe(200);
        const json = await response.json();
        expect(json.text).toContain('The grid is carbon-intensive right now');
      });

      test('POST - replies to greetings (hello/hi)', async () => {
        getServerSession.mockResolvedValue({ user: { id: 'user-1' } });
        User.findById.mockResolvedValue({
          name: 'Alex',
          profile: { diet: 'vegetarian' },
          baseline: { annualKgCO2e: 3000 }
        });
        ActivityLog.find.mockResolvedValue([]);
        getGridCarbonIntensity.mockResolvedValue({ intensity: 0.2, status: 'moderate', source: 'fallback' });

        const request = new Request('http://localhost/api/coach', {
          method: 'POST',
          body: JSON.stringify({ message: 'Hello AI Advisor!' }),
        });

        const response = await postCoach(request);
        expect(response.status).toBe(200);
        const json = await response.json();
        expect(json.text).toContain('Hello Alex');
      });

      test('POST - replies with general fallback when query is not matched', async () => {
        getServerSession.mockResolvedValue({ user: { id: 'user-1' } });
        User.findById.mockResolvedValue({
          name: 'Alex',
          profile: {},
          baseline: { annualKgCO2e: 3000 }
        });
        ActivityLog.find.mockResolvedValue([]);
        getGridCarbonIntensity.mockResolvedValue({ intensity: 0.2, status: 'moderate', source: 'fallback' });

        const request = new Request('http://localhost/api/coach', {
          method: 'POST',
          body: JSON.stringify({ message: 'What is the speed of light?' }),
        });

        const response = await postCoach(request);
        expect(response.status).toBe(200);
        const json = await response.json();
        expect(json.text).toContain('That\'s a very insightful question');
      });
    });

    describe('Gemini Live API Calls', () => {
      let originalFetch;

      beforeAll(() => {
        process.env.GEMINI_API_KEY = 'mock-key';
        originalFetch = global.fetch;
      });

      afterAll(() => {
        delete process.env.GEMINI_API_KEY;
        global.fetch = originalFetch;
      });

      test('POST - returns AI text response from Gemini API', async () => {
        getServerSession.mockResolvedValue({ user: { id: 'user-1' } });
        User.findById.mockResolvedValue({
          name: 'Alex',
          profile: {},
          baseline: { annualKgCO2e: 3000 }
        });
        ActivityLog.find.mockResolvedValue([]);
        getGridCarbonIntensity.mockResolvedValue({ intensity: 0.2, status: 'moderate', source: 'fallback' });

        const mockApiResponse = {
          candidates: [
            {
              content: {
                parts: [
                  { text: 'This is the Gemini Advisor recommendation.' }
                ]
              }
            }
          ]
        };

        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockApiResponse)
        });

        const request = new Request('http://localhost/api/coach', {
          method: 'POST',
          body: JSON.stringify({ message: 'What is your recommendation?' }),
        });

        const response = await postCoach(request);
        expect(response.status).toBe(200);
        const json = await response.json();
        expect(json.text).toBe('This is the Gemini Advisor recommendation.');
      });

      test('POST - executes log_activity function call from Gemini API tool call', async () => {
        getServerSession.mockResolvedValue({ user: { id: 'user-1' } });
        User.findById.mockResolvedValue({
          name: 'Alex',
          profile: {},
          baseline: { annualKgCO2e: 3000 }
        });
        ActivityLog.find.mockResolvedValue([]);
        getGridCarbonIntensity.mockResolvedValue({ intensity: 0.2, status: 'moderate', source: 'fallback' });

        const mockApiResponse = {
          candidates: [
            {
              content: {
                parts: [
                  {
                    functionCall: {
                      name: 'log_activity',
                      args: {
                        category: 'food',
                        subType: 'meal_vegan',
                        amount: 1,
                        unit: 'meals',
                        notes: 'Logged via AI Agent'
                      }
                    }
                  }
                ]
              }
            }
          ]
        };

        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockApiResponse)
        });

        ActivityLog.create.mockResolvedValue({
          userId: 'user-1',
          category: 'food',
          subType: 'meal_vegan',
          amount: 1,
          unit: 'meals',
          co2e: 0.5,
        });

        const request = new Request('http://localhost/api/coach', {
          method: 'POST',
          body: JSON.stringify({ message: 'Log my vegan meal' }),
        });

        const response = await postCoach(request);
        expect(response.status).toBe(200);
        const json = await response.json();
        expect(json.actionTaken).toBe(true);
        expect(json.text).toContain('meal vegan');
        expect(ActivityLog.create).toHaveBeenCalled();
      });

      test('POST - executes create_goal function call from Gemini API tool call', async () => {
        getServerSession.mockResolvedValue({ user: { id: 'user-1' } });
        User.findById.mockResolvedValue({
          name: 'Alex',
          profile: {},
          baseline: { annualKgCO2e: 3000 }
        });
        ActivityLog.find.mockResolvedValue([]);
        getGridCarbonIntensity.mockResolvedValue({ intensity: 0.2, status: 'moderate', source: 'fallback' });

        const mockApiResponse = {
          candidates: [
            {
              content: {
                parts: [
                  {
                    functionCall: {
                      name: 'create_goal',
                      args: {
                        title: 'Reduce driving',
                        type: 'reduction_percentage',
                        category: 'transport',
                        targetValue: 10,
                        targetUnit: 'percent',
                        endDate: '2026-12-31'
                      }
                    }
                  }
                ]
              }
            }
          ]
        };

        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockApiResponse)
        });

        Goal.create.mockResolvedValue({
          userId: 'user-1',
          title: 'Reduce driving',
          type: 'reduction_percentage',
          category: 'transport',
          targetValue: 10,
          targetUnit: 'percent',
          endDate: new Date('2026-12-31'),
        });

        const request = new Request('http://localhost/api/coach', {
          method: 'POST',
          body: JSON.stringify({ message: 'Set a goal to reduce driving' }),
        });

        const response = await postCoach(request);
        expect(response.status).toBe(200);
        const json = await response.json();
        expect(json.actionTaken).toBe(true);
        expect(json.text).toContain('Reduce driving');
        expect(Goal.create).toHaveBeenCalled();
      });

      test('POST - falls back to Rule Engine when Gemini API returns error/warn', async () => {
        getServerSession.mockResolvedValue({ user: { id: 'user-1' } });
        User.findById.mockResolvedValue({
          name: 'Alex',
          profile: { diet: 'vegan' },
          baseline: { annualKgCO2e: 3000 }
        });
        ActivityLog.find.mockResolvedValue([]);
        getGridCarbonIntensity.mockResolvedValue({ intensity: 0.2, status: 'moderate', source: 'fallback' });

        global.fetch = jest.fn().mockResolvedValue({
          ok: false
        });

        const request = new Request('http://localhost/api/coach', {
          method: 'POST',
          body: JSON.stringify({ message: 'Hello' }),
        });

        const response = await postCoach(request);
        expect(response.status).toBe(200);
        const json = await response.json();
        expect(json.text).toContain('Hello Alex'); // fell back to Rule Engine greeting
      });
    });
  });
});
