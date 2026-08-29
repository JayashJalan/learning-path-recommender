from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.models.schemas import ProfileRequest, LearnerProfile, FeedbackRequest, LearningPath
from app.services import ai_service, course_service, path_service

router = APIRouter(prefix="/api", tags=["learning"])


@router.post("/profile", response_model=LearnerProfile)
def create_profile(req: ProfileRequest):
    """Step 1-2: learner describes their goal in natural language -> structured profile."""
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="message must not be empty")
    return ai_service.parse_goal_to_profile(req.message)


@router.get("/skill-gaps")
def skill_gaps(domain: str, known_skills: str = ""):
    """Step 3: what does the learner still need to learn."""
    known = [s for s in known_skills.split(",") if s]
    gaps = course_service.get_skill_gaps(domain, known)
    return {"domain": domain, "skill_gaps": gaps}


@router.post("/path", response_model=LearningPath)
def build_path(profile: LearnerProfile):
    """Step 4-6: recommend resources, sequence them, and explain each step."""
    return path_service.generate_path(profile)


@router.post("/feedback", response_model=LearningPath)
def submit_feedback(req: FeedbackRequest):
    """Step 8: learner marks progress -> path adapts."""
    return path_service.regenerate_after_progress(req.profile, req.completed_course_ids)


class ChatRequest(BaseModel):
    question: str
    path_context: str = ""


@router.post("/chat")
def chat(req: ChatRequest):
    """AI assistant answering free-form questions about the learner's path."""
    answer = ai_service.answer_learner_question(req.question, req.path_context)
    return {"answer": answer}


@router.get("/courses")
def list_courses(domain: str | None = None):
    courses = course_service.get_courses_for_domain(domain) if domain else course_service.load_courses()
    return {"courses": courses}
