import { 
  calculateTransport, 
  calculateEnergy, 
  calculateFood, 
  calculateFoodByWeight, 
  calculateShopping, 
  calculateWaste, 
  computeActivityEmission, 
  buildCategorySummary, 
  annualise, 
  getRealtimeTickRate,
  calculateCategoryBaseline,
  calculateBaseline
} from '@/lib/calculator';

describe('EcoTrack Carbon Calculation Engine', () => {
  
  describe('calculateTransport', () => {
    test('calculates correct emission for car_petrol', () => {
      expect(calculateTransport('car_petrol', 100)).toBe(17.049); // 0.17049 * 100
    });

    test('calculates correct emission for car_electric', () => {
      expect(calculateTransport('car_electric', 100)).toBe(5.302); // 0.05302 * 100
    });

    test('calculates zero emission for cycling', () => {
      expect(calculateTransport('cycling', 100)).toBe(0);
    });

    test('returns zero if transport subType is unknown', () => {
      expect(calculateTransport('unknown_vehicle', 100)).toBe(0);
    });
  });

  describe('calculateEnergy', () => {
    test('calculates natural gas emission', () => {
      expect(calculateEnergy('natural_gas', 100)).toBe(18.28); // 0.1828 * 100
    });

    test('calculates solar electricity emission', () => {
      expect(calculateEnergy('electricity_solar', 100)).toBe(4.1); // 0.041 * 100
    });
  });

  describe('calculateFood', () => {
    test('calculates vegan meal emission', () => {
      expect(calculateFood('meal_vegan', 10)).toBe(5.0); // 0.5 * 10
    });

    test('calculates high meat meal emission', () => {
      expect(calculateFood('meal_high_meat', 10)).toBe(66.0); // 6.6 * 10
    });
  });

  describe('calculateFoodByWeight', () => {
    test('calculates beef weight emission', () => {
      expect(calculateFoodByWeight('beef', 2)).toBe(54.0); // 27.0 * 2
    });
  });

  describe('calculateShopping', () => {
    test('calculates new clothing item emission', () => {
      expect(calculateShopping('clothing_new', 3)).toBe(45); // 15.0 * 3
    });
  });

  describe('calculateWaste', () => {
    test('calculates landfill general waste emission', () => {
      expect(calculateWaste('general_waste_kg', 10)).toBe(5.8); // 0.58 * 10
    });
    
    test('calculates recycling offset emission', () => {
      expect(calculateWaste('recycled_kg', 10)).toBe(-2.1); // -0.21 * 10
    });
  });

  describe('computeActivityEmission', () => {
    test('computes transport correctly', () => {
      const act = { category: 'transport', subType: 'train', amount: 50 };
      expect(computeActivityEmission(act)).toBe(1.7745); // 0.03549 * 50
    });

    test('computes energy electricity grid with live intensity when provided', () => {
      const act = { category: 'energy', subType: 'electricity_grid', amount: 100 };
      expect(computeActivityEmission(act, 0.25)).toBe(25.0);
    });

    test('computes energy electricity grid with static factor when live intensity is null', () => {
      const act = { category: 'energy', subType: 'electricity_grid', amount: 100 };
      expect(computeActivityEmission(act, null)).toBe(23.314); // 0.23314 * 100
    });

    test('returns 0 for unknown category', () => {
      const act = { category: 'teleportation', subType: 'wormhole', amount: 100 };
      expect(computeActivityEmission(act)).toBe(0);
    });
  });

  describe('buildCategorySummary', () => {
    test('aggregates correctly', () => {
      const activities = [
        { category: 'transport', subType: 'car_petrol', amount: 10, co2e: 1.7049 },
        { category: 'energy', subType: 'natural_gas', amount: 10, co2e: 1.828 },
        { category: 'food', subType: 'meal_vegan', amount: 2, co2e: 1.0 },
      ];
      const summary = buildCategorySummary(activities);
      expect(summary.transport).toBe(1.7049);
      expect(summary.energy).toBe(1.828);
      expect(summary.food).toBe(1.0);
      expect(summary.shopping).toBe(0);
      expect(summary.waste).toBe(0);
      expect(summary.total).toBe(4.5329);
    });
  });

  describe('annualise', () => {
    test('annualises footprint based on elapsed date span', () => {
      const earliest = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
      const total = 100;
      // days = 10. (100 / 10) * 365 = 3650
      expect(annualise(total, earliest)).toBe(3650);
    });
  });

  describe('calculateCategoryBaseline', () => {
    test('calculates food baseline based on diet', () => {
      const profile = { diet: 'vegan' };
      // vegan: meal_vegan (0.5) * 1095 = 547.5
      expect(calculateCategoryBaseline(profile, 'food')).toBe(547.5);
    });

    test('calculates overall baseline by summing categories', () => {
      const profile = {
        householdSize: 2,
        diet: 'vegan',
        transportMode: 'cycling',
        energySource: 'solar',
        country: 'France'
      };
      const baseline = calculateBaseline(profile);
      expect(baseline).toBeGreaterThan(0);
    });
  });
});
