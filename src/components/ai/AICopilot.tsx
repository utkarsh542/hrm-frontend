'use client';
import { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api';
import { Bot, X, Send, Sparkles } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  'How many employees are on notice?',
  'Who has pending leave requests?',
  'Show me leave balances for Sneha',
  'How many open positions do we have?',
];

export default function AICopilot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi! I\'m your AI HR Copilot. Ask me anything about employees, leaves, payroll, or recruitment.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);
    try {
      const resp: any = await api.aiChat(msg);
      setMessages(prev => [...prev, { role: 'assistant', content: resp.answer || 'Sorry, I could not process that.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Could not reach the AI service. Make sure the backend is running.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 1000,
          width: 56, height: 56, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary), var(--accent-purple))',
          border: 'none', cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(37,99,235,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.2s',
          color: '#fff',
        }}
        title="AI HR Copilot"
      >
        {open ? <X size={24} /> : <Bot size={28} />}
      </button>

      {/* Chat Panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 96, right: 28, zIndex: 999,
          width: 380, height: 520,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-xl)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 16px', borderBottom: '1px solid var(--border)',
            background: 'linear-gradient(135deg, var(--primary), var(--accent-purple))',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <Bot size={22} style={{ color: '#fff' }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>AI HR Copilot</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>Powered by Groq · Llama 3</div>
            </div>
            <div style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: '#4ade80' }}></div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map((m, i) => {
              const renderMessageContent = (content: string) => {
                if (!content) return null;
                const lines = content.split('\n');
                return lines.map((line, lineIdx) => {
                  let isBullet = false;
                  let cleanLine = line;
                  
                  // Parse bullet points
                  if (line.trim().startsWith('- ')) {
                    isBullet = true;
                    cleanLine = line.trim().substring(2);
                  } else if (line.trim().startsWith('* ')) {
                    isBullet = true;
                    cleanLine = line.trim().substring(2);
                  }

                  const parts = [];
                  const boldRegex = /\*\*(.*?)\*\*/g;
                  let match;
                  let lastIndex = 0;

                  while ((match = boldRegex.exec(cleanLine)) !== null) {
                    if (match.index > lastIndex) {
                      parts.push(cleanLine.substring(lastIndex, match.index));
                    }
                    parts.push(<strong key={match.index} style={{ fontWeight: 700 }}>{match[1]}</strong>);
                    lastIndex = boldRegex.lastIndex;
                  }
                  
                  if (lastIndex < cleanLine.length) {
                    parts.push(cleanLine.substring(lastIndex));
                  }

                  const contentNode = parts.length > 0 ? parts : cleanLine;

                  if (isBullet) {
                    return (
                      <li key={lineIdx} style={{ marginLeft: 16, marginBottom: 4, listStyleType: 'disc' }}>
                        {contentNode}
                      </li>
                    );
                  }

                  return (
                    <div key={lineIdx} style={{ minHeight: '1.2em', marginBottom: lineIdx < lines.length - 1 ? 6 : 0 }}>
                      {contentNode}
                    </div>
                  );
                });
              };

              return (
                <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '82%', padding: '8px 12px', borderRadius: 12, fontSize: 13, lineHeight: 1.5,
                    background: m.role === 'user' ? 'var(--primary)' : 'var(--bg-input)',
                    color: m.role === 'user' ? '#fff' : 'var(--text-primary)',
                    borderBottomRightRadius: m.role === 'user' ? 2 : 12,
                    borderBottomLeftRadius: m.role === 'assistant' ? 2 : 12,
                    whiteSpace: 'pre-wrap',
                  }}>
                    {renderMessageContent(m.content)}
                  </div>
                </div>
              );
            })}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '8px 14px', background: 'var(--bg-input)', borderRadius: 12, fontSize: 18 }}>
                  <span style={{ animation: 'pulse 1s infinite' }}>●</span>
                  <span style={{ animation: 'pulse 1s infinite 0.2s', marginLeft: 3 }}>●</span>
                  <span style={{ animation: 'pulse 1s infinite 0.4s', marginLeft: 3 }}>●</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 1 && (
            <div style={{ padding: '0 14px 8px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => send(s)} style={{
                  fontSize: 11, padding: '4px 10px', borderRadius: 20,
                  background: 'var(--bg-input)', border: '1px solid var(--border)',
                  color: 'var(--text-secondary)', cursor: 'pointer',
                }}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder="Ask anything about your HR data..."
              style={{
                flex: 1, padding: '8px 12px', borderRadius: 20, fontSize: 13,
                background: 'var(--bg-input)', border: '1px solid var(--border)',
                color: 'var(--text-primary)', outline: 'none',
              }}
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              style={{
                width: 36, height: 36, borderRadius: '50%', border: 'none',
                background: input.trim() ? 'var(--primary)' : 'var(--bg-input)',
                color: '#fff', cursor: input.trim() ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
