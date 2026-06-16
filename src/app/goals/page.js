"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import useStore from '@/store/useStore';
import styles from '../shared.module.css';

export default function Goals() {
  const { data: session } = useSession();
  const { goals, goalsLoading, fetchGoals, createGoal, showToast } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    type: 'reduction_percentage',
    category: 'overall',
    targetValue: '',
    targetUnit: 'percent',
    period: 'monthly',
    endDate: '',
  });

  const handleTypeChange = (typeVal) => {
    let unit = 'percent';
    if (typeVal === 'category_limit') unit = 'kg_co2e';
    else if (typeVal === 'streak') unit = 'days';
    setForm(prev => ({
      ...prev,
      type: typeVal,
      targetUnit: unit,
    }));
  };

  useEffect(() => {
    if (session) fetchGoals();
  }, [session]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createGoal(form);
      showToast('Goal created! 🎯');
      setShowForm(false);
      setForm({ title: '', type: 'reduction_percentage', category: 'overall', targetValue: '', targetUnit: 'percent', period: 'monthly', endDate: '' });
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const progressPercent = (goal) =>
    Math.min((goal.currentValue / goal.targetValue) * 100, 100);

  return (
    <div className={styles.container}>
      <header className={styles.header} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className={styles.title}>Goals & Gamification</h1>
          <p className={styles.subtitle}>Set targets and earn badges as you reduce your footprint.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(v => !v)}>
          {showForm ? 'Cancel' : '+ New Goal'}
        </button>
      </header>

      {showForm && (
        <section className="glass-panel" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>Create New Goal</h2>
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
              <label className={styles.label}>Goal Title</label>
              <input className={styles.input} placeholder="e.g. Reduce transport emissions by 10%" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Goal Type</label>
              <select className={styles.select} value={form.type} onChange={e => handleTypeChange(e.target.value)}>
                <option value="reduction_percentage">% Reduction</option>
                <option value="category_limit">Category Limit (kg)</option>
                <option value="streak">Streak (days)</option>
              </select>
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Category</label>
              <select className={styles.select} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                <option value="overall">Overall</option>
                <option value="transport">Transport</option>
                <option value="energy">Energy</option>
                <option value="food">Food</option>
                <option value="shopping">Shopping</option>
                <option value="waste">Waste</option>
              </select>
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Target Value</label>
              <input type="number" min="1" className={styles.input} placeholder="e.g. 10" value={form.targetValue} onChange={e => setForm({ ...form, targetValue: e.target.value })} required />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Period</label>
              <select className={styles.select} value={form.period} onChange={e => setForm({ ...form, period: e.target.value })}>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="annual">Annual</option>
              </select>
            </div>
            <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
              <label className={styles.label}>Target Date</label>
              <input type="date" className={styles.input} value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} required />
            </div>
            <button type="submit" className="btn-primary" style={{ gridColumn: '1 / -1' }} disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Goal'}
            </button>
          </form>
        </section>
      )}

      <div className={styles.grid}>
        {goalsLoading ? (
          <p style={{ color: 'rgba(255,255,255,0.5)' }}>Loading goals...</p>
        ) : goals.length === 0 ? (
          <section className="glass-panel" style={{ padding: '2rem', gridColumn: '1 / -1', textAlign: 'center' }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.1rem' }}>No goals yet. Create one to start tracking progress!</p>
          </section>
        ) : (
          goals.map(goal => {
            const pct = progressPercent(goal);
            return (
              <section key={goal._id} className={`glass-panel ${styles.card}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h2 style={{ fontSize: '1.1rem' }}>{goal.title}</h2>
                    <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', textTransform: 'capitalize' }}>{goal.period} · {goal.category}</span>
                  </div>
                  <span style={{ background: goal.status === 'active' ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.1)', color: goal.status === 'active' ? 'var(--primary)' : 'white', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem' }}>
                    {goal.status}
                  </span>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                    <span>{goal.currentValue} / {goal.targetValue} {goal.targetUnit}</span>
                    <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{pct.toFixed(0)}%</span>
                  </div>
                  <div style={{ height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: 'var(--primary)', borderRadius: '999px', transition: 'width 0.8s ease' }}></div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {goal.milestones?.map(m => (
                    <span key={m.at} style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '999px', background: m.reached ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)', color: m.reached ? 'var(--primary)' : 'rgba(255,255,255,0.4)', border: `1px solid ${m.reached ? 'var(--primary)' : 'transparent'}` }}>
                      {m.reached ? '✓' : ''} {m.at}%
                    </span>
                  ))}
                </div>
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}
