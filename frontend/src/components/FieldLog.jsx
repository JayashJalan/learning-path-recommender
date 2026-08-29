import { useState, useRef, useEffect } from 'react';
import { askAssistant } from '../api';

export default function FieldLog({ pathContext }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [asking, setAsking] = useState(false);
  const bodyRef = useRef(null);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, asking]);

  async function handleAsk(e) {
    e.preventDefault();
    const question = input.trim();
    if (!question || asking) return;

    setMessages((m) => [...m, { role: 'user', text: question }]);
    setInput('');
    setAsking(true);

    try {
      const res = await askAssistant(question, pathContext);
      setMessages((m) => [...m, { role: 'assistant', text: res.answer }]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: 'assistant', text: `Couldn't reach the assistant: ${err.message}` },
      ]);
    } finally {
      setAsking(false);
    }
  }

  if (!open) {
    return (
      <button className="field-log-toggle" onClick={() => setOpen(true)}>
        <span className="field-log-dot" />
        Ask about your path
      </button>
    );
  }

  return (
    <div className="field-log-panel">
      <div className="field-log-header">
        <span className="field-log-title">Field log</span>
        <button className="field-log-close" onClick={() => setOpen(false)} aria-label="Close">
          ✕
        </button>
      </div>
      <div className="field-log-body" ref={bodyRef}>
        {messages.length === 0 && (
          <p className="field-log-empty">
            Ask why a step comes next, what to expect, or how to adjust the route.
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`chat-msg ${m.role}`}>
            {m.text}
          </div>
        ))}
        {asking && <div className="chat-msg assistant">…</div>}
      </div>
      <form className="field-log-form" onSubmit={handleAsk}>
        <input
          className="field-log-input"
          placeholder="Why this step next?"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={asking}
        />
        <button className="field-log-send" type="submit" disabled={asking || !input.trim()}>
          Ask
        </button>
      </form>
    </div>
  );
}
