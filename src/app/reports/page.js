"use client";
import { useEffect } from 'react';
import useStore from '@/store/useStore';
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
  const { dashboardData, dashboardLoading, fetchDashboard } = useStore();

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (dashboardLoading) {
    return (
      <div className={styles.container}>
        <p style={{ color: 'rgba(255,255,255,0.5)' }}>Loading report data...</p>
      </div>
    );
  }

  const defaultTrend = [0, 0, 0, 0, 0, 0];
  const defaultLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

  const trendLabels = dashboardData?.trend ? dashboardData.trend.map(t => t.label) : defaultLabels;
  const trendData = dashboardData?.trend ? dashboardData.trend.map(t => t.total) : defaultTrend;

  const monthlySummary = dashboardData?.monthlySummary || {
    transport: 0,
    energy: 0,
    food: 0,
    shopping: 0,
    waste: 0,
    total: 0,
  };

  const lineData = {
    labels: trendLabels,
    datasets: [
      {
        label: 'Total Emissions (kg CO₂e)',
        data: trendData,
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
        data: [
          monthlySummary.transport,
          monthlySummary.energy,
          monthlySummary.food,
          monthlySummary.shopping,
          monthlySummary.waste
        ],
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

  // Extract highest contributor
  const categories = ['transport', 'energy', 'food', 'shopping', 'waste'];
  let highestCategory = 'None';
  let highestValue = 0;
  categories.forEach(cat => {
    const val = monthlySummary[cat] || 0;
    if (val > highestValue) {
      highestValue = val;
      highestCategory = cat;
    }
  });

  const monthChange = dashboardData?.monthChange ?? 0;

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
              <span style={{fontWeight: 'bold', fontSize: '1.2rem'}}>{monthlySummary.total.toFixed(1)} kg CO₂e</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between'}}>
              <span className={styles.label}>Change vs Last Month</span>
              <span style={{
                color: monthChange < 0 ? 'var(--success)' : monthChange > 0 ? '#ef4444' : 'white',
                fontWeight: 'bold',
                fontSize: '1.2rem'
              }}>
                {monthChange > 0 ? '+' : ''}{monthChange.toFixed(1)}%
              </span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between'}}>
              <span className={styles.label}>Highest Contributor</span>
              <span style={{
                color: highestCategory !== 'None' ? '#ef4444' : 'white',
                fontWeight: 'bold',
                fontSize: '1.2rem',
                textTransform: 'capitalize'
              }}>
                {highestCategory}
              </span>
            </div>
            <button className="btn-primary" style={{marginTop: 'auto'}} onClick={() => window.print()}>
              Download PDF Report
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
