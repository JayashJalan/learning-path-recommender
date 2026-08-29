export default function ProfileStrip({ profile, onReset }) {
  return (
    <div className="profile-strip">
      <div>
        <div className="profile-strip-goal">"{profile.goal_summary}"</div>
        <div className="profile-tags">
          <span className="profile-tag">{profile.domain}</span>
          <span className="profile-tag">{profile.experience_level}</span>
          {profile.known_skills.map((s) => (
            <span className="profile-tag" key={s}>
              knows {s}
            </span>
          ))}
        </div>
      </div>
      <button className="reset-btn" onClick={onReset}>
        Start over
      </button>
    </div>
  );
}
