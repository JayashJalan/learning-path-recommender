export default function StatsBar({ steps, totalHours }) {
  const totalCount = steps.length;
  const completedSteps = steps.filter((s) => s.completed);
  const completedCount = completedSteps.length;
  const completedHours = completedSteps.reduce((sum, s) => sum + s.course.duration_hours, 0);
  const pct = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <>
      <div className="stats-row">
        <div className="stat">
          <div className="stat-value">
            {completedCount}/{totalCount}
          </div>
          <div className="stat-label">waypoints reached</div>
        </div>
        <div className="stat">
          <div className="stat-value">
            {completedHours}/{totalHours}h
          </div>
          <div className="stat-label">hours logged</div>
        </div>
        <div className="stat">
          <div className="stat-value">{pct}%</div>
          <div className="stat-label">of route complete</div>
        </div>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </>
  );
}