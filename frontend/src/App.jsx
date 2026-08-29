import { useState } from 'react';
import GoalInput from './components/GoalInput';
import ProfileStrip from './components/ProfileStrip';
import StatsBar from './components/StatsBar';
import Trail from './components/Trail';
import FieldLog from './components/FieldLog';
import { createProfile, buildPath, submitFeedback } from './api';

export default function App() {
  const [profile, setProfile] = useState(null);
  const [path, setPath] = useState(null);
  const [completedIds, setCompletedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  async function handleGoalSubmit(message) {
    setLoading(true);
    setError(null);
    try {
      const newProfile = await createProfile(message);
      const newPath = await buildPath(newProfile);
      setProfile(newProfile);
      setPath(newPath);
      setCompletedIds(newProfile.completed_course_ids || []);
    } catch (err) {
      setError(err.message || 'Something went wrong charting your path.');
    } finally {
      setLoading(false);
    }
  }

  async function handleComplete(courseId) {
    if (!profile) return;
    setUpdating(true);
    setError(null);
    const nextCompleted = [...completedIds, courseId];
    try {
      const newPath = await submitFeedback(profile, nextCompleted);
      setPath(newPath);
      setCompletedIds(nextCompleted);
    } catch (err) {
      setError(err.message || "Couldn't update your route.");
    } finally {
      setUpdating(false);
    }
  }

  function handleReset() {
    setProfile(null);
    setPath(null);
    setCompletedIds([]);
    setError(null);
  }

  const pathContext = path
    ? path.steps.map((s, i) => `${i + 1}. ${s.course.title}`).join(' -> ')
    : '';

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-mark">
          Way<span>point</span>
        </div>
        <div className="app-tag">learning path recommender</div>
      </header>

      {!path && (
        <GoalInput onSubmit={handleGoalSubmit} loading={loading} error={error} />
      )}

      {path && profile && (
        <>
          <ProfileStrip profile={profile} onReset={handleReset} />
          <StatsBar
            steps={path.steps}
            totalHours={path.total_duration_hours}
            completedIds={completedIds}
          />
          {error && <p className="error-note" style={{ marginBottom: 20 }}>⚠ {error}</p>}
          <Trail
            steps={path.steps}
            completedIds={completedIds}
            onComplete={handleComplete}
            updating={updating}
          />
        </>
      )}

      {path && <FieldLog pathContext={pathContext} />}
    </div>
  );
}
