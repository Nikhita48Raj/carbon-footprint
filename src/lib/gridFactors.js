import { EMISSION_FACTORS } from './emissionFactors';

// Simple in-memory cache to prevent API rate exhaustion
let cache = {
  data: null,
  timestamp: 0,
};

const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fetches the live grid carbon intensity.
 * Connects to the National Grid Carbon Intensity API.
 * Falls back to static calculations in case of API failure or timeout.
 */
export async function getGridCarbonIntensity(country = '', city = '') {
  const normCountry = country.toLowerCase().trim();
  const now = Date.now();

  // Return cached live data if fresh
  if (cache.data && (now - cache.timestamp < CACHE_DURATION_MS)) {
    return cache.data;
  }

  try {
    // 2-second timeout protection
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch('https://api.carbonintensity.org.uk/intensity', {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error('API response error');

    const payload = await res.json();
    const liveData = payload.data?.[0]?.intensity;

    if (!liveData) throw new Error('Malformed API payload');

    // Convert gCO2/kWh to kgCO2/kWh
    const intensity = Math.round((liveData.actual || liveData.forecast || 260) / 1000 * 10000) / 10000;

    const result = {
      intensity,
      source: 'live',
      region: 'United Kingdom (National Grid)',
      status: liveData.index || 'medium', // low, moderate, high, etc.
    };

    // Cache the result
    cache = { data: result, timestamp: now };
    return result;

  } catch (error) {
    console.warn('[GRID API TIMEOUT/FAILURE] Falling back to static values. Error:', error.message);
    
    // Static location matching fallbacks
    const normCity = city.toLowerCase().trim();
    let intensity = EMISSION_FACTORS.energy.electricity_grid; // Default 0.23314
    let status = 'moderate';
    let region = country || 'Default Region';

    if (normCountry === 'france') {
      intensity = 0.055;
      status = 'low';
    } else if (normCountry === 'germany') {
      intensity = 0.385;
      status = 'high';
    } else if (normCountry === 'usa' || normCountry === 'united states') {
      intensity = 0.368;
      status = 'moderate';
      if (normCity === 'seattle') {
        intensity = 0.012;
        status = 'low';
      } else if (normCity === 'denver') {
        intensity = 0.520;
        status = 'high';
      }
    } else if (normCountry === 'india') {
      intensity = 0.720;
      status = 'high';
    }

    return {
      intensity,
      source: 'fallback',
      region,
      status,
    };
  }
}

/**
 * Compatibility wrapper to retrieve grid factors synchronously where async fetching is unavailable.
 */
export function getGridFactors(country = '', city = '') {
  const normCountry = country.toLowerCase().trim();
  const normCity = city.toLowerCase().trim();

  let electricity = EMISSION_FACTORS.energy.electricity_grid;
  let transitCarFactor = 1.0;

  if (normCountry === 'france') {
    electricity = 0.055;
  } else if (normCountry === 'germany') {
    electricity = 0.385;
  } else if (normCountry === 'usa' || normCountry === 'united states') {
    electricity = 0.368;
    transitCarFactor = 1.25;
    if (normCity === 'seattle') electricity = 0.012;
    if (normCity === 'denver') electricity = 0.520;
  } else if (normCountry === 'india') {
    electricity = 0.720;
    transitCarFactor = 1.15;
  }

  return {
    electricity,
    transitCarFactor,
  };
}
