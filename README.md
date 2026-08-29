# AI-Powered Personalized Learning Path Recommender

Backend is fully built and tested. Frontend is not yet scaffolded — see "What's left" below.

## What's built (backend)

```
backend/
  app/
    main.py                    # FastAPI app entrypoint + CORS
    data/courses.json          # Seed dataset: 2 domains (data-analytics, web-dev), prereq chains
    models/schemas.py          # Pydantic models: LearnerProfile, Course, LearningPath, etc.
    services/
      course_service.py        # Skill-gap detection, topological sort (Kahn's algorithm) for path ordering
      ai_service.py             # Claude API calls (goal parsing, explanations, chat) w/ rule-based fallback
      path_service.py           # Ties course_service + ai_service into a full LearningPath
    routers/learning.py         # All /api/* endpoints
  requirements.txt
  .env.example
```

### Endpoints

| Method | Path             | Purpose |
|--------|------------------|---------|
| POST   | `/api/profile`   | Free-text goal → structured `LearnerProfile` |
| GET    | `/api/skill-gaps`| Domain + known skills → missing skills |
| POST   | `/api/path`      | `LearnerProfile` → full ordered `LearningPath` with per-step explanations |
| POST   | `/api/feedback`  | Mark courses complete → regenerates the remaining path |
| POST   | `/api/chat`      | Free-form Q&A about the current path |
| GET    | `/api/courses`   | List courses, optionally filtered by domain |

### Key design decisions
- **Rule-based fallback everywhere in `ai_service.py`.** If `ANTHROPIC_API_KEY` isn't set, the app still runs end-to-end using keyword heuristics instead of Claude calls. Swap in a real key any time — no code changes needed.
- **`known_skills` auto-skips matching courses** (`path_service._auto_skip_known_skills`) — a learner who already knows Python won't be routed through "Python Fundamentals" again.
- **Path ordering is a real topological sort**, not a hardcoded sequence — add/edit courses in `courses.json` and the ordering adapts automatically.
- **Feedback loop** (`/api/feedback`) merges newly completed courses into the profile and re-runs generation — this is what makes the path "adaptive" per the brief.

## Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # optionally add your ANTHROPIC_API_KEY
uvicorn app.main:app --reload --port 8000
```

Verify it's running:
```bash
curl http://127.0.0.1:8000/
curl -X POST http://127.0.0.1:8000/api/profile \
  -H "Content-Type: application/json" \
  -d '{"message":"I know basic Python and want to become a data analyst in 6 months"}'
```

## What's left (frontend + polish)

1. **Frontend** — React app (Vite recommended: `npm create vite@latest frontend -- --template react`)
   - Chat component → calls `POST /api/profile`, then `POST /api/path`
   - Roadmap/dashboard view → renders `LearningPath.steps`, checkboxes for completion → `POST /api/feedback`
   - Chat/Q&A panel → `POST /api/chat`, passing the current path as `path_context`
   - CORS is already configured for `localhost:5173` (Vite default) and `localhost:3000` (CRA default)
2. **Deployment** — pick a host for backend (Railway/Render/Fly.io) and frontend (Vercel/Netlify), wire the frontend's API base URL to the deployed backend
3. **Documentation deliverable** — PDF/PPT per the submission guidelines (problem, approach, architecture, AI/ML techniques, challenges)
4. **Demo video** — 3–5 min walkthrough once frontend exists
5. Optional stretch: swap `courses.json` for a real database (SQLite/Postgres) if you want persistence across restarts; add auth if multiple learners need separate saved profiles

## Testing notes
All backend endpoints were manually verified working, including:
- Profile parsing (rule-based fallback confirmed correct domain/skill extraction)
- Full path generation with correct prerequisite ordering
- Known-skill auto-skip (Python Fundamentals correctly excluded when learner already knows Python)
- Feedback loop correctly removes completed courses and keeps remaining order valid
