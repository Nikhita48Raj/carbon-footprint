"use client";
import styles from '../shared.module.css';

export default function Education() {
  const articles = [
    { icon: '🌍', title: 'Climate Change Basics', desc: 'Understand the greenhouse effect and why your footprint matters.' },
    { icon: '♻️', title: 'Recycling 101', desc: 'What goes in the bin? A complete guide to household recycling.' },
    { icon: '⚡', title: 'Energy Efficiency at Home', desc: 'Simple tips to reduce electricity and gas consumption.' },
    { icon: '🥗', title: 'The Plant-Based Impact', desc: 'How dietary choices affect global emissions and water usage.' }
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Educational Hub</h1>
        <p className={styles.subtitle}>Learn about sustainability and climate action.</p>
      </header>

      <div className={styles.grid}>
        {articles.map((a, i) => (
          <section key={i} className={`glass-panel ${styles.card}`} style={{cursor: 'pointer', transition: 'transform 0.2s'}} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{fontSize: '3rem', marginBottom: '1rem'}}>{a.icon}</div>
            <h2>{a.title}</h2>
            <p style={{color: 'rgba(255,255,255,0.7)', flex: 1}}>{a.desc}</p>
            <div style={{marginTop: '1rem', color: 'var(--primary)', fontWeight: 'bold'}}>Read More &rarr;</div>
          </section>
        ))}
      </div>
    </div>
  );
}
