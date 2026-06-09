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
            <label className={styles.label}>Days commuting by car per week: {carDays}</label>
            <input type="range" min="0" max="7" value={carDays} onChange={(e)=>setCarDays(e.target.value)} style={{width: '100%'}}/>
          </div>

          <div className={styles.inputGroup} style={{marginTop: '1rem'}}>
            <label className={styles.label}>Meat-heavy meals per week: {meatMeals}</label>
            <input type="range" min="0" max="21" value={meatMeals} onChange={(e)=>setMeatMeals(e.target.value)} style={{width: '100%'}}/>
          </div>

          <div className={styles.inputGroup} style={{marginTop: '1rem'}}>
            <label className={styles.label}>Reduce home energy usage by (%): {energyReduction}%</label>
            <input type="range" min="0" max="50" step="5" value={energyReduction} onChange={(e)=>setEnergyReduction(e.target.value)} style={{width: '100%'}}/>
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
