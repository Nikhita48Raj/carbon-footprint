"use client";
import styles from '../shared.module.css';
import { useState } from 'react';

export default function SmartHome() {
  const [devices, setDevices] = useState([
    { id: 1, name: 'Smart Thermostat', type: 'HVAC', connected: true, usage: 'Saving 12% Energy' },
    { id: 2, name: 'Solar Inverter', type: 'Energy Generation', connected: true, usage: 'Generated 5.2 kWh today' },
    { id: 3, name: 'Smart Meter', type: 'Grid', connected: false, usage: 'Not connected' },
    { id: 4, name: 'EV Charger', type: 'Transport', connected: false, usage: 'Not connected' }
  ]);

  const toggleConnect = (id) => {
    setDevices(devices.map(d => d.id === id ? { ...d, connected: !d.connected, usage: !d.connected ? 'Syncing data...' : 'Not connected' } : d));
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Smart Home Integrations</h1>
        <p className={styles.subtitle}>Connect your IoT devices for real-time, automated tracking.</p>
      </header>

      <div className={styles.grid}>
        {devices.map(device => (
          <div key={device.id} className={`glass-panel ${styles.card}`} style={{ borderLeft: device.connected ? '4px solid var(--success)' : '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2>{device.name}</h2>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>{device.type}</p>
              </div>
              <div style={{ padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.8rem', background: device.connected ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.1)', color: device.connected ? 'var(--success)' : 'white' }}>
                {device.connected ? 'Connected' : 'Offline'}
              </div>
            </div>
            
            <div style={{ margin: '1rem 0', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
              {device.usage}
            </div>

            <button 
              className={device.connected ? styles.btnSecondary : 'btn-primary'} 
              style={{ marginTop: 'auto', padding: '0.75rem', borderRadius: '8px', border: device.connected ? '1px solid rgba(255,255,255,0.2)' : 'none', color: 'white', background: device.connected ? 'transparent' : 'var(--primary)', cursor: 'pointer' }}
              onClick={() => toggleConnect(device.id)}
            >
              {device.connected ? 'Disconnect' : 'Connect Device'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
