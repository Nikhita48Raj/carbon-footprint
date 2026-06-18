import { getGridCarbonIntensity, getGridFactors } from '@/lib/gridFactors';

describe('gridFactors Utility Tests', () => {
  let originalFetch;
  let originalDateNow;
  let mockTime = 1000000;

  beforeAll(() => {
    originalFetch = global.fetch;
    originalDateNow = Date.now;
    Date.now = () => mockTime;
  });

  afterAll(() => {
    global.fetch = originalFetch;
    Date.now = originalDateNow;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockTime += 10 * 60 * 1000; // Increment mock time by 10 minutes (CACHE_DURATION is 5 minutes)
  });

  describe('getGridFactors (Synchronous)', () => {
    test('returns correct factors for France', () => {
      const factors = getGridFactors('France');
      expect(factors.electricity).toBe(0.055);
      expect(factors.transitCarFactor).toBe(1.0);
    });

    test('returns correct factors for Germany', () => {
      const factors = getGridFactors('Germany');
      expect(factors.electricity).toBe(0.385);
      expect(factors.transitCarFactor).toBe(1.0);
    });

    test('returns correct factors for USA and general city', () => {
      const factors = getGridFactors('USA');
      expect(factors.electricity).toBe(0.368);
      expect(factors.transitCarFactor).toBe(1.25);
    });

    test('returns correct factors for USA (Seattle)', () => {
      const factors = getGridFactors('United States', 'Seattle');
      expect(factors.electricity).toBe(0.012);
      expect(factors.transitCarFactor).toBe(1.25);
    });

    test('returns correct factors for USA (Denver)', () => {
      const factors = getGridFactors('USA', 'Denver');
      expect(factors.electricity).toBe(0.520);
      expect(factors.transitCarFactor).toBe(1.25);
    });

    test('returns correct factors for India', () => {
      const factors = getGridFactors('India');
      expect(factors.electricity).toBe(0.720);
      expect(factors.transitCarFactor).toBe(1.15);
    });

    test('returns default factors for unknown countries', () => {
      const factors = getGridFactors('Canada');
      expect(factors.electricity).toBe(0.23314);
      expect(factors.transitCarFactor).toBe(1.0);
    });
  });

  describe('getGridCarbonIntensity (Asynchronous)', () => {
    test('successfully fetches UK live carbon intensity and caches it', async () => {
      const mockResponse = {
        data: [
          {
            intensity: {
              actual: 150,
              index: 'moderate'
            }
          }
        ]
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const res1 = await getGridCarbonIntensity();
      expect(res1.intensity).toBe(0.15);
      expect(res1.source).toBe('live');
      expect(res1.status).toBe('moderate');

      // Call again to verify cache hitting (fetch should only be called once)
      const res2 = await getGridCarbonIntensity();
      expect(res2).toEqual(res1);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    test('falls back to forecast when actual is missing', async () => {
      const mockResponse = {
        data: [
          {
            intensity: {
              forecast: 200,
              index: 'moderate'
            }
          }
        ]
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const res = await getGridCarbonIntensity();
      expect(res.intensity).toBe(0.2);
      expect(res.status).toBe('moderate');
    });

    test('falls back to static values when API returns non-ok status', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false
      });

      const res = await getGridCarbonIntensity('France');
      expect(res.intensity).toBe(0.055);
      expect(res.source).toBe('fallback');
      expect(res.status).toBe('low');
    });

    test('falls back to static values when API returns malformed payload', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({})
      });

      const res = await getGridCarbonIntensity('Germany');
      expect(res.intensity).toBe(0.385);
      expect(res.source).toBe('fallback');
      expect(res.status).toBe('high');
    });

    test('falls back to static values on fetch rejection (network failure)', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network Error'));

      const res = await getGridCarbonIntensity('India');
      expect(res.intensity).toBe(0.720);
      expect(res.source).toBe('fallback');
      expect(res.status).toBe('high');
    });

    test('falls back to static values for USA / Denver on API failure', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('API Failure'));

      const res = await getGridCarbonIntensity('USA', 'Denver');
      expect(res.intensity).toBe(0.520);
      expect(res.status).toBe('high');
    });

    test('falls back to static values for USA / Seattle on API failure', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('API Failure'));

      const res = await getGridCarbonIntensity('USA', 'Seattle');
      expect(res.intensity).toBe(0.012);
      expect(res.status).toBe('low');
    });

    test('falls back to static values for USA / other city on API failure', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('API Failure'));

      const res = await getGridCarbonIntensity('United States', 'Boston');
      expect(res.intensity).toBe(0.368);
      expect(res.status).toBe('moderate');
    });

    test('falls back to defaults for unknown country on API failure', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('API Failure'));

      const res = await getGridCarbonIntensity('Brazil');
      expect(res.intensity).toBe(0.23314);
      expect(res.status).toBe('moderate');
    });
  });
});
