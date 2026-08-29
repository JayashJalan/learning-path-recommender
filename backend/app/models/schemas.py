from pydantic import BaseModel, Field
from typing import Optional


class LearnerProfile(BaseModel):
    """What we know about a learner, built up from their own words."""
    raw_goal_text: str = Field(..., description="The learner's original free-text description of their goal")
    domain: str = Field(..., description="e.g. data-analytics, web-dev")
    experience_level: str = Field(..., description="beginner | intermediate | advanced")
    known_skills: list[str] = Field(default_factory=list)
    completed_course_ids: list[str] = Field(default_factory=list)
    goal_summary: str = Field(..., description="One-sentence restatement of what the learner wants")
    time_commitment_hours_per_week: Optional[int] = None


class ProfileRequest(BaseModel):
    message: str


class Course(BaseModel):
    id: str
    title: str
    type: str
    domain: list[str]
    skills_taught: list[str]
    prerequisites: list[str]
    level: str
    duration_hours: int
    description: str


class RecommendedCourse(BaseModel):
    course: Course
    reason: str


class PathStep(BaseModel):
    order: int
    course: Course
    milestone: str
    unlocked: bool = False
    completed: bool = False


class LearningPath(BaseModel):
    learner_goal: str
    steps: list[PathStep]
    total_duration_hours: int


class FeedbackRequest(BaseModel):
    profile: LearnerProfile
    completed_course_ids: list[str]
    feedback_text: Optional[str] = None
