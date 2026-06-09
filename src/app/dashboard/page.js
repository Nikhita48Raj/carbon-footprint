import styles from "./page.module.css";
import Link from 'next/link';

export default function Dashboard() {
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
        {/* Total Footprint */}
        <section className={`glass-panel ${styles.mainCard}`}>
          <h2>Your Total Carbon Footprint</h2>
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

        {/* Actions / Recommendations */}
        <section className={`glass-panel ${styles.fullWidthCard}`}>
          <div className={styles.actionHeader}>
            <h2>AI Sustainability Coach</h2>
            <button className="btn-primary" style={{padding: '0.5rem 1rem', fontSize: '0.875rem'}}>Log Activity</button>
          </div>
          <div className={styles.recommendations}>
            <div className={styles.recCard}>
              <h3>Opt for Public Transit</h3>
              <p>Taking the bus twice a week could save 120kg CO₂e.</p>
              <span className={styles.impactHigh}>High Impact</span>
            </div>
            <div className={styles.recCard}>
              <h3>Meatless Monday</h3>
              <p>Skip meat one day a week to reduce food footprint by 10%.</p>
              <span className={styles.impactMedium}>Medium Impact</span>
            </div>
            <div className={styles.recCard}>
              <h3>LED Upgrade</h3>
              <p>Replace 5 bulbs to save energy costs.</p>
              <span className={styles.impactLow}>Low Impact</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
