"use client";
import styles from "./page.module.css";
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [liveEmissions, setLiveEmissions] = useState(3.81052);

  // Simulate real-time ticking meter
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveEmissions(prev => prev + 0.00001);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.userInfo}>
          <h1 className={styles.greeting}>Welcome back, Eco Warrior</h1>
          <p className={styles.level}>Level 3: Climate Advocate</p>
        </div>
        <div className={styles.streak}>
          🔥 5 Day Streak
        </div>
      </header>

      <div className={styles.grid}>
        {/* Real-Time Meter (NEW) */}
        <section className={`glass-panel ${styles.fullWidthCard}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(90deg, rgba(16,185,129,0.1), rgba(59,130,246,0.1))' }}>
          <div>
            <h2 style={{color: 'var(--primary)'}}>Real-Time Carbon Footprint Meter</h2>
            <p style={{color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem'}}>Live estimate based on your active smart devices and baseline habits.</p>
          </div>
          <div style={{textAlign: 'right'}}>
            <div style={{fontFamily: 'monospace', fontSize: '3.5rem', fontWeight: 'bold', color: 'var(--foreground)'}}>
              {liveEmissions.toFixed(5)} <span style={{fontSize: '1.2rem', color: 'rgba(255,255,255,0.5)'}}>Tons CO₂e</span>
            </div>
          </div>
        </section>

        {/* Total Footprint */}
        <section className={`glass-panel ${styles.mainCard}`}>
          <h2>Your Annual Baseline</h2>
          <div className={styles.footprintValue}>
            <span className="heading-lg">3.8</span>
            <span className={styles.unit}>Tons CO₂e / Year</span>
          </div>
          <p className={styles.comparison}>You are <strong>20% below</strong> the national average! 🎉</p>
        </section>

        {/* Breakdown */}
        <section className={`glass-panel ${styles.sideCard}`}>
          <h2>Category Breakdown</h2>
          <ul className={styles.categoryList}>
            <li className={styles.categoryItem}>
              <span>🚗 Transport</span>
              <div className={styles.barContainer}><div className={styles.bar} style={{width: '40%', background: '#ef4444'}}></div></div>
            </li>
            <li className={styles.categoryItem}>
              <span>⚡ Energy</span>
              <div className={styles.barContainer}><div className={styles.bar} style={{width: '30%', background: '#f59e0b'}}></div></div>
            </li>
            <li className={styles.categoryItem}>
              <span>🍔 Food</span>
              <div className={styles.barContainer}><div className={styles.bar} style={{width: '20%', background: '#10b981'}}></div></div>
            </li>
            <li className={styles.categoryItem}>
              <span>🛍️ Shopping</span>
              <div className={styles.barContainer}><div className={styles.bar} style={{width: '10%', background: '#3b82f6'}}></div></div>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
