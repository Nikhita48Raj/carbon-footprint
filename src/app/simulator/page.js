"use client";
import { useState } from 'react';
import styles from '../shared.module.css';

export default function Simulator() {
  const [carDays, setCarDays] = useState(5);
  const [meatMeals, setMeatMeals] = useState(14);
  const [energyReduction, setEnergyReduction] = useState(0);

  const baseCO2 = 4200; // kg CO2 per year
  const savings = ((5 - carDays) * 200) + ((14 - meatMeals) * 50) + (energyReduction * 30);
  const newCO2 = baseCO2 - savings;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Carbon Impact Simulator</h1>
        <p className={styles.subtitle}>See "What happens if..." you change your habits.</p>
      </header>

      <div className={styles.grid}>
        <section className={`glass-panel ${styles.card}`}>
          <h2>Adjust Your Scenarios</h2>
          
          <div className={styles.inputGroup}>
            <label htmlFor="sim-car-days" className={styles.label}>Days commuting by car per week: {carDays}</label>
            <input id="sim-car-days" type="range" min="0" max="7" value={carDays} onChange={(e)=>setCarDays(e.target.value)} aria-label="Days commuting by car per week" aria-valuemin="0" aria-valuemax="7" aria-valuenow={carDays} style={{width: '100%'}}/>
          </div>

          <div className={styles.inputGroup} style={{marginTop: '1rem'}}>
            <label htmlFor="sim-meat-meals" className={styles.label}>Meat-heavy meals per week: {meatMeals}</label>
            <input id="sim-meat-meals" type="range" min="0" max="21" value={meatMeals} onChange={(e)=>setMeatMeals(e.target.value)} aria-label="Meat-heavy meals per week" aria-valuemin="0" aria-valuemax="21" aria-valuenow={meatMeals} style={{width: '100%'}}/>
          </div>

          <div className={styles.inputGroup} style={{marginTop: '1rem'}}>
            <label htmlFor="sim-energy-red" className={styles.label}>Reduce home energy usage by (%): {energyReduction}%</label>
            <input id="sim-energy-red" type="range" min="0" max="50" step="5" value={energyReduction} onChange={(e)=>setEnergyReduction(e.target.value)} aria-label="Reduce home energy usage percentage" aria-valuemin="0" aria-valuemax="50" aria-valuenow={energyReduction} style={{width: '100%'}}/>
          </div>
        </section>

        <section className={`glass-panel ${styles.card}`} style={{justifyContent: 'center', alignItems: 'center', textAlign: 'center'}}>
          <h2>Estimated Annual Impact</h2>
          <div style={{fontSize: '4rem', fontWeight: 'bold', color: 'var(--success)', lineHeight: '1'}}>
            -{savings}
          </div>
          <p style={{color: 'rgba(255,255,255,0.7)'}}>kg CO₂e saved per year</p>
          
          <div style={{marginTop: '2rem', width: '100%', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px'}}>
            <div style={{fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)'}}>New Projected Footprint</div>
            <div style={{fontSize: '2rem', fontWeight: 'bold'}}>{(newCO2 / 1000).toFixed(2)} Tons</div>
          </div>
        </section>
      </div>
    </div>
  );
}
