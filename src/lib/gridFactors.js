import { EMISSION_FACTORS } from './emissionFactors';

/**
 * Returns location-aware emission factors (kg CO2e per unit).
 * Maps specific countries and cities to customized grid intensity values.
 * Defaults to standard database values if location is missing or unrecognized.
 */
export function getGridFactors(country = '', city = '') {
  const normCountry = country.toLowerCase().trim();
  const normCity = city.toLowerCase().trim();

  // Baseline standard values
  let electricity = EMISSION_FACTORS.energy.electricity_grid; // Default UK/DEFRA: 0.23314
  let transitCarFactor = 1.0; // Multiplier based on regional road/fleet standards

  // Custom Country Grid Factors (tonnes/MWh -> kg/kWh equivalent)
  if (normCountry === 'france') {
    electricity = 0.055; // Nuclear heavy low-carbon grid
  } else if (normCountry === 'germany') {
    electricity = 0.385; // High coal usage
  } else if (normCountry === 'usa' || normCountry === 'united states') {
    electricity = 0.368; // US national average (eGRID)
    if (normCity === 'seattle') {
      electricity = 0.012; // Hydroelectric power dominated
    } else if (normCity === 'denver') {
      electricity = 0.520; // Coal dominant
    }
  } else if (normCountry === 'india') {
    electricity = 0.720; // Coal dominated grid
  } else if (normCountry === 'china') {
    electricity = 0.540;
  }

  // Road factor adjusts (e.g. US vehicles average higher displacement than EU)
  if (normCountry === 'usa' || normCountry === 'united states') {
    transitCarFactor = 1.25;
  } else if (normCountry === 'france' || normCountry === 'germany') {
    transitCarFactor = 0.90;
  }

  return {
    electricity,
    transitCarFactor
  };
}
