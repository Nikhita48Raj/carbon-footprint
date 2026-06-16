"use client";
import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import useStore from '@/store/useStore';
import styles from "./page.module.css";
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { getRealtimeTickRate } from '@/lib/calculator';
import DigitalTwin from '@/components/DigitalTwin';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler);

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { dashboardData, dashboardLoading, fetchDashboard, realtimeKgCO2e, setRealtimeKgCO2e, goals, fetchGoals, showToast } = useStore();
  const tickRef = useRef(null);

  const handleResetDemo = async () => {
    try {
      const res = await fetch('/api/demo', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Demo reset failed');
      showToast('Demo data seeded successfully! Log in as demo@ecotrack.org / password123');
      fetchDashboard();
      fetchGoals();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Auth guard
  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
  }, [status, router]);

  // Fetch dashboard data on mount
  useEffect(() => {
    if (status === 'authenticated') {
      fetchDashboard();
      fetchGoals();
    }
  }, [status]);

  // Real-time ticker
  useEffect(() => {
    const annual = dashboardData?.annualProjection ?? 4200;
    const tick = dashboardData?.tickRate ?? getRealtimeTickRate(annual);

    // Seed the real-time meter at ~45% of the annual projection (mid-year estimate)
    setRealtimeKgCO2e(annual * 0.45);

    tickRef.current = setInterval(() => {
      setRealtimeKgCO2e(prev => prev + tick * 2);
    }, 2000);

    return () => clearInterval(tickRef.current);
  }, [dashboardData]);

  if (status === 'loading' || dashboardLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ width: '48px', height: '48px', border: '3px solid rgba(16,185,129,0.2)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ color: 'rgba(255,255,255,0.6)' }}>Loading your carbon data...</p>
      </div>
    );
  }

  const summary = dashboardData?.monthlySummary ?? { transport: 0, energy: 0, food: 0, shopping: 0, waste: 0, total: 0 };
  const trend   = dashboardData?.trend ?? [];
  const userName = dashboardData?.user?.name ?? session?.user?.name ?? 'Eco Warrior';
  const gamification = dashboardData?.user?.gamification ?? {};
  const monthChange = dashboardData?.monthChange ?? 0;

  const lineData = {
    labels: trend.map(t => t.label),
    datasets: [{
      label: 'Total Emissions (kg CO₂e)',
      data: trend.map(t => t.total),
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.08)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#10b981',
    }],
  };

  const doughnutData = {
    labels: ['Transport', 'Energy', 'Food', 'Shopping', 'Waste'],
    datasets: [{
      data: [summary.transport, summary.energy, summary.food, summary.shopping, summary.waste],
      backgroundColor: ['#ef4444','#f59e0b','#10b981','#3b82f6','#8b5cf6'],
      borderWidth: 0,
    }],
  };

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: 'white' } } },
    scales: {
      x: { ticks: { color: 'rgba(255,255,255,0.6)' }, grid: { color: 'rgba(255,255,255,0.05)' } },
      y: { ticks: { color: 'rgba(255,255,255,0.6)' }, grid: { color: 'rgba(255,255,255,0.05)' } },
    },
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.userInfo}>
          <h1 className={styles.greeting}>Welcome back, {userName.split(' ')[0]}</h1>
          <p className={styles.level}>Level {gamification.level ?? 1} · {gamification.streakDays ?? 0} Day Streak 🔥</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={handleResetDemo}
            className="btn-secondary"
            style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', border: '1px solid var(--primary)', color: 'var(--primary)', background: 'transparent', borderRadius: '4px', cursor: 'pointer' }}
          >
            🔄 Reset Demo Mode
          </button>
          <div className={styles.streak}>
            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Total Points</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary)' }}>{gamification.totalPoints ?? 0} pts</span>
          </div>
        </div>
      </header>

      {/* Real-Time Meter */}
      <section className="glass-panel" style={{ padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(59,130,246,0.08))', borderLeft: '4px solid var(--primary)', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--primary)', margin: 0 }}>⚡ Real-Time Carbon Meter</h2>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>Live estimate · updates every 2 seconds</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-1px' }}>
            {realtimeKgCO2e.toFixed(4)}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>kg CO₂e this year</div>
        </div>
      </section>

      {/* Digital Twin Section */}
      <section className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--primary)', marginBottom: '1rem', width: '100%', textAlign: 'left' }}>🌍 Your SVG Digital Twin</h2>
        <DigitalTwin 
          co2e={summary.total} 
          energySource={dashboardData?.user?.profile?.energySource || 'grid'} 
          goalsCompleted={goals?.filter(g => g.status === 'completed').length || 0}
        />
      </section>

      {summary.total === 0 && (
        <section className="glass-panel" style={{ padding: '2.5rem', marginBottom: '1.5rem', textAlign: 'center', background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(59,130,246,0.12))', border: '1px dashed var(--primary)' }}>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>🌱 Start Your Carbon Reduction Journey!</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', maxWidth: '600px', margin: '0 auto 1.5rem', lineHeight: '1.5' }}>
            Welcome to EcoTrack! You haven't logged any activities this month. Log your commutes, meals, or home energy usage to see your real-time carbon footprint and start reducing your impact.
          </p>
          <button className="btn-primary" onClick={() => router.push('/tracking')}>
            Log Your First Activity
          </button>
        </section>
      )}

      <div className={styles.grid}>
        {/* Monthly total */}
        <section className={`glass-panel ${styles.mainCard}`}>
          <h2>This Month</h2>
          <div className={styles.footprintValue}>
            <span style={{ fontSize: '3rem', fontWeight: 800 }}>{summary.total.toFixed(1)}</span>
            <span className={styles.unit}>kg CO₂e</span>
          </div>
          <p className={styles.comparison} style={{ color: monthChange <= 0 ? 'var(--success)' : '#ef4444' }}>
            {monthChange <= 0 ? '▼' : '▲'} {Math.abs(monthChange).toFixed(1)}% vs last month
          </p>
        </section>

        {/* Category breakdown */}
        <section className={`glass-panel ${styles.sideCard}`}>
          <h2>Category Breakdown</h2>
          {summary.total === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '150px' }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', fontSize: '0.9rem' }}>No data logged yet. Log your first activity to see your breakdown.</p>
            </div>
          ) : (
            <ul className={styles.categoryList}>
              {[
                { label: '🚗 Transport', val: summary.transport, color: '#ef4444' },
                { label: '⚡ Energy',    val: summary.energy,    color: '#f59e0b' },
                { label: '🍔 Food',      val: summary.food,      color: '#10b981' },
                { label: '🛍️ Shopping', val: summary.shopping,  color: '#3b82f6' },
                { label: '🗑️ Waste',    val: summary.waste,     color: '#8b5cf6' },
              ].map(({ label, val, color }) => (
                <li key={label} className={styles.categoryItem}>
                  <span style={{ fontSize: '0.85rem' }}>{label}</span>
                  <div className={styles.barContainer}>
                    <div className={styles.bar} style={{ width: summary.total ? `${(val / summary.total) * 100}%` : '0%', background: color }}></div>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', minWidth: '50px', textAlign: 'right' }}>{val.toFixed(1)} kg</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 6-month trend */}
        <section className="glass-panel" style={{ padding: '1.5rem', gridColumn: '1 / -1' }}>
          <h2 style={{ marginBottom: '1rem' }}>6-Month Emission Trend</h2>
          <div style={{ height: '250px', position: 'relative' }}>
            <Line data={lineData} options={chartOptions} />
          </div>
        </section>

        {/* Doughnut */}
        <section className="glass-panel" style={{ padding: '1.5rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Monthly Split</h2>
          {summary.total === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '150px' }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', fontSize: '0.9rem' }}>No emissions data for this month.</p>
            </div>
          ) : (
            <div style={{ height: '220px', position: 'relative' }}>
              <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: 'white', font: { size: 11 } } } } }} />
            </div>
          )}
        </section>

        {/* Benchmarks */}
        <section className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2>Global Benchmarks (Monthly)</h2>
          {[
            { label: 'Your Footprint', val: summary.total, color: 'var(--primary)' },
            { label: 'World Average', val: (dashboardData?.benchmarks?.world ?? 4700) / 12, color: '#f59e0b' },
            { label: 'Paris 2030 Target', val: (dashboardData?.benchmarks?.target ?? 2000) / 12, color: '#ef4444' },
          ].map(({ label, val, color }) => (
            <div key={label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.875rem' }}>
                <span>{label}</span>
                <span style={{ color, fontWeight: 600 }}>{val.toFixed(0)} kg</span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px' }}>
                <div style={{ height: '100%', width: `${Math.min((val / 600) * 100, 100)}%`, background: color, borderRadius: '999px', transition: 'width 1s ease' }}></div>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
