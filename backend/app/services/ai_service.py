import os
import json
import re
from app.models.schemas import LearnerProfile
from app.services import course_service

# Groq-hosted model. Check https://console.groq.com/docs/models for current options.
# llama-3.3-70b-versatile was deprecated; openai/gpt-oss-120b is the current general-purpose pick.
MODEL = "openai/gpt-oss-120b"
_client = None


def _get_client():
    """Lazily create the Groq client. Returns None if no API key is configured."""
    global _client
    if _client is not None:
        return _client
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        return None
    try:
        from groq import Groq
        _client = Groq(api_key=api_key)
        return _client
    except ImportError:
        return None


def _strip_json_fences(text: str) -> str:
    return re.sub(r"^```(json)?|```$", "", text.strip(), flags=re.MULTILINE).strip()


def parse_goal_to_profile(message: str) -> LearnerProfile:
    """
    Turn a learner's free-text message into a structured profile.
    Falls back to lightweight keyword rules if no Groq API key is set,
    so the app still works out of the box for local testing/demos.
    """
    client = _get_client()
    if client is None:
        return _rule_based_profile(message)

    domains = course_service.get_all_domains()
    domain_preview = "\n".join(
        f"- {d}: e.g. {', '.join(c.title for c in course_service.get_courses_for_domain(d)[:4])}"
        for d in domains
    )

    system_prompt = (
        "You are a learner-profiling engine for an ed-tech platform. "
        "Given a learner's free-text message, extract a structured profile.\n"
        f"Valid domain values are exactly these (pick whichever best matches the goal):\n{domain_preview}\n"
        "Valid experience_level values: 'beginner', 'intermediate', 'advanced'. "
        "known_skills should use short slugs like 'python-basics', 'sql', 'html', 'javascript' "
        "if mentioned or clearly implied, otherwise an empty list. "
        "Respond with ONLY a JSON object, no preamble, no markdown fences, matching this shape:\n"
        '{"domain": "...", "experience_level": "...", "known_skills": ["..."], '
        '"goal_summary": "one sentence", "time_commitment_hours_per_week": <int or null>}'
    )

    response = client.chat.completions.create(
        model=MODEL,
        max_tokens=500,
        reasoning_effort="low",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": message},
        ],
    )
    text = response.choices[0].message.content
    parsed = json.loads(_strip_json_fences(text))

    return LearnerProfile(
        raw_goal_text=message,
        domain=parsed["domain"],
        experience_level=parsed["experience_level"],
        known_skills=parsed.get("known_skills", []),
        goal_summary=parsed["goal_summary"],
        time_commitment_hours_per_week=parsed.get("time_commitment_hours_per_week"),
    )


def _rule_based_profile(message: str) -> LearnerProfile:
    """Simple keyword fallback so the app runs without an API key."""
    lower = message.lower()
    domain = course_service.guess_domain_from_text(message)

    if any(k in lower for k in ["beginner", "new to", "never coded", "no experience"]):
        level = "beginner"
    elif any(k in lower for k in ["advanced", "expert", "years of experience"]):
        level = "advanced"
    else:
        level = "beginner"

    known = []
    for skill, kw in [("python-basics", "python"), ("sql", "sql"), ("javascript", "javascript"),
                       ("html", "html"), ("css", "css"), ("git", "git")]:
        if kw in lower:
            known.append(skill)

    return LearnerProfile(
        raw_goal_text=message,
        domain=domain,
        experience_level=level,
        known_skills=known,
        goal_summary=message.strip()[:140],
        time_commitment_hours_per_week=None,
    )


def explain_recommendation(course_title: str, course_description: str, goal_summary: str,
                            prior_course_titles: list[str]) -> str:
    """One or two sentences explaining why this course fits the learner's path."""
    client = _get_client()
    if client is None:
        return _rule_based_explanation(course_title, prior_course_titles)

    prior = ", ".join(prior_course_titles) if prior_course_titles else "nothing yet"
    prompt = (
        f"Learner's goal: {goal_summary}\n"
        f"Courses already completed in this path: {prior}\n"
        f"Next recommended course: {course_title} — {course_description}\n\n"
        "In exactly 1-2 short sentences, explain to the learner why this course comes next "
        "given their goal and what they've already done. Be specific and encouraging, no fluff."
    )
    response = client.chat.completions.create(
        model=MODEL,
        max_tokens=400,
        reasoning_effort="low",
        messages=[{"role": "user", "content": prompt}],
    )
    return response.choices[0].message.content.strip()


def _rule_based_explanation(course_title: str, prior_course_titles: list[str]) -> str:
    if prior_course_titles:
        return (f"Builds directly on {prior_course_titles[-1]}, moving you one step closer "
                f"to your goal with {course_title}.")
    return f"A strong starting point given where you are today: {course_title}."


def answer_learner_question(question: str, path_context: str) -> str:
    """Free-form Q&A about the learner's path."""
    client = _get_client()
    if client is None:
        return ("I can answer questions about your path once a GROQ_API_KEY is configured. "
                "For now: check the roadmap panel for course order and prerequisites.")
    prompt = (
        f"Learner's current path:\n{path_context}\n\n"
        f"Learner's question: {question}\n\n"
        "Answer in 2-4 plain sentences, conversational tone. No markdown tables, "
        "no numbered lists, no headers — just a direct spoken-style answer."
    )
    response = client.chat.completions.create(
        model=MODEL,
        max_tokens=400,
        reasoning_effort="low",
        messages=[{"role": "user", "content": prompt}],
    )
    return response.choices[0].message.content.strip()