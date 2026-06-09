"use client";
import { useState } from 'react';
import styles from '../shared.module.css';

export default function Tracking() {
  const [category, setCategory] = useState('Transport');
  
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Log Activity</h1>
        <p className={styles.subtitle}>Track your daily emissions across categories.</p>
      </header>

      <div className={styles.grid}>
        <section className={`glass-panel ${styles.card}`}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Category</label>
            <select className={styles.select} value={category} onChange={(e) => setCategory(e.target.value)}>
              <option>Transport</option>
              <option>Energy</option>
              <option>Food</option>
              <option>Shopping</option>
              <option>Waste</option>
            </select>
          </div>

          {category === 'Transport' && (
            <>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Mode of Transport</label>
                <select className={styles.select}>
                  <option>Personal Car (Gasoline)</option>
                  <option>Personal Car (Electric)</option>
                  <option>Public Bus</option>
                  <option>Train / Subway</option>
                  <option>Flight</option>
                  <option>Bicycle / Walking</option>
                </select>
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Distance (km)</label>
                <input type="number" className={styles.input} placeholder="e.g. 15" />
              </div>
            </>
          )}

          {category === 'Energy' && (
            <>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Energy Type</label>
                <select className={styles.select}>
                  <option>Electricity</option>
                  <option>Natural Gas</option>
                </select>
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Amount (kWh or Therms)</label>
                <input type="number" className={styles.input} placeholder="e.g. 300" />
              </div>
            </>
          )}

          {category === 'Food' && (
            <>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Meal Type</label>
                <select className={styles.select}>
                  <option>High Meat (Beef/Lamb)</option>
                  <option>Average Meat</option>
                  <option>Pescatarian</option>
                  <option>Vegetarian</option>
                  <option>Vegan</option>
                </select>
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Number of Meals</label>
                <input type="number" className={styles.input} defaultValue={1} />
              </div>
            </>
          )}

          <button className="btn-primary" style={{marginTop: '1rem'}}>Calculate & Log</button>
        </section>

        <section className={`glass-panel ${styles.card}`}>
          <h2>Recent Logs</h2>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <li style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)'}}>
              <span>🚗 Car Commute (15km)</span>
              <span style={{color: '#ef4444'}}>+3.6 kg CO₂</span>
            </li>
            <li style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)'}}>
              <span>🍔 Vegetarian Lunch</span>
              <span style={{color: '#10b981'}}>+0.8 kg CO₂</span>
            </li>
            <li style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)'}}>
              <span>🚌 Bus Ride (8km)</span>
              <span style={{color: '#f59e0b'}}>+0.5 kg CO₂</span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
