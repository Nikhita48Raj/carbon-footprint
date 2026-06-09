import styles from '../shared.module.css';

export default function Insights() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Insights & Recommendations</h1>
        <p className={styles.subtitle}>AI-powered suggestions to help you reduce your footprint efficiently.</p>
      </header>

      <div className={styles.grid}>
        <section className={`glass-panel ${styles.card}`} style={{gridColumn: '1 / -1'}}>
          <h2>Top Actionable Recommendations</h2>
          <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem'}}>
            
            <div style={{background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '8px', display: 'flex', gap: '1.5rem', alignItems: 'center'}}>
              <div style={{fontSize: '3rem'}}>🚇</div>
              <div style={{flex: 1}}>
                <h3 style={{fontSize: '1.25rem'}}>Switch to Public Transit</h3>
                <p style={{color: 'rgba(255,255,255,0.7)', marginTop: '0.25rem'}}>You log 5 car trips a week. Switching 2 of these to public transit can have a massive impact.</p>
              </div>
              <div style={{textAlign: 'right'}}>
                <div style={{color: 'var(--success)', fontWeight: 'bold', fontSize: '1.5rem'}}>-120 kg</div>
                <div style={{fontSize: '0.8rem', opacity: 0.6}}>CO₂ / year</div>
                <button className="btn-primary" style={{padding: '0.5rem 1rem', marginTop: '0.5rem', fontSize: '0.8rem'}}>Accept Challenge</button>
              </div>
            </div>

            <div style={{background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '8px', display: 'flex', gap: '1.5rem', alignItems: 'center'}}>
              <div style={{fontSize: '3rem'}}>💡</div>
              <div style={{flex: 1}}>
                <h3 style={{fontSize: '1.25rem'}}>LED Lighting Upgrade</h3>
                <p style={{color: 'rgba(255,255,255,0.7)', marginTop: '0.25rem'}}>Replacing your 10 remaining incandescent bulbs will save energy and money.</p>
              </div>
              <div style={{textAlign: 'right'}}>
                <div style={{color: 'var(--success)', fontWeight: 'bold', fontSize: '1.5rem'}}>-85 kg</div>
                <div style={{fontSize: '0.8rem', opacity: 0.6}}>CO₂ / year</div>
                <button className="btn-primary" style={{padding: '0.5rem 1rem', marginTop: '0.5rem', fontSize: '0.8rem'}}>Accept Challenge</button>
              </div>
            </div>

          </div>
        </section>
      </div>
    </div>
  );
}
