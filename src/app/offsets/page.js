import styles from '../shared.module.css';

export default function Offsets() {
  const projects = [
    { id: 1, title: 'Amazon Reforestation', type: 'Tree Planting', cost: '$15 / ton', impact: 'High', img: '🌳' },
    { id: 2, title: 'Wind Farm Development', type: 'Renewable Energy', cost: '$25 / ton', impact: 'Very High', img: '💨' },
    { id: 3, title: 'Ocean Clean-up', type: 'Waste Reduction', cost: '$10 / ton', impact: 'Medium', img: '🌊' },
    { id: 4, title: 'Methane Capture', type: 'Industrial', cost: '$18 / ton', impact: 'High', img: '🏭' },
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Carbon Offset Marketplace</h1>
        <p className={styles.subtitle}>Invest in verified global projects to offset your unavoidable emissions.</p>
      </header>

      <div className={styles.grid}>
        {projects.map(project => (
          <section key={project.id} className={`glass-panel ${styles.card}`}>
            <div style={{ fontSize: '4rem', textAlign: 'center', margin: '1rem 0' }}>{project.img}</div>
            <h2 style={{ textAlign: 'center' }}>{project.title}</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', margin: '1rem 0' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Type</span>
                <span style={{ fontWeight: 'bold' }}>{project.type}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Cost</span>
                <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{project.cost}</span>
              </div>
            </div>
            <button className="btn-primary" style={{ width: '100%' }}>Purchase Offsets</button>
          </section>
        ))}
      </div>
    </div>
  );
}
