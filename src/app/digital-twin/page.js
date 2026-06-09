"use client";
import styles from '../shared.module.css';
import { useState, useEffect } from 'react';

export default function DigitalTwin() {
  const [activeScenario, setActiveScenario] = useState('current');
  const [twinData, setTwinData] = useState({
    transport: 40, energy: 35, food: 15, shopping: 10
  });

  const runSimulation = () => {
    setActiveScenario('optimized');
    setTwinData({ transport: 20, energy: 25, food: 10, shopping: 8 });
  };

  const resetSimulation = () => {
    setActiveScenario('current');
    setTwinData({ transport: 40, energy: 35, food: 15, shopping: 10 });
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Digital Carbon Twin</h1>
        <p className={styles.subtitle}>A live model of your lifestyle. Simulate your optimal eco-self.</p>
      </header>

      <div className={styles.grid}>
        <section className={`glass-panel ${styles.card}`} style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'row', gap: '2rem' }}>
          
          <div style={{ flex: 1, padding: '2rem', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
            <h2>Current Lifestyle</h2>
            <div style={{ fontSize: '3rem', fontWeight: 'bold', margin: '1rem 0' }}>4.2T <span style={{fontSize: '1rem', color: 'rgba(255,255,255,0.5)'}}>CO₂e</span></div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <li>🚗 Drive 5 days/week</li>
              <li>🍔 Meat 14 meals/week</li>
              <li>⚡ Standard Grid Energy</li>
            </ul>
            <button className="btn-primary" style={{ marginTop: '2rem', opacity: activeScenario === 'current' ? 1 : 0.5 }} onClick={resetSimulation}>View Current Model</button>
          </div>

          <div style={{ flex: 1, padding: '2rem' }}>
            <h2 style={{color: 'var(--primary)'}}>Optimized Twin</h2>
            <div style={{ fontSize: '3rem', fontWeight: 'bold', margin: '1rem 0', color: 'var(--success)' }}>2.1T <span style={{fontSize: '1rem', color: 'rgba(255,255,255,0.5)'}}>CO₂e</span></div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem', color: 'rgba(255,255,255,0.8)' }}>
              <li>🚇 Transit 3 days/week <span style={{color: 'var(--success)'}}>(-45%)</span></li>
              <li>🥗 Meat 4 meals/week <span style={{color: 'var(--success)'}}>(-30%)</span></li>
              <li>☀️ 50% Solar Energy <span style={{color: 'var(--success)'}}>(-60%)</span></li>
            </ul>
            <button className="btn-primary" style={{ marginTop: '2rem', background: 'var(--secondary)', opacity: activeScenario === 'optimized' ? 1 : 0.5 }} onClick={runSimulation}>Simulate Optimized Twin</button>
          </div>

        </section>

        <section className={`glass-panel ${styles.card}`} style={{ gridColumn: '1 / -1' }}>
          <h2>Model Data Visualization</h2>
          <div style={{ display: 'flex', height: '150px', alignItems: 'flex-end', gap: '1rem', marginTop: '2rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
            {Object.keys(twinData).map((key) => (
              <div key={key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '100%', background: activeScenario === 'optimized' ? 'var(--success)' : 'var(--primary)', height: `${twinData[key]}%`, borderRadius: '4px 4px 0 0', transition: 'height 1s cubic-bezier(0.4, 0, 0.2, 1), background 1s' }}></div>
                <span style={{ textTransform: 'capitalize', fontSize: '0.8rem' }}>{key}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
