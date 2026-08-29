import json
from pathlib import Path
from app.models.schemas import Course

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "courses.json"


def load_courses() -> list[Course]:
    with open(DATA_PATH, "r") as f:
        raw = json.load(f)
    return [Course(**c) for c in raw["courses"]]


def get_courses_for_domain(domain: str) -> list[Course]:
    courses = load_courses()
    return [c for c in courses if domain in c.domain]


def get_course_by_id(course_id: str) -> Course | None:
    for c in load_courses():
        if c.id == course_id:
            return c
    return None


def is_unlocked(course: Course, completed_ids: list[str]) -> bool:
    """A course is unlocked once every prerequisite has been completed."""
    return all(pre in completed_ids for pre in course.prerequisites)


def get_skill_gaps(domain: str, known_skills: list[str]) -> list[str]:
    """Skills taught in this domain's curriculum that the learner doesn't have yet."""
    domain_courses = get_courses_for_domain(domain)
    all_skills = {skill for c in domain_courses for skill in c.skills_taught}
    return sorted(all_skills - set(known_skills))


def topological_path(domain: str, completed_ids: list[str]) -> list[Course]:
    """
    Order every not-yet-completed course in the domain so prerequisites
    always come before the courses that depend on them (Kahn's algorithm).
    """
    courses = {c.id: c for c in get_courses_for_domain(domain) if c.id not in completed_ids}
    in_degree = {cid: 0 for cid in courses}

    for c in courses.values():
        for pre in c.prerequisites:
            if pre in courses:
                in_degree[c.id] += 1

    queue = sorted([cid for cid, deg in in_degree.items() if deg == 0],
                    key=lambda cid: (courses[cid].level, courses[cid].title))
    ordered: list[Course] = []
    visited = set()

    while queue:
        current_id = queue.pop(0)
        if current_id in visited:
            continue
        visited.add(current_id)
        ordered.append(courses[current_id])

        for c in courses.values():
            if current_id in c.prerequisites and c.id not in visited:
                in_degree[c.id] -= 1
                if in_degree[c.id] == 0 and c.id not in queue:
                    queue.append(c.id)
        queue.sort(key=lambda cid: (courses[cid].level, courses[cid].title))

    return ordered
