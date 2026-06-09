import { EMISSION_FACTORS } from './emissionFactors';

/**
 * Core Carbon Calculation Engine
 * Converts user activity inputs to kg CO₂e values.
 * Uses scientifically sourced emission factors (DEFRA 2023, EPA, Poore & Nemecek 2018).
 *
 * All functions return kg CO₂e as a float rounded to 4 decimal places.
 */

// ─── TRANSPORT ─────────────────────────────────────────────────────────────

/**
 * @param {string} vehicleType - Key from EMISSION_FACTORS.transport
 * @param {number} distanceKm  - Distance travelled in km
 * @returns {number} kg CO₂e
 */
export function calculateTransport(vehicleType, distanceKm) {
  const factor = EMISSION_FACTORS.transport[vehicleType] ?? 0;
  return roundTo4(factor * distanceKm);
}

// ─── ENERGY ─────────────────────────────────────────────────────────────────

/**
 * @param {string} energyType - Key from EMISSION_FACTORS.energy
 * @param {number} amount     - kWh for electricity/gas, litres for water
 * @returns {number} kg CO₂e
 */
export function calculateEnergy(energyType, amount) {
  const factor = EMISSION_FACTORS.energy[energyType] ?? 0;
  return roundTo4(factor * amount);
}

// ─── FOOD ────────────────────────────────────────────────────────────────────

/**
 * @param {string} mealType - Key from EMISSION_FACTORS.food (meal_* keys)
 * @param {number} meals    - Number of meals
 * @returns {number} kg CO₂e
 */
export function calculateFood(mealType, meals) {
  const factor = EMISSION_FACTORS.food[mealType] ?? 0;
  return roundTo4(factor * meals);
}

/**
 * @param {string} foodItem - Key from EMISSION_FACTORS.food
 * @param {number} kg       - Weight in kilograms
 * @returns {number} kg CO₂e
 */
export function calculateFoodByWeight(foodItem, kg) {
  const factor = EMISSION_FACTORS.food[foodItem] ?? 0;
  return roundTo4(factor * kg);
}

// ─── SHOPPING ─────────────────────────────────────────────────────────────

/**
 * @param {string} itemType  - Key from EMISSION_FACTORS.shopping
 * @param {number} quantity  - Number of items purchased
 * @returns {number} kg CO₂e
 */
export function calculateShopping(itemType, quantity) {
  const factor = EMISSION_FACTORS.shopping[itemType] ?? 0;
  return roundTo4(factor * quantity);
}

// ─── WASTE ───────────────────────────────────────────────────────────────────

/**
 * @param {string} wasteType  - Key from EMISSION_FACTORS.waste
 * @param {number} kg         - Weight in kilograms
 * @returns {number} kg CO₂e (can be negative for recycling credits)
 */
export function calculateWaste(wasteType, kg) {
  const factor = EMISSION_FACTORS.waste[wasteType] ?? 0;
  return roundTo4(factor * kg);
}

// ─── AGGREGATE CALCULATOR ─────────────────────────────────────────────────

/**
 * Computes total emissions for a single activity log entry.
 * @param {Object} activity - ActivityLog document from MongoDB
 * @returns {number} kg CO₂e
 */
export function computeActivityEmission(activity) {
  const { category, subType, amount } = activity;
  switch (category) {
    case 'transport': return calculateTransport(subType, amount);
    case 'energy':    return calculateEnergy(subType, amount);
    case 'food':      return calculateFood(subType, amount);
    case 'shopping':  return calculateShopping(subType, amount);
    case 'waste':     return calculateWaste(subType, amount);
    default:          return 0;
  }
}

/**
 * Builds a category summary from an array of activity logs.
 * @param {Array} activities - Array of ActivityLog documents
 * @returns {Object} { transport, energy, food, shopping, waste, total } all in kg CO₂e
 */
export function buildCategorySummary(activities) {
  const summary = {
    transport: 0,
    energy: 0,
    food: 0,
    shopping: 0,
    waste: 0,
  };

  for (const activity of activities) {
    const category = activity.category;
    const emission = activity.co2e ?? computeActivityEmission(activity);
    if (category in summary) {
      summary[category] += emission;
    }
  }

  summary.total = Object.values(summary).reduce((a, b) => a + b, 0);
  return summary;
}

/**
 * Annualises a given period's emissions.
 * @param {number} periodEmissions - Total CO₂e for the period in kg
 * @param {number} days            - Number of days the period spans
 * @returns {number} annualized kg CO₂e
 */
export function annualise(periodEmissions, days) {
  if (days === 0) return 0;
  return roundTo4((periodEmissions / days) * 365);
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function roundTo4(value) {
  return Math.round(value * 10000) / 10000;
}

/**
 * Real-time tick estimate (kg CO₂e per second) based on a user's annual baseline.
 * Used for the live meter on the dashboard.
 * @param {number} annualKg - Annual kg CO₂e estimate
 * @returns {number} kg CO₂e per second
 */
export function getRealtimeTickRate(annualKg) {
  const secondsInYear = 365 * 24 * 60 * 60;
  return annualKg / secondsInYear;
}
