"use client";
import styles from '../shared.module.css';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import useStore from '@/store/useStore';

export default function DigitalTwin() {
  const { data: session } = useSession();
  const { showToast } = useStore();

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liveGridIntensity, setLiveGridIntensity] = useState(0.23314); // default UK baseline

  // Sliders state
  const [carDays, setCarDays] = useState(5);
  const [meatMeals, setMeatMeals] = useState(14);
  const [solarPct, setSolarPct] = useState(0);
  const [offsetsPct, setOffsetsPct] = useState(0);
  const [settingGoal, setSettingGoal] = useState(false);

  useEffect(() => {
    async function getProfile() {
      try {
        const [profileRes, dashRes] = await Promise.all([
          fetch('/api/user/profile'),
          fetch('/api/dashboard/summary'),
        ]);
        if (profileRes.ok) {
          const data = await profileRes.json();
          setProfileData(data);
          if (data.profile) {
            const diet = data.profile.diet;
            if (diet === 'vegan' || diet === 'vegetarian') setMeatMeals(0);
            else if (diet === 'pescatarian') setMeatMeals(3);
            else if (diet === 'avg_meat') setMeatMeals(10);
            else if (diet === 'high_meat') setMeatMeals(18);
            const source = data.profile.energySource;
            if (source === 'solar' || source === 'wind') setSolarPct(80);
          }
        }
        if (dashRes.ok) {
          const dashData = await dashRes.json();
          // Use live grid intensity if available (fallback to UK baseline)
          if (dashData.gridIntensity) setLiveGridIntensity(dashData.gridIntensity);
        }
      } catch (err) {
        console.error('Error fetching data for digital twin:', err);
      } finally {
        setLoading(false);
      }
    }
    if (session) getProfile();
    else setLoading(false);
  }, [session]);

  const getProfileBaselines = () => {
    const defaultBaselines = { transport: 1278, energy: 2906, food: 2737, shopping: 200, waste: 232, total: 5353 };
    if (!profileData?.profile) return defaultBaselines;

    const profile = profileData.profile;
    const size = profile.householdSize || 1;

    // Transport Component
    const transportMode = profile.transportMode || 'car_petrol';
    const tFactor = {
      car_petrol: 0.17049, car_diesel: 0.16844, car_electric: 0.05302, car_hybrid: 0.10553,
      bus: 0.08908, train: 0.03549, subway: 0.028, walking: 0, cycling: 0
    }[transportMode] ?? 0.17049;
    const transport = Math.round(tFactor * 30 * 250);

    // Energy Component — uses live grid intensity from National Grid API
    const eSource = profile.energySource || 'grid';
    const electricityFactor = eSource === 'solar' ? 0.041 : eSource === 'wind' ? 0.011 : liveGridIntensity;
    const energy = Math.round(electricityFactor * (3100 / size) + 0.1828 * (12000 / size));

    // Food Component
    const diet = profile.diet || 'avg_meat';
    const fFactor = {
      high_meat: 6.6, avg_meat: 2.5, pescatarian: 1.2, vegetarian: 0.8, vegan: 0.5
    }[diet] ?? 2.5;
    const food = Math.round(fFactor * 1095);

    return { transport, energy, food, shopping: 200, waste: 232, total: transport + energy + food + 200 + 232 };
  };

  const current = getProfileBaselines();

  // Optimized Twin calculations
  const optTransport = Math.round(current.transport * (carDays / 5));
  const optFood = Math.round(current.food * (meatMeals / 14));
  const optEnergy = Math.round(current.energy * (1 - (solarPct / 100) * 0.75));
  const optGross = optTransport + optEnergy + optFood + current.shopping + current.waste;
  const optNet = Math.round(optGross * (1 - (offsetsPct / 100)));

  const co2SavedKg = Math.max(0, current.total - optNet);
  const savingsPct = current.total > 0 ? Math.round((co2SavedKg / current.total) * 100) : 0;

  // Financial modeling
  const transportSavings = Math.max(0, (5 - carDays) * 30 * 52 * 0.18); // days * distance * weeks * cost
  const energySavings = (solarPct / 100) * 120 * 12; // solar share * avg annual savings
  const foodSavings = Math.max(0, (14 - meatMeals) * 3.5 * 52); // meals * savings * weeks
  const financialSavings = Math.round(transportSavings + energySavings + foodSavings);

  const handleSetGoal = async () => {
    if (!session) {
      showToast('Please sign in to set goals.', 'error');
      return;
    }
    setSettingGoal(true);
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Reduce footprint by ${savingsPct}% (Twin Simulation)`,
          description: `Targeting: ${carDays} car days/week, ${meatMeals} meat meals/week, and ${solarPct}% solar efficiency.`,
          type: 'reduction_percentage',
          category: 'overall',
          targetValue: savingsPct || 10,
          targetUnit: 'percent',
          period: 'monthly',
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        }),
      });
      if (!res.ok) throw new Error();
      showToast('Digital Twin goal successfully registered! 🎯');
    } catch (err) {
      showToast('Could not register twin goal.', 'error');
    } finally {
      setSettingGoal(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <p style={{ color: 'rgba(255,255,255,0.5)' }}>Analyzing carbon twin model...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Digital Carbon Twin</h1>
        <p className={styles.subtitle}>Modify your simulated lifestyle sliders to visualize carbon and financial trade-offs in real-time.</p>
      </header>

      <div className={styles.grid} style={{ gridTemplateColumns: '1.2fr 0.8fr' }}>
        
        {/* Sliders and Configuration */}
        <section className={`glass-panel ${styles.card}`} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '2rem' }}>
          <h2>Twin Configuration Sliders</h2>
          
          <div className={styles.inputGroup}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label className={styles.label}>🚗 Car Commute (Days / Week)</label>
              <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{carDays} days</span>
            </div>
            <input type="range" min="0" max="7" value={carDays} onChange={e => setCarDays(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--primary)' }} />
          </div>

          <div className={styles.inputGroup}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label className={styles.label}>🍔 Meat Meals (Meals / Week)</label>
              <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{meatMeals} meals</span>
            </div>
            <input type="range" min="0" max="21" value={meatMeals} onChange={e => setMeatMeals(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--primary)' }} />
          </div>

          <div className={styles.inputGroup}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label className={styles.label}>☀️ Clean Solar/Renewable Share
                <span style={{ marginLeft: '0.5rem', fontSize: '0.65rem', padding: '1px 5px', borderRadius: '999px', background: 'rgba(16,185,129,0.15)', color: 'var(--primary)', border: '1px solid rgba(16,185,129,0.3)', verticalAlign: 'middle' }}>
                  Grid: {(liveGridIntensity * 1000).toFixed(0)} gCO₂/kWh
                </span>
              </label>
              <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{solarPct}%</span>
            </div>
            <input type="range" min="0" max="100" value={solarPct} onChange={e => setSolarPct(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--primary)' }} />
          </div>

          <div className={styles.inputGroup}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label className={styles.label}>🌳 Carbon Offsets Contribution</label>
              <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{offsetsPct}%</span>
            </div>
            <input type="range" min="0" max="100" value={offsetsPct} onChange={e => setOffsetsPct(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--primary)' }} />
          </div>

          <button className="btn-primary" style={{ marginTop: '1rem', width: '100%' }} onClick={handleSetGoal} disabled={settingGoal || savingsPct <= 0}>
            {settingGoal ? 'Setting Goal...' : 'Set Simulation as Active Goal 🎯'}
          </button>
        </section>

        {/* Real-time Side-by-Side Model comparison */}
        <section className={`glass-panel ${styles.card}`} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '2rem' }}>
          <h2>Twin Impact Results</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', margin: '1.5rem 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className={styles.label}>Current Footprint:</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{(current.total / 1000).toFixed(2)} tons CO₂e/yr</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className={styles.label} style={{ color: 'var(--primary)' }}>Optimized Twin:</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success)' }}>{(optNet / 1000).toFixed(2)} tons CO₂e/yr</span>
            </div>

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className={styles.label}>Annual CO₂ Saved:</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--success)' }}>{co2SavedKg} kg CO₂e</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className={styles.label}>Footprint Reduction:</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary)' }}>{savingsPct}%</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className={styles.label}>Estimated Financial Savings:</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#f59e0b' }}>${financialSavings} / year</span>
            </div>
          </div>

          <div style={{ marginTop: 'auto', background: 'rgba(16,185,129,0.08)', border: '1px solid var(--primary)', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '0.25rem' }}>
              🌳 {Math.round(co2SavedKg / 22)} Trees Equivalent
            </div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Your simulation offset is equal to planting {Math.round(co2SavedKg / 22)} mature trees annually.</div>
          </div>
        </section>

        {/* Visualized bar chart comparisons */}
        <section className={`glass-panel ${styles.card}`} style={{ gridColumn: '1 / -1' }}>
          <h2>Twin Category Comparison (kg CO₂e/yr)</h2>
          <div style={{ display: 'flex', height: '200px', alignItems: 'flex-end', gap: '2rem', marginTop: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            {[
              { label: 'Transport', curr: current.transport, opt: optTransport },
              { label: 'Energy', curr: current.energy, opt: optEnergy },
              { label: 'Food', curr: current.food, opt: optFood },
              { label: 'Shopping', curr: current.shopping, opt: current.shopping },
              { label: 'Waste', curr: current.waste, opt: current.waste },
            ].map(({ label, curr, opt }) => {
              const maxVal = Math.max(current.transport, current.energy, current.food, 3000);
              const currPct = (curr / maxVal) * 100;
              const optPct = (opt / maxVal) * 100;
              return (
                <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ display: 'flex', gap: '4px', width: '60px', height: '100%', alignItems: 'flex-end', justifyContent: 'center' }}>
                    {/* Current Bar */}
                    <div style={{ width: '22px', background: 'rgba(255,255,255,0.15)', height: `${currPct}%`, borderRadius: '4px 4px 0 0', position: 'relative' }} title={`Current: ${curr} kg`}></div>
                    {/* Optimized Bar */}
                    <div style={{ width: '22px', background: 'var(--primary)', height: `${optPct}%`, borderRadius: '4px 4px 0 0', transition: 'height 0.4s ease' }} title={`Optimized: ${opt} kg`}></div>
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{label}</span>
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{opt} / {curr}</span>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', justifyContent: 'center', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', background: 'rgba(255,255,255,0.15)', borderRadius: '2px' }}></div>
              <span>Current Model</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', background: 'var(--primary)', borderRadius: '2px' }}></div>
              <span>Twin Model (Optimized)</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
