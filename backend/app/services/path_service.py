from app.models.schemas import LearnerProfile, LearningPath, PathStep
from app.services import course_service, ai_service


def _auto_skip_known_skills(profile: LearnerProfile) -> list[str]:
    """
    A learner who already knows a skill shouldn't be routed through the course
    that teaches it. Any course whose taught skills are fully covered by the
    learner's known_skills counts as already completed for sequencing purposes.
    """
    domain_courses = course_service.get_courses_for_domain(profile.domain)
    known = set(profile.known_skills)
    auto_completed = [
        c.id for c in domain_courses
        if c.skills_taught and set(c.skills_taught).issubset(known)
    ]
    return list(set(profile.completed_course_ids) | set(auto_completed))


def generate_path(profile: LearnerProfile) -> LearningPath:
    effective_completed = _auto_skip_known_skills(profile)
    ordered_courses = course_service.topological_path(profile.domain, effective_completed)

    steps: list[PathStep] = []
    prior_titles: list[str] = []
    total_hours = 0

    for i, course in enumerate(ordered_courses, start=1):
        unlocked = course_service.is_unlocked(course, profile.completed_course_ids) if i == 1 else True
        milestone = ai_service.explain_recommendation(
            course.title, course.description, profile.goal_summary, prior_titles
        )
        steps.append(PathStep(
            order=i,
            course=course,
            milestone=milestone,
            unlocked=(i == 1),  # only the first not-yet-done step is immediately unlocked
            completed=False,
        ))
        prior_titles.append(course.title)
        total_hours += course.duration_hours

    return LearningPath(
        learner_goal=profile.goal_summary,
        steps=steps,
        total_duration_hours=total_hours,
    )


def regenerate_after_progress(profile: LearnerProfile, newly_completed_ids: list[str]) -> LearningPath:
    """Feedback loop: mark courses complete, then rebuild the remaining path."""
    updated_completed = list(set(profile.completed_course_ids) | set(newly_completed_ids))
    updated_profile = profile.model_copy(update={"completed_course_ids": updated_completed})
    return generate_path(updated_profile)
