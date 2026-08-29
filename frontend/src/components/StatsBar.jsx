export default function StatsBar({ steps, totalHours, completedIds }) {
  const completedCount = steps.filter((s) => completedIds.includes(s.course.id)).length;
  const completedHours = steps
    .filter((s) => completedIds.includes(s.course.id))
    .reduce((sum, s) => sum + s.course.duration_hours, 0);
  const pct = steps.length ? Math.round((completedCount / steps.length) * 100) : 0;

  return (
    <>
      <div className="stats-row">
        <div className="stat">
          <div className="stat-value">
            {completedCount}/{steps.length}
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
