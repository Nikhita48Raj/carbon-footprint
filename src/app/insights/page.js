"use client";
import styles from '../shared.module.css';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import useStore from '@/store/useStore';

export default function Insights() {
  const { data: session } = useSession();
  const { showToast } = useStore();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('impact'); // 'impact', 'cost', 'roi'
  const [activatingId, setActivatingId] = useState(null);

  useEffect(() => {
    async function getProfile() {
      try {
        const res = await fetch('/api/user/profile');
        if (res.ok) {
          const data = await res.json();
          setProfileData(data);
        }
      } catch (err) {
        console.error('Error fetching profile for insights:', err);
      } finally {
        setLoading(false);
      }
    }
    if (session) getProfile();
    else setLoading(false);
  }, [session]);

  const generateRecommendations = () => {
    const profile = profileData?.profile || {};
    const diet = profile.diet || 'avg_meat';
    const transport = profile.transportMode || 'car_petrol';
    const energy = profile.energySource || 'grid';

    const list = [];

    // 1. Food Recommendation
    if (diet === 'high_meat' || diet === 'avg_meat' || diet === 'omnivore') {
      list.push({
        id: 'rec_meatless_mondays',
        icon: '🥗',
        title: 'Adopt Meatless Mondays',
        description: 'Swap beef/lamb meals for plant-based alternatives just one day a week.',
        impact: 280, // kg CO2e/yr
        cost: -150, // negative cost means it saves money
        difficulty: 'Easy',
        category: 'food',
        goalTarget: 10, // 10% reduction goal
      });
    }

    // 2. Transport Recommendation
    if (transport.includes('car_petrol') || transport.includes('car_diesel')) {
      list.push({
        id: 'rec_transit_shift',
        icon: '🚇',
        title: 'Switch Commutes to Transit',
        description: 'Replace 2 solo car drives per week with public transit (bus, train, or metro).',
        impact: 620,
        cost: -340, // saves fuel and maintenance
        difficulty: 'Medium',
        category: 'transport',
        goalTarget: 15,
      });
    } else if (transport.includes('hybrid') || transport.includes('electric')) {
      list.push({
        id: 'rec_eco_driving',
        icon: '⚡',
        title: 'Optimize Charging Windows',
        description: 'Charge your vehicle exclusively during off-peak hours when grid carbon intensity is lowest.',
        impact: 180,
        cost: -80, // off-peak electricity is cheaper
        difficulty: 'Easy',
        category: 'transport',
        goalTarget: 5,
      });
    }

    // 3. Home Energy Recommendations
    if (energy === 'grid') {
      list.push({
        id: 'rec_smart_thermostat',
        icon: '🌡️',
        title: 'Install a Smart Thermostat',
        description: 'Automate temperature setbacks by 2°C when away or sleeping to save on natural gas/electricity.',
        impact: 350,
        cost: 120, // upfront cost of smart thermostat
        difficulty: 'Easy',
        category: 'energy',
        goalTarget: 10,
      });

      list.push({
        id: 'rec_solar_panels',
        icon: '☀️',
        title: 'Switch to Solar Energy',
        description: 'Install a rooftop solar array to offset 80% of your grid electricity usage.',
        impact: 1800,
        cost: 6500, // high upfront investment
        difficulty: 'Hard',
        category: 'energy',
        goalTarget: 30,
      });
    }

    // 4. Waste Recommendation
    list.push({
      id: 'rec_composting',
      icon: '🗑️',
      title: 'Compost Organic Waste',
      description: 'Divert food scraps from landfill to composting, avoiding methane production.',
      impact: 120,
      cost: 15, // cost of composting bin
      difficulty: 'Easy',
      category: 'waste',
      goalTarget: 5,
    });

    // 5. Shopping Recommendation
    list.push({
      id: 'rec_thrift_shopping',
      icon: '🛍️',
      title: 'Choose Sustainable Clothing',
      description: 'Commit to buying thrifted or certified eco-labeled garments instead of fast fashion.',
      impact: 95,
      cost: -200, // saves shopping budget
      difficulty: 'Easy',
      category: 'shopping',
      goalTarget: 5,
    });

    // Sort list based on active sorting filter
    return list.sort((a, b) => {
      if (sortBy === 'impact') {
        return b.impact - a.impact; // high impact first
      }
      if (sortBy === 'cost') {
        return a.cost - b.cost; // cheap/savings first
      }
      if (sortBy === 'roi') {
        const roiA = a.impact / (Math.abs(a.cost) || 1);
        const roiB = b.impact / (Math.abs(b.cost) || 1);
        return roiB - roiA; // high efficiency first
      }
      return 0;
    });
  };

  const handleAcceptChallenge = async (rec) => {
    if (!session) {
      showToast('Please sign in to accept challenges.', 'error');
      return;
    }
    setActivatingId(rec.id);
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Challenge: ${rec.title}`,
          description: rec.description,
          type: 'reduction_percentage',
          category: rec.category,
          targetValue: rec.goalTarget,
          targetUnit: 'percent',
          period: 'monthly',
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        }),
      });
      if (!res.ok) throw new Error();
      showToast(`Challenge accepted! Goal registered. 🎯`);
    } catch (err) {
      showToast('Could not register goal.', 'error');
    } finally {
      setActivatingId(null);
    }
  };

  const recommendations = generateRecommendations();

  if (loading) {
    return (
      <div className={styles.container}>
        <p style={{ color: 'rgba(255,255,255,0.5)' }}>Generating your custom abatement recommendations...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className={styles.title}>Insights & Recommendations</h1>
          <p className={styles.subtitle}>Data-driven pathways ranked by carbon abatement potential, upfront cost, and ROI.</p>
        </div>
        
        {/* Sort Controls */}
        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.35rem', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.1)' }}>
          {[
            { value: 'impact', label: 'Highest Impact' },
            { value: 'cost', label: 'Lowest Cost' },
            { value: 'roi', label: 'Best ROI' }
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setSortBy(opt.value)}
              style={{
                background: sortBy === opt.value ? 'var(--primary)' : 'transparent',
                color: 'white',
                border: 'none',
                padding: '0.4rem 1rem',
                borderRadius: '999px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: sortBy === opt.value ? '600' : '400',
                transition: 'all 0.2s'
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </header>

      <div className={styles.grid}>
        <section className={`glass-panel ${styles.card}`} style={{ gridColumn: '1 / -1' }}>
          <h2>Abatement Opportunities</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
            
            {recommendations.map((rec) => {
              const roi = (rec.impact / (Math.abs(rec.cost) || 1)).toFixed(2);
              return (
                <div key={rec.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', padding: '1.5rem', borderRadius: '1rem', display: 'flex', gap: '1.5rem', alignItems: 'center', transition: 'transform 0.2s', hover: { transform: 'translateY(-2px)' } }}>
                  <div style={{ fontSize: '3rem', background: 'rgba(255,255,255,0.05)', width: '70px', height: '70px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {rec.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: '600' }}>{rec.title}</h3>
                      <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '999px', background: rec.difficulty === 'Easy' ? 'rgba(16,185,129,0.15)' : rec.difficulty === 'Medium' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)', color: rec.difficulty === 'Easy' ? 'var(--primary)' : rec.difficulty === 'Medium' ? '#f59e0b' : '#ef4444', textTransform: 'capitalize' }}>
                        {rec.difficulty}
                      </span>
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.65)', marginTop: '0.35rem', fontSize: '0.9rem', lineHeight: '1.4' }}>{rec.description}</p>
                  </div>
                  
                  <div style={{ textAlign: 'right', minWidth: '150px' }}>
                    <div style={{ color: 'var(--success)', fontWeight: 'bold', fontSize: '1.5rem' }}>-{rec.impact} kg</div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.1rem' }}>CO₂e saved / yr</div>
                    
                    <div style={{ fontSize: '0.85rem', fontWeight: '600', color: rec.cost < 0 ? '#10b981' : '#f59e0b', marginTop: '0.4rem' }}>
                      {rec.cost < 0 ? `Saves $${Math.abs(rec.cost)}/yr` : `Cost: $${rec.cost}`}
                    </div>
                    
                    <button 
                      className="btn-primary" 
                      style={{ padding: '0.4rem 1rem', marginTop: '0.75rem', fontSize: '0.8rem', width: '100%' }}
                      onClick={() => handleAcceptChallenge(rec)}
                      disabled={activatingId === rec.id}
                    >
                      {activatingId === rec.id ? 'Activating...' : 'Accept Challenge 🎯'}
                    </button>
                  </div>
                </div>
              );
            })}

          </div>
        </section>
      </div>
    </div>
  );
}
