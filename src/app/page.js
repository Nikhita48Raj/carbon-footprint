import styles from './page.module.css';
import Link from 'next/link';

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.hero}>
        <h1 className="heading-lg">EcoTrack</h1>
        <p className={styles.subtitle}>
          Understand, track, and reduce your carbon footprint through actionable insights and gamified goals.
        </p>
        <Link href="/onboarding" className="btn-primary">Start Your Journey</Link>
      </div>

      <div className={`glass-panel ${styles.dashboardPreview}`}>
        <h2>Your Environmental Impact</h2>
        <div className={styles.metricsRow}>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Total Footprint</span>
            <span className={styles.metricValue}>4.2 <small>tons CO₂e</small></span>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Monthly Change</span>
            <span className={styles.metricValueSuccess}>-12%</span>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Current Goal</span>
            <span className={styles.metricValue}>Eco Explorer</span>
          </div>
        </div>
      </div>
    </main>
  );
}
