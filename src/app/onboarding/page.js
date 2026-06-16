"use client";
import { useState, useEffect } from "react";
import styles from "./page.module.css";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const TRANSPORT_OPTIONS = [
  { value: 'car_petrol',   label: '🚗 Personal Car (Petrol)'    },
  { value: 'car_diesel',   label: '🚗 Personal Car (Diesel)'    },
  { value: 'car_electric', label: '⚡ Electric Car'              },
  { value: 'car_hybrid',   label: '🔋 Hybrid Car'               },
  { value: 'bus',          label: '🚌 Public Bus'               },
  { value: 'train',        label: '🚆 Train'                    },
  { value: 'subway',       label: '🚇 Subway / Metro'           },
  { value: 'walking',      label: '🚶 Walking / Cycling'        },
];

const DIET_OPTIONS = [
  { value: 'high_meat',   label: '🥩 High Meat (Beef / Lamb daily)' },
  { value: 'avg_meat',    label: '🍗 Average Meat Eater'            },
  { value: 'pescatarian', label: '🐟 Pescatarian'                   },
  { value: 'vegetarian',  label: '🥗 Vegetarian'                    },
  { value: 'vegan',       label: '🌱 Vegan'                         },
];

const ENERGY_OPTIONS = [
  { value: 'grid',  label: '⚡ Standard Grid Electricity' },
  { value: 'mixed', label: '🔀 Mix of Grid + Renewables'  },
  { value: 'solar', label: '☀️ Mostly Solar'              },
  { value: 'wind',  label: '💨 Mostly Wind'               },
];

const TOTAL_STEPS = 4;

export default function Onboarding() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Auth guard
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  const [formData, setFormData] = useState({
    location:      '',
    country:       '',
    householdSize: 1,
    transportMode: 'car_petrol',
    diet:          'avg_meat',
    energySource:  'grid',
  });

  const update = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));

  const handleFinish = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to save profile');
      router.push('/dashboard');
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS) setStep(s => s + 1);
    else handleFinish();
  };

  if (status === 'loading') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ width: '48px', height: '48px', border: '3px solid rgba(16,185,129,0.2)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ color: 'rgba(255,255,255,0.6)' }}>Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={`glass-panel ${styles.card}`}>
        {/* Progress */}
        <div className={styles.progress}>
          <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
            Step {step} of {TOTAL_STEPS}
          </span>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
          </div>
        </div>

        {/* Step 1 — Location & Household */}
        {step === 1 && (
          <div className={styles.stepContent}>
            <h2 className="heading-lg">Welcome! 🌍</h2>
            <p className={styles.subtitle}>Let's build your carbon profile.</p>

            <label className={styles.label}>City / Region</label>
            <input
              type="text"
              className={styles.input}
              placeholder="e.g. London"
              value={formData.location}
              onChange={e => update('location', e.target.value)}
            />

            <label className={styles.label} style={{ marginTop: '1rem' }}>Country</label>
            <input
              type="text"
              className={styles.input}
              placeholder="e.g. United Kingdom"
              value={formData.country}
              onChange={e => update('country', e.target.value)}
            />

            <label className={styles.label} style={{ marginTop: '1rem' }}>Household size (people)</label>
            <input
              type="number"
              min="1"
              max="20"
              className={styles.input}
              value={formData.householdSize}
              onChange={e => update('householdSize', parseInt(e.target.value, 10) || 1)}
            />
          </div>
        )}

        {/* Step 2 — Transport */}
        {step === 2 && (
          <div className={styles.stepContent}>
            <h2>Transportation 🚗</h2>
            <p className={styles.subtitle}>How do you mainly get around?</p>
            <div className={styles.options} role="radiogroup" aria-label="Commuting transportation modes">
              {TRANSPORT_OPTIONS.map(o => {
                const isSelected = formData.transportMode === o.value;
                return (
                  <button
                    key={o.value}
                    role="radio"
                    aria-checked={isSelected}
                    className={`${styles.optionCard} ${isSelected ? styles.optionSelected : ''}`}
                    onClick={() => update('transportMode', o.value)}
                    type="button"
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3 — Diet */}
        {step === 3 && (
          <div className={styles.stepContent}>
            <h2>Diet Preferences 🥗</h2>
            <p className={styles.subtitle}>Diet is one of the biggest factors in your footprint.</p>
            <div className={styles.options} role="radiogroup" aria-label="Dietary preferences">
              {DIET_OPTIONS.map(o => {
                const isSelected = formData.diet === o.value;
                return (
                  <button
                    key={o.value}
                    role="radio"
                    aria-checked={isSelected}
                    className={`${styles.optionCard} ${isSelected ? styles.optionSelected : ''}`}
                    onClick={() => update('diet', o.value)}
                    type="button"
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 4 — Energy */}
        {step === 4 && (
          <div className={styles.stepContent}>
            <h2>Home Energy ⚡</h2>
            <p className={styles.subtitle}>What powers your home?</p>
            <div className={styles.options} role="radiogroup" aria-label="Home energy sources">
              {ENERGY_OPTIONS.map(o => {
                const isSelected = formData.energySource === o.value;
                return (
                  <button
                    key={o.value}
                    role="radio"
                    aria-checked={isSelected}
                    className={`${styles.optionCard} ${isSelected ? styles.optionSelected : ''}`}
                    onClick={() => update('energySource', o.value)}
                    type="button"
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
            {error && (
              <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '8px', color: '#fca5a5', fontSize: '0.9rem' }}>
                {error}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className={styles.actions}>
          {step > 1 && (
            <button className={styles.btnSecondary} onClick={() => setStep(s => s - 1)} type="button">
              Back
            </button>
          )}
          <button
            className="btn-primary"
            onClick={handleNext}
            disabled={saving}
            type="button"
          >
            {saving ? 'Saving...' : step === TOTAL_STEPS ? 'Calculate My Footprint 🌱' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
