export default function Trail({ steps, nextCourseId, onComplete, updating }) {
  return (
    <div className="trail">
      <div className="trail-line" />
      {steps.map((step) => {
        const isCompleted = step.completed;
        const isNext = !isCompleted && step.course.id === nextCourseId;
        const status = isCompleted ? 'is-completed' : isNext ? 'is-unlocked' : 'is-locked';

        return (
          <div className={`waypoint ${status}`} key={step.course.id}>
            <div className="waypoint-node">
              {isCompleted ? '✓' : String(step.order).padStart(2, '0')}
            </div>
            <div className="waypoint-card">
              <div className="waypoint-top">
                <div>
                  <h3 className="waypoint-title">{step.course.title}</h3>
                  <div className="waypoint-meta">
                    <span>{step.course.type}</span>
                    <span>·</span>
                    <span>{step.course.duration_hours}h</span>
                    <span>·</span>
                    <span>{step.course.level}</span>
                  </div>
                </div>
                {isCompleted && <div className="stamp">DONE</div>}
              </div>

              <p className="waypoint-desc">{step.course.description}</p>

              {step.milestone && (
                <p className="waypoint-milestone">{step.milestone}</p>
              )}

              <div className="waypoint-actions">
                {isCompleted ? null : isNext ? (
                  <button
                    className="complete-btn"
                    disabled={updating}
                    onClick={() => onComplete(step.course.id)}
                  >
                    {updating ? 'Updating route…' : 'Mark complete →'}
                  </button>
                ) : (
                  <span className="locked-note">
                    reach waypoint {String(step.order - 1).padStart(2, '0')} first
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}