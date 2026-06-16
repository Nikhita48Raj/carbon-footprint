import { EMISSION_FACTORS } from './emissionFactors';
import { getGridFactors } from './gridFactors';

/**
 * Core Carbon Calculation Engine
 * Converts user activity inputs to kg CO₂e values.
 * Sources: DEFRA 2023, EPA, IPCC AR6, Poore & Nemecek 2018.
 * All functions return kg CO₂e as a float rounded to 4 decimal places.
 */

// ─── TRANSPORT ───────────────────────────────────────────────────────────────

export function calculateTransport(vehicleType, distanceKm) {
  const factor = EMISSION_FACTORS.transport[vehicleType] ?? 0;
  return roundTo4(factor * distanceKm);
}

// ─── ENERGY ──────────────────────────────────────────────────────────────────

export function calculateEnergy(energyType, amount) {
  const factor = EMISSION_FACTORS.energy[energyType] ?? 0;
  return roundTo4(factor * amount);
}

// ─── FOOD ────────────────────────────────────────────────────────────────────

export function calculateFood(mealType, meals) {
  const factor = EMISSION_FACTORS.food[mealType] ?? 0;
  return roundTo4(factor * meals);
}

export function calculateFoodByWeight(foodItem, kg) {
  const factor = EMISSION_FACTORS.food[foodItem] ?? 0;
  return roundTo4(factor * kg);
}

// ─── SHOPPING ────────────────────────────────────────────────────────────────

export function calculateShopping(itemType, quantity) {
  const factor = EMISSION_FACTORS.shopping[itemType] ?? 0;
  return roundTo4(factor * quantity);
}

// ─── WASTE ───────────────────────────────────────────────────────────────────

export function calculateWaste(wasteType, kg) {
  const factor = EMISSION_FACTORS.waste[wasteType] ?? 0;
  return roundTo4(factor * kg);
}

// ─── AGGREGATE ───────────────────────────────────────────────────────────────

export function computeActivityEmission(activity, liveGridIntensity) {
  const { category, subType, amount } = activity;
  switch (category) {
    case 'transport': return calculateTransport(subType, amount);
    case 'energy':    
      if (subType === 'electricity_grid' && liveGridIntensity != null) {
        return roundTo4(liveGridIntensity * amount);
      }
      return calculateEnergy(subType, amount);
    case 'food':      return calculateFood(subType, amount);
    case 'shopping':  return calculateShopping(subType, amount);
    case 'waste':     return calculateWaste(subType, amount);
    default:          return 0;
  }
}

export function buildCategorySummary(activities) {
  const summary = { transport: 0, energy: 0, food: 0, shopping: 0, waste: 0 };
  for (const activity of activities) {
    const emission = activity.co2e ?? computeActivityEmission(activity);
    if (activity.category in summary) {
      summary[activity.category] += emission;
    }
  }
  summary.total = roundTo4(Object.values(summary).reduce((a, b) => a + b, 0));
  return summary;
}

/**
 * Annualise using a stable rolling 30-day window.
 * FIX: The original used `new Date().getDate()` (days elapsed in current month)
 * which inflates wildly near the 1st of the month. This version uses the actual
 * date span between the earliest log and today (min 1 day).
 * @param {number} totalEmissions - kg CO₂e for the period
 * @param {Date}   earliestDate   - Date of the first log in the period
 * @returns {number} annualized kg CO₂e
 */
export function annualise(totalEmissions, earliestDate) {
  const msPerDay = 1000 * 60 * 60 * 24;
  const days = Math.max(
    1,
    Math.ceil((Date.now() - new Date(earliestDate).getTime()) / msPerDay)
  );
  return roundTo4((totalEmissions / days) * 365);
}

function roundTo4(value) {
  return Math.round(value * 10000) / 10000;
}

export function getRealtimeTickRate(annualKg) {
  const secondsInYear = 365 * 24 * 60 * 60;
  return annualKg / secondsInYear;
}

// ─── BASELINE CALCULATOR (for onboarding & goals) ───────────────────────────

/**
 * Estimates an annual carbon baseline for a specific category from onboarding profile answers.
 * Uses representative weekly activity assumptions per profile type.
 * @param {Object} profile - User.profile subdocument
 * @param {string} category - Category name ('transport', 'energy', 'food', 'shopping', 'waste', 'overall')
 * @returns {number} estimated annual kg CO₂e
 */
export function calculateCategoryBaseline(profile, category) {
  const { householdSize = 1, diet = 'avg_meat', transportMode = 'car_petrol', energySource = 'grid' } = profile || {};

  const gridInfo = getGridFactors(profile?.country, profile?.location);

  if (category === 'transport') {
    const commuteKmPerYear = 30 * 250;
    let transportFactor = EMISSION_FACTORS.transport[transportMode] ?? EMISSION_FACTORS.transport.car_petrol;
    if (transportMode.startsWith('car')) {
      transportFactor = transportFactor * gridInfo.transitCarFactor;
    }
    return roundTo4(transportFactor * commuteKmPerYear);
  }

  if (category === 'energy') {
    const electricityFactor = energySource === 'solar'
      ? EMISSION_FACTORS.energy.electricity_solar
      : energySource === 'wind'
      ? EMISSION_FACTORS.energy.electricity_wind
      : gridInfo.electricity;

    return roundTo4(
      electricityFactor * (3100 / householdSize) +
      EMISSION_FACTORS.energy.natural_gas * (12000 / householdSize)
    );
  }

  if (category === 'food') {
    const mealKey = {
      high_meat:    'meal_high_meat',
      avg_meat:     'meal_avg_meat',
      pescatarian:  'meal_pescatarian',
      vegetarian:   'meal_vegetarian',
      vegan:        'meal_vegan',
      omnivore:     'meal_avg_meat',
      car:          'meal_avg_meat',
    }[diet] ?? 'meal_avg_meat';
    const foodFactor = EMISSION_FACTORS.food[mealKey] ?? EMISSION_FACTORS.food.meal_avg_meat;
    return roundTo4(foodFactor * 1095);
  }

  if (category === 'shopping') {
    return 200; // WRAP estimate: UK avg annual clothing+electronics
  }

  if (category === 'waste') {
    return roundTo4(EMISSION_FACTORS.waste.general_waste_kg * 400); // ~400 kg waste/year
  }

  if (category === 'overall' || !category) {
    return roundTo4(
      calculateCategoryBaseline(profile, 'transport') +
      calculateCategoryBaseline(profile, 'energy') +
      calculateCategoryBaseline(profile, 'food') +
      calculateCategoryBaseline(profile, 'shopping') +
      calculateCategoryBaseline(profile, 'waste')
    );
  }

  return 0;
}

/**
 * Estimates an annual carbon baseline from onboarding profile answers.
 * Uses representative weekly activity assumptions per profile type.
 * @param {Object} profile - User.profile subdocument
 * @returns {number} estimated annual kg CO₂e
 */
export function calculateBaseline(profile) {
  return calculateCategoryBaseline(profile, 'overall');
}

