"use client";
import { useState } from 'react';
import styles from '../shared.module.css';

export default function Coach() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hi Eco Warrior! I am your AI Sustainability Advisor. I can answer questions or generate a personalized Weekly Action Plan for you based on your recent activity.' }
  ]);
  const [input, setInput] = useState('');
  const [generating, setGenerating] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;
    const newMsgs = [...messages, { role: 'user', text: input }];
    setMessages(newMsgs);
    setInput('');
    setGenerating(true);
    
    setTimeout(() => {
      setMessages([...newMsgs, { 
        role: 'assistant', 
        text: 'That\'s a great question! Based on your digital twin models, reducing meat consumption by just 2 meals a week will have the highest immediate impact on your footprint.' 
      }]);
      setGenerating(false);
    }, 1500);
  };

  const generateWeeklyPlan = () => {
    setGenerating(true);
    setTimeout(() => {
      setMessages([...messages, {
        role: 'assistant',
        text: `**Your Personalized Weekly Action Plan:**\n\n1. **Monday**: Participate in "Meatless Monday". (Impact: High)\n2. **Wednesday**: Work from home or take public transit to the office. (Impact: Very High)\n3. **Saturday**: Review your smart meter data and optimize your thermostat schedule. (Impact: Medium)\n\n*Why?* Your smart home integration shows your HVAC is running during peak grid hours. Shifting this can save you 5% in emissions this week alone!`
      }]);
      setGenerating(false);
    }, 2000);
  };

  return (
    <div className={styles.container} style={{maxHeight: '100vh', overflow: 'hidden'}}>
      <header className={styles.header}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div>
            <h1 className={styles.title}>AI Sustainability Advisor</h1>
            <p className={styles.subtitle}>Your generative AI assistant for a greener lifestyle.</p>
          </div>
          <button className="btn-primary" onClick={generateWeeklyPlan} disabled={generating}>
            {generating ? 'Generating...' : 'Generate Weekly Action Plan'}
          </button>
        </div>
      </header>

      <div className={`glass-panel`} style={{display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', marginTop: '1rem', borderRadius: '1rem'}}>
        <div style={{flex: 1, padding: '2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
          {messages.map((m, i) => (
            <div key={i} style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              background: m.role === 'user' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
              border: m.role === 'assistant' ? '1px solid rgba(255,255,255,0.1)' : 'none',
              padding: '1.5rem',
              borderRadius: '1rem',
              maxWidth: '75%',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap'
            }}>
              {m.text}
            </div>
          ))}
          {generating && <div style={{alignSelf: 'flex-start', color: 'rgba(255,255,255,0.5)'}}>AI is typing...</div>}
        </div>
        
        <div style={{padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '1rem'}}>
          <input 
            type="text" 
            className={styles.input} 
            style={{flex: 1}} 
            placeholder="Ask me anything..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={generating}
          />
          <button className="btn-primary" onClick={handleSend} disabled={generating}>Send</button>
        </div>
      </div>
    </div>
  );
}
