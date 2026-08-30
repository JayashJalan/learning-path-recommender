from dotenv import load_dotenv
load_dotenv()

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import learning

app = FastAPI(title="AI-Powered Personalized Learning Path Recommender")

# Local dev origins always allowed. Production origins (e.g. your Vercel URL)
# come from the ALLOWED_ORIGINS env var -- comma-separated, no code changes needed.
default_origins = ["http://localhost:5173", "http://localhost:3000"]
extra_origins = os.environ.get("ALLOWED_ORIGINS", "")
allow_origins = default_origins + [o.strip() for o in extra_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(learning.router)


@app.get("/")
def root():
    return {"status": "ok", "service": "learning-path-recommender-api"}