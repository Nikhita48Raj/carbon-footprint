/**
 * Carbon Emission Factors Database
 * Sources: DEFRA (UK), EPA (US), IPCC AR6, Our World in Data
 * Units: kg CO₂e per unit specified
 */

export const EMISSION_FACTORS = {

  // ─── TRANSPORTATION ─────────────────────────────────────
  // Source: DEFRA 2023 Conversion Factors
  transport: {
    car_petrol:       0.17049,  // kg CO₂e per km (average UK petrol car)
    car_diesel:       0.16844,  // kg CO₂e per km (average UK diesel car)
    car_electric:     0.05302,  // kg CO₂e per km (UK grid average, DEFRA 2023)
    car_hybrid:       0.10553,  // kg CO₂e per km
    bus:              0.08908,  // kg CO₂e per km (local bus)
    train:            0.03549,  // kg CO₂e per km (national rail average)
    subway:           0.02800,  // kg CO₂e per km (metro)
    rideshare:        0.12740,  // kg CO₂e per km (Uber-equivalent, estimated)
    flight_short:     0.25500,  // kg CO₂e per km (< 3,700 km, economy)
    flight_long:      0.19500,  // kg CO₂e per km (> 3,700 km, economy)
    flight_business:  0.42900,  // kg CO₂e per km (business class multiplier)
    walking:          0.00000,  // zero direct emissions
    cycling:          0.00000,  // zero direct emissions
    motorcycle:       0.11400,  // kg CO₂e per km
  },

  // ─── ENERGY (HOME) ────────────────────────────────────────
  // Source: DEFRA 2023 & IEA 2022
  energy: {
    electricity_grid: 0.23314,  // kg CO₂e per kWh (UK grid average, DEFRA 2023)
    electricity_solar: 0.04100, // kg CO₂e per kWh (lifecycle)
    electricity_wind:  0.01100, // kg CO₂e per kWh (lifecycle)
    natural_gas:       0.18280, // kg CO₂e per kWh (combustion)
    heating_oil:       0.24690, // kg CO₂e per kWh
    lpg:               0.21440, // kg CO₂e per kWh
    water:             0.00034, // kg CO₂e per litre (treatment + distribution)
  },

  // ─── FOOD & DIET ─────────────────────────────────────────
  // Source: Poore & Nemecek (2018) Science, Our World in Data
  food: {
    beef:            27.00,  // kg CO₂e per kg
    lamb:            39.20,  // kg CO₂e per kg
    pork:             7.61,  // kg CO₂e per kg
    poultry:          6.07,  // kg CO₂e per kg
    fish_farmed:     13.63,  // kg CO₂e per kg
    fish_wild:        3.00,  // kg CO₂e per kg
    dairy_milk:       3.15,  // kg CO₂e per litre
    dairy_cheese:    13.50,  // kg CO₂e per kg
    eggs:             4.67,  // kg CO₂e per kg
    vegetables:       2.00,  // kg CO₂e per kg (average)
    fruit:            1.10,  // kg CO₂e per kg (average)
    legumes:          0.90,  // kg CO₂e per kg
    cereals:          1.40,  // kg CO₂e per kg
    food_waste:       2.50,  // kg CO₂e per kg of food wasted (methane)

    // Pre-packaged meal estimates (per meal)
    meal_high_meat:   6.60,  // kg CO₂e per meal (beef-heavy)
    meal_avg_meat:    2.50,  // kg CO₂e per meal (mixed)
    meal_pescatarian: 1.20,  // kg CO₂e per meal
    meal_vegetarian:  0.80,  // kg CO₂e per meal
    meal_vegan:       0.50,  // kg CO₂e per meal
  },

  // ─── SHOPPING ────────────────────────────────────────────
  // Source: WRAP, Carbon Trust, Eurostat lifecycle analysis
  shopping: {
    clothing_new:     15.00,  // kg CO₂e per item (average garment)
    clothing_sustainable: 5.00, // kg CO₂e per item
    electronics_laptop: 350.0, // kg CO₂e per unit (lifecycle)
    electronics_phone:  60.0,  // kg CO₂e per unit
    electronics_tv:    230.0,  // kg CO₂e per unit
    household_furniture: 50.0, // kg CO₂e per item (average)
    household_appliance: 100.0, // kg CO₂e per item
  },

  // ─── WASTE ────────────────────────────────────────────────
  // Source: DEFRA 2023 Waste Emission Factors
  waste: {
    general_waste_kg:  0.58,   // kg CO₂e per kg (mixed municipal to landfill)
    recycled_kg:      -0.21,   // kg CO₂e per kg (negative = credit for recycling)
    composted_kg:      0.10,   // kg CO₂e per kg
  },
};

/**
 * Global averages for comparison benchmarking
 * Source: Our World in Data, World Bank 2023
 */
export const GLOBAL_AVERAGES = {
  world:  4.70,   // tonnes CO₂e per capita per year
  usa:   14.40,   // tonnes CO₂e per capita per year
  uk:     5.50,   // tonnes CO₂e per capita per year
  eu:     6.40,   // tonnes CO₂e per capita per year
  india:  1.90,   // tonnes CO₂e per capita per year
  china:  8.40,   // tonnes CO₂e per capita per year
  target: 2.00,   // Paris Agreement 2030 target per capita
};
