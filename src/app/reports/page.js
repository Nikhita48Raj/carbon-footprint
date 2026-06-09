"use client";
import styles from '../shared.module.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function Reports() {
  const lineData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Total Emissions (kg CO₂)',
        data: [400, 380, 390, 360, 340, 320],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const doughnutData = {
    labels: ['Transport', 'Energy', 'Food', 'Shopping', 'Waste'],
    datasets: [
      {
        data: [40, 30, 15, 10, 5],
        backgroundColor: [
          '#ef4444',
          '#f59e0b',
          '#10b981',
          '#3b82f6',
          '#8b5cf6'
        ],
        borderWidth: 0
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: 'white' } }
    },
    scales: {
      x: { ticks: { color: 'rgba(255,255,255,0.7)' }, grid: { color: 'rgba(255,255,255,0.1)' } },
      y: { ticks: { color: 'rgba(255,255,255,0.7)' }, grid: { color: 'rgba(255,255,255,0.1)' } }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right', labels: { color: 'white' } }
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Reporting & Analytics</h1>
        <p className={styles.subtitle}>Visualize your emission trends and category breakdowns over time.</p>
      </header>

      <div className={styles.grid}>
        <section className={`glass-panel ${styles.card}`} style={{gridColumn: '1 / -1'}}>
          <h2>6-Month Emission Trend</h2>
          <div style={{height: '300px', display: 'flex', justifyContent: 'center', position: 'relative'}}>
            <Line data={lineData} options={options} />
          </div>
        </section>

        <section className={`glass-panel ${styles.card}`}>
          <h2>Monthly Category Breakdown</h2>
          <div style={{height: '250px', display: 'flex', justifyContent: 'center', position: 'relative'}}>
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
        </section>

        <section className={`glass-panel ${styles.card}`}>
          <h2>Monthly Summary</h2>
          <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%'}}>
            <div style={{display: 'flex', justifyContent: 'space-between'}}>
              <span className={styles.label}>Total Emissions</span>
              <span style={{fontWeight: 'bold', fontSize: '1.2rem'}}>320 kg CO₂</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between'}}>
              <span className={styles.label}>Change vs Last Month</span>
              <span style={{color: 'var(--success)', fontWeight: 'bold', fontSize: '1.2rem'}}>-5.8%</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between'}}>
              <span className={styles.label}>Highest Contributor</span>
              <span style={{color: '#ef4444', fontWeight: 'bold', fontSize: '1.2rem'}}>Transport</span>
            </div>
            <button className="btn-primary" style={{marginTop: 'auto'}}>Download PDF Report</button>
          </div>
        </section>
      </div>
    </div>
  );
}
