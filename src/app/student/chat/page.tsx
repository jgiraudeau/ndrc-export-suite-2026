'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}

export default function StudentChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content: 'Bonjour ! 👋 Je suis ton tuteur IA BTS NDRC. Tu peux me poser toutes tes questions sur ton cours, les épreuves E4, E5 ou E6, ou les outils numériques (WordPress, PrestaShop). Comment puis-je t\'aider ?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, history }),
      });
      const data = await res.json();
      const botMsg: Message = {
        role: 'model',
        content: data.content ?? '❌ Erreur du tuteur.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMsg]);
    } catch {
      setMessages(prev => [...prev, { role: 'model', content: '❌ Erreur réseau.', timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f2f8 0%, #e9e7f0 100%)', fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #5148d7, #4439cb)', padding: '1rem 2rem', boxShadow: '0 4px 20px rgba(81,72,215,0.3)' }}>
        <h1 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: 0 }}>
          🤖 Tuteur IA BTS NDRC
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8125rem', margin: 0 }}>
          Disponible 24h/24 — Propulsé par Gemini
        </p>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 800, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {msg.role === 'model' && (
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #5148d7, #4439cb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', marginRight: '0.5rem', flexShrink: 0 }}>🤖</div>
            )}
            <div style={{
              maxWidth: '75%', padding: '0.75rem 1rem',
              borderRadius: msg.role === 'user' ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
              background: msg.role === 'user' ? 'linear-gradient(135deg, #5148d7, #4439cb)' : '#fff',
              color: msg.role === 'user' ? '#fff' : '#31323a',
              boxShadow: '0 2px 12px rgba(49,50,58,0.08)',
              fontSize: '0.9375rem', lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
            }}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #5148d7, #4439cb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>🤖</div>
            <div style={{ background: '#fff', borderRadius: '1rem 1rem 1rem 0.25rem', padding: '0.75rem 1rem', boxShadow: '0 2px 12px rgba(49,50,58,0.08)' }}>
              <span style={{ color: '#5148d7', fontStyle: 'italic' }}>Tuteur en train de répondre...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input zone */}
      <div style={{ background: '#fff', borderTop: '1px solid #e9e7f0', padding: '1rem 2rem' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', gap: '0.75rem' }}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Pose ta question sur le cours, les épreuves E4/E5/E6..."
            disabled={loading}
            style={{ flex: 1, padding: '0.75rem 1rem', background: '#e9e7f0', border: 'none', borderRadius: '0.5rem', fontSize: '0.9375rem', color: '#31323a', outline: 'none' }}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            style={{ padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, #5148d7, #4439cb)', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontSize: '1.125rem' }}
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}
