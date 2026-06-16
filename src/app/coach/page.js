"use client";
import { useState } from 'react';
import styles from '../shared.module.css';

export default function Coach() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hi! I am your AI Sustainability Advisor. I can answer questions or generate a personalized Weekly Action Plan for you based on your recent activities and carbon profile.' }
  ]);
  const [input, setInput] = useState('');
  const [generating, setGenerating] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || generating) return;
    const userMsg = input.trim();
    const newMsgs = [...messages, { role: 'user', text: userMsg }];
    setMessages(newMsgs);
    setInput('');
    setGenerating(true);

    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg }),
      });
      if (!res.ok) throw new Error('Failed to generate response');
      const data = await res.json();
      setMessages([...newMsgs, { role: 'assistant', text: data.text }]);
    } catch (err) {
      setMessages([...newMsgs, { role: 'assistant', text: 'Sorry, I encountered an issue connecting to the carbon advisor engine. Please try again.' }]);
    } finally {
      setGenerating(false);
    }
  };

  const generateWeeklyPlan = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generateWeeklyPlan' }),
      });
      if (!res.ok) throw new Error('Failed to generate plan');
      const data = await res.json();
      setMessages([...messages, { role: 'assistant', text: data.text }]);
    } catch (err) {
      setMessages([...messages, { role: 'assistant', text: 'Failed to generate your personalized action plan. Please check your network connection.' }]);
    } finally {
      setGenerating(false);
    }
  };

  const renderSafeMessage = (text) => {
    const lines = text.split('\n');
    return lines.map((line, lineIdx) => {
      const isBullet = line.trim().startsWith('*');
      const cleanLine = isBullet ? line.replace(/^\*\s*/, '• ') : line;
      
      const parts = cleanLine.split(/\*\*/g);
      const elements = parts.map((part, partIdx) => {
        if (partIdx % 2 === 1) {
          return <strong key={partIdx}>{part}</strong>;
        }
        return part;
      });
      return (
        <div key={lineIdx} style={{ minHeight: '1.2em' }}>
          {elements}
        </div>
      );
    });
  };

  return (
    <div className={styles.container} style={{maxHeight: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column'}}>
      <header className={styles.header}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%'}}>
          <div>
            <h1 className={styles.title}>AI Sustainability Advisor</h1>
            <p className={styles.subtitle}>Your generative AI assistant for a greener lifestyle.</p>
          </div>
          <button className="btn-primary" onClick={generateWeeklyPlan} disabled={generating}>
            {generating ? 'Generating...' : 'Generate Weekly Action Plan'}
          </button>
        </div>
      </header>

      <div className={`glass-panel`} style={{display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', marginTop: '1rem', borderRadius: '1rem', minHeight: '400px'}}>
        <div style={{flex: 1, padding: '2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
          {messages.map((m, i) => (
            <div key={i} style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              background: m.role === 'user' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
              border: m.role === 'assistant' ? '1px solid rgba(255,255,255,0.1)' : 'none',
              padding: '1.25rem 1.5rem',
              borderRadius: '1rem',
              maxWidth: '75%',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
              fontSize: '0.95rem',
              color: 'white'
            }}>
              {renderSafeMessage(m.text)}
            </div>
          ))}
          {generating && (
            <div style={{alignSelf: 'flex-start', display: 'flex', gap: '0.5rem', alignItems: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem'}}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', animation: 'pulse 1s infinite alternate' }}></div>
              Advisor is composing...
            </div>
          )}
        </div>
        
        <div style={{padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '1rem'}}>
          <input 
            type="text" 
            className={styles.input} 
            style={{flex: 1}} 
            placeholder="Ask about your footprint, diet, or commutes..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={generating}
          />
          <button className="btn-primary" onClick={handleSend} disabled={generating || !input.trim()}>Send</button>
        </div>
      </div>
    </div>
  );
}
