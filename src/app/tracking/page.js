"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import useStore from '@/store/useStore';
import styles from '../shared.module.css';

const TRANSPORT_OPTIONS = [
  { value: 'car_petrol',    label: 'Car — Petrol',    unit: 'km' },
  { value: 'car_diesel',    label: 'Car — Diesel',    unit: 'km' },
  { value: 'car_electric',  label: 'Car — Electric',  unit: 'km' },
  { value: 'car_hybrid',    label: 'Car — Hybrid',    unit: 'km' },
  { value: 'bus',           label: 'Bus',             unit: 'km' },
  { value: 'train',         label: 'Train',           unit: 'km' },
  { value: 'subway',        label: 'Subway / Metro',  unit: 'km' },
  { value: 'rideshare',     label: 'Ride-sharing',    unit: 'km' },
  { value: 'flight_short',  label: 'Flight (Short)',  unit: 'km' },
  { value: 'flight_long',   label: 'Flight (Long)',   unit: 'km' },
  { value: 'walking',       label: 'Walking',         unit: 'km' },
  { value: 'cycling',       label: 'Cycling',         unit: 'km' },
  { value: 'motorcycle',    label: 'Motorcycle',      unit: 'km' },
];

const ENERGY_OPTIONS = [
  { value: 'electricity_grid',  label: 'Electricity (Grid)',  unit: 'kWh' },
  { value: 'electricity_solar', label: 'Electricity (Solar)', unit: 'kWh' },
  { value: 'natural_gas',       label: 'Natural Gas',         unit: 'kWh' },
  { value: 'heating_oil',       label: 'Heating Oil',         unit: 'kWh' },
  { value: 'water',             label: 'Water',               unit: 'litres' },
];

const FOOD_OPTIONS = [
  { value: 'meal_high_meat',    label: 'High Meat Meal (Beef/Lamb)', unit: 'meals' },
  { value: 'meal_avg_meat',     label: 'Average Meat Meal',         unit: 'meals' },
  { value: 'meal_pescatarian',  label: 'Pescatarian Meal',          unit: 'meals' },
  { value: 'meal_vegetarian',   label: 'Vegetarian Meal',           unit: 'meals' },
  { value: 'meal_vegan',        label: 'Vegan Meal',                unit: 'meals' },
  { value: 'food_waste',        label: 'Food Waste',                unit: 'kg'    },
  { value: 'dairy_milk',        label: 'Dairy Milk',                unit: 'litres'},
  { value: 'dairy_cheese',      label: 'Cheese',                    unit: 'kg'    },
];

const SHOPPING_OPTIONS = [
  { value: 'clothing_new',          label: 'New Clothing Item',     unit: 'units' },
  { value: 'clothing_sustainable',  label: 'Sustainable Clothing',  unit: 'units' },
  { value: 'electronics_laptop',    label: 'Laptop / Computer',     unit: 'units' },
  { value: 'electronics_phone',     label: 'Smartphone',            unit: 'units' },
  { value: 'electronics_tv',        label: 'Television',            unit: 'units' },
  { value: 'household_furniture',   label: 'Furniture Item',        unit: 'units' },
  { value: 'household_appliance',   label: 'Home Appliance',        unit: 'units' },
];

const WASTE_OPTIONS = [
  { value: 'general_waste_kg', label: 'General Waste (Landfill)', unit: 'kg' },
  { value: 'recycled_kg',      label: 'Recycled Waste',           unit: 'kg' },
  { value: 'composted_kg',     label: 'Composted Waste',          unit: 'kg' },
];

const CATEGORY_OPTIONS = {
  transport: TRANSPORT_OPTIONS,
  energy:    ENERGY_OPTIONS,
  food:      FOOD_OPTIONS,
  shopping:  SHOPPING_OPTIONS,
  waste:     WASTE_OPTIONS,
};

export default function Tracking() {
  const { data: session } = useSession();
  const { logActivity, activities, fetchActivities, showToast } = useStore();

  const [category, setCategory]  = useState('transport');
  const [subType,  setSubType]   = useState('car_petrol');
  const [amount,   setAmount]    = useState('');
  const [notes,    setNotes]     = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  useEffect(() => {
    if (session) {
      fetchActivities();
    }
  }, [session]);

  const options = CATEGORY_OPTIONS[category] ?? [];
  const selected = options.find(o => o.value === subType) ?? options[0];

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    setSubType(CATEGORY_OPTIONS[cat][0].value);
    setAmount('');
    setLastResult(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!session) return;
    setSubmitting(true);
    try {
      const result = await logActivity({
        category,
        subType,
        amount: parseFloat(amount),
        unit: selected.unit,
        notes,
      });
      setLastResult(result);
      setAmount('');
      setNotes('');
      showToast(`Logged! ${result.co2e.toFixed(3)} kg CO₂e recorded.`);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Log Activity</h1>
        <p className={styles.subtitle}>Every entry is calculated using DEFRA 2023 emission factors.</p>
      </header>

      <div className={styles.grid}>
        <section className={`glass-panel ${styles.card}`}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Category tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {Object.keys(CATEGORY_OPTIONS).map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategoryChange(cat)}
                  style={{
                    padding: '0.4rem 1rem',
                    borderRadius: '999px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: category === cat ? 'var(--primary)' : 'transparent',
                    color: 'white',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    fontSize: '0.875rem',
                    fontWeight: category === cat ? '600' : '400',
                    transition: 'all 0.2s',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Activity Type</label>
              <select
                className={styles.select}
                value={subType}
                onChange={e => setSubType(e.target.value)}
              >
                {options.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Amount ({selected?.unit})</label>
              <input
                type="number"
                min="0"
                step="any"
                className={styles.input}
                placeholder={`e.g. ${category === 'transport' ? '15' : '30'}`}
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Notes (optional)</label>
              <input
                type="text"
                className={styles.input}
                placeholder="Add context..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

            <button className="btn-primary" type="submit" disabled={submitting || !session}>
              {submitting ? 'Calculating...' : session ? 'Calculate & Log' : 'Sign in to log activities'}
            </button>
          </form>

          {lastResult && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(16,185,129,0.1)', borderRadius: '8px', border: '1px solid var(--primary)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Emission recorded</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                {lastResult.co2e.toFixed(4)} kg CO₂e
              </div>
            </div>
          )}
        </section>

        <section className={`glass-panel ${styles.card}`}>
          <h2>Recent Logs</h2>
          {activities.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.5)' }}>No activities logged yet. Start tracking above!</p>
          ) : (
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {activities.slice(0, 10).map(a => (
                <li key={a._id} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <div>
                    <div style={{ fontWeight: '500', textTransform: 'capitalize' }}>{a.subType.replace(/_/g, ' ')}</div>
                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>{new Date(a.loggedAt).toLocaleDateString()}</div>
                  </div>
                  <span style={{ color: a.co2e <= 0 ? 'var(--success)' : '#ef4444', fontWeight: 'bold' }}>
                    {a.co2e > 0 ? '+' : ''}{a.co2e.toFixed(3)} kg
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
