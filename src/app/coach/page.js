"use client";
import { useState } from 'react';
import styles from '../shared.module.css';

export default function Coach() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hi Eco Warrior! I am your AI Sustainability Coach. Ask me anything about reducing your footprint, understanding your trends, or general eco-tips!' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    const newMsgs = [...messages, { role: 'user', text: input }];
    setMessages(newMsgs);
    setInput('');
    
    // Mock AI response
    setTimeout(() => {
      setMessages([...newMsgs, { 
        role: 'assistant', 
        text: 'That\'s a great question! Based on your recent logs, your transportation emissions have spiked this week. Try taking the train on Thursday to offset it.' 
      }]);
    }, 1000);
  };

  return (
    <div className={styles.container} style={{maxHeight: '100vh', overflow: 'hidden'}}>
      <header className={styles.header}>
        <h1 className={styles.title}>AI Sustainability Coach</h1>
        <p className={styles.subtitle}>Your personal assistant for a greener lifestyle.</p>
      </header>

      <div className={`glass-panel`} style={{display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', marginTop: '1rem', borderRadius: '1rem'}}>
        <div style={{flex: 1, padding: '2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem'}}>
          {messages.map((m, i) => (
            <div key={i} style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              background: m.role === 'user' ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
              padding: '1rem',
              borderRadius: '1rem',
              maxWidth: '70%',
              lineHeight: '1.5'
            }}>
              {m.text}
            </div>
          ))}
        </div>
        
        <div style={{padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '1rem'}}>
          <input 
            type="text" 
            className={styles.input} 
            style={{flex: 1}} 
            placeholder="e.g., Why is my footprint increasing?" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button className="btn-primary" onClick={handleSend}>Send</button>
        </div>
      </div>
    </div>
  );
}
