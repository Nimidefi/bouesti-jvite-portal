from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database import engine, Base
from routers import submissions, uploads, payments
from models import SubmissionModel # to ensure models are registered

# Create database tables
Base.metadata.create_all(bind=engine)

from limiter import limiter
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

app = FastAPI(
    title="Dovite Journal API",
    description="Backend API for Dovite Journal submission system",
    version="1.0.0"
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

import os

# CORS configuration - read from environment variable or default to localhost
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads directory to serve static files
import os
if not os.path.exists("uploads"):
    os.makedirs("uploads")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

from routers import submissions, uploads, payments, auth, reviews

# Include routers
app.include_router(auth.router)
app.include_router(submissions.router)
app.include_router(uploads.router)
app.include_router(payments.router)
app.include_router(reviews.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Dovite Journal API. Visit /docs for documentation."}

