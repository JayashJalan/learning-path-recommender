import { useState } from 'react';

const EXAMPLES = [
  'I know basic Python, want to become a data analyst in 6 months',
  'Total beginner, want to build full-stack web apps',
  'I know HTML and CSS, want to learn React',
];

export default function GoalInput({ onSubmit, loading, error }) {
  const [text, setText] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim() || loading) return;
    onSubmit(text.trim());
  }

  return (
    <div className="hero">
      <h1 className="hero-title">
        Where are you <em>headed</em>?
      </h1>
      <p className="hero-sub">
        Describe your goal, experience, and what you already know. We'll chart a
        prerequisite-ordered path — courses, projects, and a capstone — built around it.
      </p>

      <form className="goal-form" onSubmit={handleSubmit}>
        <textarea
          className="goal-textarea"
          placeholder="I know basic Python and want to become a data analyst in 6 months…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              handleSubmit(e);
            }
          }}
          disabled={loading}
        />
        <button className="goal-submit" type="submit" disabled={loading || !text.trim()}>
          {loading ? 'Charting…' : 'Chart my path'}
        </button>
      </form>

      {error && <p className="error-note">⚠ {error}</p>}

      <div className="goal-examples">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            className="goal-example-chip"
            onClick={() => setText(ex)}
            disabled={loading}
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}
