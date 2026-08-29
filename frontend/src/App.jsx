import { useState } from 'react';
import GoalInput from './components/GoalInput';
import ProfileStrip from './components/ProfileStrip';
import StatsBar from './components/StatsBar';
import Trail from './components/Trail';
import FieldLog from './components/FieldLog';
import { createProfile, buildPath, submitFeedback } from './api';

export default function App() {
  const [profile, setProfile] = useState(null);
  const [remainingPath, setRemainingPath] = useState(null);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [completedIds, setCompletedIds] = useState([]);
  const [totalHours, setTotalHours] = useState(0);
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
      setRemainingPath(newPath);
      setCompletedSteps([]);
      setCompletedIds(newProfile.completed_course_ids || []);
      setTotalHours(newPath.total_duration_hours);
    } catch (err) {
      setError(err.message || 'Something went wrong charting your path.');
    } finally {
      setLoading(false);
    }
  }

  async function handleComplete(courseId) {
    if (!profile || !remainingPath) return;

    // Capture the full step object *before* the backend drops it from the response
    const stepBeingCompleted = remainingPath.steps.find((s) => s.course.id === courseId);
    if (!stepBeingCompleted) return;

    setUpdating(true);
    setError(null);
    const nextCompletedIds = [...completedIds, courseId];
    try {
      const newPath = await submitFeedback(profile, nextCompletedIds);
      setCompletedSteps((prev) => [...prev, { ...stepBeingCompleted, completed: true }]);
      setCompletedIds(nextCompletedIds);
      setRemainingPath(newPath);
    } catch (err) {
      setError(err.message || "Couldn't update your route.");
    } finally {
      setUpdating(false);
    }
  }

  function handleReset() {
    setProfile(null);
    setRemainingPath(null);
    setCompletedSteps([]);
    setCompletedIds([]);
    setTotalHours(0);
    setError(null);
  }

  // Merge completed history + current remaining path into one display list,
  // renumbered so waypoint numbers stay sequential across both.
  const displaySteps = [
    ...completedSteps.map((s, i) => ({ ...s, order: i + 1, completed: true })),
    ...(remainingPath
      ? remainingPath.steps.map((s, i) => ({
          ...s,
          order: completedSteps.length + i + 1,
          completed: false,
        }))
      : []),
  ];

  const nextCourseId = remainingPath?.steps[0]?.course.id || null;

  const pathContext = displaySteps
    .map((s, i) => `${i + 1}. ${s.course.title}${s.completed ? ' (completed)' : ''}`)
    .join(' -> ');

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-mark">
          Way<span>point</span>
        </div>
        <div className="app-tag">learning path recommender</div>
      </header>

      {!remainingPath && (
        <GoalInput onSubmit={handleGoalSubmit} loading={loading} error={error} />
      )}

      {remainingPath && profile && (
        <>
          <ProfileStrip profile={profile} onReset={handleReset} />
          <StatsBar steps={displaySteps} totalHours={totalHours} />
          {error && <p className="error-note" style={{ marginBottom: 20 }}>⚠ {error}</p>}
          <Trail
            steps={displaySteps}
            nextCourseId={nextCourseId}
            onComplete={handleComplete}
            updating={updating}
          />
        </>
      )}

      {remainingPath && <FieldLog pathContext={pathContext} />}
    </div>
  );
}