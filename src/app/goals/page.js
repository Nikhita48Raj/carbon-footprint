"use client";
import styles from '../shared.module.css';

export default function Goals() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Goals & Gamification</h1>
        <p className={styles.subtitle}>Level up your sustainability by completing challenges.</p>
      </header>

      <div className={styles.grid}>
        <section className={`glass-panel ${styles.card}`}>
          <h2>Active Goals</h2>
          
          <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            <div>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem'}}>
                <span>Reduce Monthly Emissions by 10%</span>
                <span>65%</span>
              </div>
              <div style={{height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '999px'}}>
                <div style={{height: '100%', width: '65%', background: 'var(--primary)', borderRadius: '999px'}}></div>
              </div>
            </div>

            <div>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem'}}>
                <span>Meatless Weekdays (3/5 Days)</span>
                <span>60%</span>
              </div>
              <div style={{height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '999px'}}>
                <div style={{height: '100%', width: '60%', background: 'var(--secondary)', borderRadius: '999px'}}></div>
              </div>
            </div>
          </div>
          
          <button className="btn-primary" style={{marginTop: '1rem'}}>Set New Goal</button>
        </section>

        <section className={`glass-panel ${styles.card}`}>
          <h2>Badges & Achievements</h2>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
            <div style={{background: 'rgba(16,185,129,0.1)', padding: '1rem', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--primary)'}}>
              <div style={{fontSize: '2rem'}}>🌱</div>
              <div style={{fontWeight: 'bold', marginTop: '0.5rem'}}>Beginner</div>
            </div>
            <div style={{background: 'rgba(59,130,246,0.1)', padding: '1rem', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--secondary)'}}>
              <div style={{fontSize: '2rem'}}>🚲</div>
              <div style={{fontWeight: 'bold', marginTop: '0.5rem'}}>Green Commuter</div>
            </div>
            <div style={{background: 'rgba(245,158,11,0.1)', padding: '1rem', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--warning)'}}>
              <div style={{fontSize: '2rem'}}>🔥</div>
              <div style={{fontWeight: 'bold', marginTop: '0.5rem'}}>7-Day Streak</div>
            </div>
            <div style={{background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', textAlign: 'center', opacity: 0.5}}>
              <div style={{fontSize: '2rem'}}>♻️</div>
              <div style={{fontWeight: 'bold', marginTop: '0.5rem'}}>Waste Warrior</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
