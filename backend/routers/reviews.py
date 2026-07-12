import os
import json
import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models import (
    ReviewerModel, ReviewAssignmentModel, SubmissionModel, EditorModel
)
from routers.auth import get_current_editor
from email_service import _send_email

router = APIRouter(
    prefix="/api/reviews",
    tags=["reviews"]
)

class ReviewerCreateSchema(BaseModel):
    email: str
    name: str
    expertise_keywords: Optional[str] = None

@router.post("/reviewers", status_code=status.HTTP_201_CREATED)
def create_reviewer(reviewer: ReviewerCreateSchema, db: Session = Depends(get_db), current_editor: EditorModel = Depends(get_current_editor)):
    """Registers a qualified academic reviewer in the database."""
    existing = db.query(ReviewerModel).filter(ReviewerModel.email == reviewer.email).first()
    if existing:
        return {"status": "exists", "id": existing.id, "email": existing.email}
    
    rev_obj = ReviewerModel(
        id=f"rev_user_{uuid.uuid4().hex[:8]}",
        email=reviewer.email.strip().lower(),
        name=reviewer.name,
        expertise_keywords=reviewer.expertise_keywords
    )
    db.add(rev_obj)
    db.commit()
    db.refresh(rev_obj)
    return {"status": "created", "id": rev_obj.id, "email": rev_obj.email}

@router.get("/reviewers")
def get_reviewers(db: Session = Depends(get_db), current_editor: EditorModel = Depends(get_current_editor)):
    """Lists all registered academic reviewers."""
    revs = db.query(ReviewerModel).all()
    return [{"id": r.id, "email": r.email, "name": r.name, "expertise_keywords": r.expertise_keywords} for r in revs]

class AssignReviewerSchema(BaseModel):
    submission_id: str
    reviewer_email: str
    message_to_reviewer: Optional[str] = None

@router.post("/assign", status_code=status.HTTP_201_CREATED)
def assign_reviewer(assignment: AssignReviewerSchema, db: Session = Depends(get_db), current_editor: EditorModel = Depends(get_current_editor)):
    """Assigns a manuscript to a peer reviewer and dispatches an invitation email."""
    sub = db.query(SubmissionModel).filter(SubmissionModel.id == assignment.submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
        
    rev_assignment = ReviewAssignmentModel(
        id=f"assign_{uuid.uuid4().hex[:8]}",
        submission_id=assignment.submission_id,
        reviewer_email=assignment.reviewer_email.strip().lower(),
        status="pending",
        assigned_at=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    )
    db.add(rev_assignment)
    
    # Update submission status to under-review if still submitted
    if sub.status == "submitted":
        sub.status = "under-review"
        
    db.commit()
    db.refresh(rev_assignment)
    
    # Send email invitation to reviewer
    frontend_url = os.getenv("FRONTEND_URL", os.getenv("NEXT_PUBLIC_APP_URL", "https://bouesti-jvite-portal.vercel.app")).rstrip("/")
    if "your-app-name" in frontend_url or "localhost" in frontend_url or not frontend_url.startswith("http"):
        # Auto-correct placeholder or localhost URL when running on server or if FRONTEND_URL has a placeholder
        if "your-app-name" in frontend_url or os.getenv("RENDER") or os.getenv("ENVIRONMENT") == "production":
            frontend_url = "https://bouesti-jvite-portal.vercel.app"
            
    portal_url = f"{frontend_url}/reviewer?assignment_id={rev_assignment.id}&submission_id={sub.id}"
    subject = f"Peer Review Invitation: {sub.title[:40]}..."
    
    text_body = f"""Dear Academic Reviewer,

You have been invited by the Editorial Board of Dovite Journal to conduct a double-blind peer review for the manuscript titled:
"{sub.title}"

Abstract:
{sub.abstract[:350]}...

Please access the Double-Blind Evaluation Portal directly using your confidential review link:
{portal_url}

Your Secure Access Credentials:
- Assignment ID: {rev_assignment.id}
- Submission ID: {sub.id}

Best regards,
Dovite Journal Editorial Office"""

    html_body = f"""<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
    <div style="background-color: #0f172a; color: #ffffff; padding: 24px; text-align: center;">
        <h2 style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.02em;">Dovite Journal</h2>
        <p style="margin: 6px 0 0; font-size: 14px; color: #94a3b8; font-weight: 500;">Double-Blind Peer Review Invitation</p>
    </div>
    <div style="padding: 28px; color: #334155; line-height: 1.6;">
        <p style="font-size: 16px; margin-top: 0;">Dear Academic Reviewer,</p>
        <p style="margin-bottom: 20px;">You have been selected by the Editorial Board to evaluate the following submitted manuscript based on your area of expertise:</p>
        
        <div style="background-color: #f8fafc; padding: 18px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 24px 0;">
            <h3 style="margin: 0 0 10px; font-size: 17px; color: #0f172a; line-height: 1.4;">{sub.title}</h3>
            <p style="margin: 0; font-size: 14px; color: #64748b; font-style: italic;"><strong>Abstract Snippet:</strong> {sub.abstract[:350]}...</p>
        </div>

        <div style="background-color: #f1f5f9; padding: 16px; border-radius: 6px; margin: 24px 0; font-size: 14px;">
            <p style="margin: 0 0 6px; font-weight: bold; color: #0f172a;">Confidential Access Credentials:</p>
            <p style="margin: 0 0 4px;"><strong>Assignment ID:</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; color: #0f172a;">{rev_assignment.id}</code></p>
            <p style="margin: 0;"><strong>Submission ID:</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; color: #0f172a;">{sub.id}</code></p>
        </div>

        <div style="text-align: center; margin: 32px 0;">
            <a href="{portal_url}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">Evaluate Manuscript in Portal</a>
        </div>
        
        <p style="font-size: 13px; color: #64748b; margin-top: 24px;">Note: This invitation link contains secure tokens specifically tied to your evaluation. Please do not forward this email to ensure the double-blind review process remains compromised-free.</p>
    </div>
    <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8;">
        &copy; Dovite Journal Editorial Office &bull; Secure Academic Peer Review System
    </div>
</div>"""

    email_sent = True
    email_error = None
    try:
        _send_email(assignment.reviewer_email, subject, html_body, text_body)
    except Exception as email_err:
        email_sent = False
        email_error = str(email_err)
        print(f"Warning: Review assignment {rev_assignment.id} created, but email dispatch failed: {email_error}")
    
    return {"status": "assigned", "assignment_id": rev_assignment.id, "email_sent": email_sent, "email_error": email_error}

@router.get("/submission/{submission_id}")
def get_submission_reviews(submission_id: str, db: Session = Depends(get_db)):
    """Retrieves all peer review scores and feedback associated with a manuscript."""
    assignments = db.query(ReviewAssignmentModel).filter(ReviewAssignmentModel.submission_id == submission_id).all()
    return [{
        "id": a.id,
        "submission_id": a.submission_id,
        "reviewer_email": a.reviewer_email,
        "status": a.status,
        "recommendation": a.recommendation,
        "comments_for_editor": a.comments_for_editor,
        "comments_for_author": a.comments_for_author,
        "assigned_at": a.assigned_at,
        "completed_at": a.completed_at
    } for a in assignments]

@router.get("/blind-manuscript/{submission_id}")
def get_blind_manuscript(submission_id: str, assignment_id: Optional[str] = None, db: Session = Depends(get_db)):
    """Returns the manuscript metadata with ALL author and institutional PII strictly redacted for double-blind evaluation. Requires a valid review assignment."""
    if not assignment_id:
        raise HTTPException(status_code=403, detail="Forbidden: Accessing the reviewer portal requires a valid Review Assignment ID from your invitation email.")
        
    assignment = db.query(ReviewAssignmentModel).filter(
        ReviewAssignmentModel.id == assignment_id,
        ReviewAssignmentModel.submission_id == submission_id
    ).first()
    if not assignment:
        raise HTTPException(status_code=403, detail="Forbidden: This Review Assignment ID is invalid or does not match this manuscript submission.")

    sub = db.query(SubmissionModel).filter(SubmissionModel.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
        
    return {
        "id": sub.id,
        "title": sub.title,
        "abstract": sub.abstract,
        "keywords": json.loads(sub.keywords),
        "author": {"name": "Redacted for Double-Blind Review", "email": "redacted@dovitejournal.org", "affiliation": "Anonymous Institution"},
        "coAuthors": [{"name": "Redacted", "email": "redacted@dovitejournal.org", "affiliation": "Anonymous Institution"}],
        "manuscriptName": sub.manuscriptName,
        "category": sub.category,
        "submittedAt": sub.submittedAt,
        "status": sub.status,
        "double_blind_verified": True
    }

class SubmitScoreSchema(BaseModel):
    assignment_id: str
    recommendation: str # Accept, Minor Revisions, Major Revisions, Reject
    comments_for_editor: str
    comments_for_author: str

@router.post("/submit")
def submit_review_score(score: SubmitScoreSchema, db: Session = Depends(get_db)):
    """Allows a reviewer to submit their completed peer evaluation score and formal comments."""
    assignment = db.query(ReviewAssignmentModel).filter(ReviewAssignmentModel.id == score.assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=403, detail="Forbidden: Invalid review assignment ID")
        
    if assignment.status == "completed":
        raise HTTPException(status_code=400, detail="This evaluation has already been submitted and finalized.")

    assignment.recommendation = score.recommendation
    assignment.comments_for_editor = score.comments_for_editor
    assignment.comments_for_author = score.comments_for_author
    assignment.status = "completed"
    assignment.completed_at = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    
    db.commit()
    return {"status": "success", "recommendation": score.recommendation}
