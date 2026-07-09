import json
from typing import List, Optional, Any
from pydantic import BaseModel, Field
from sqlalchemy import Column, String, Integer, DateTime
from database import Base

# SQLAlchemy Models
# SQLAlchemy Models
class SubmissionModel(Base):
    __tablename__ = "submissions"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    abstract = Column(String, nullable=False)
    keywords = Column(String, nullable=False) # JSON encoded string
    author = Column(String, nullable=False) # JSON encoded string
    coAuthors = Column(String, nullable=True) # JSON encoded string
    manuscriptName = Column(String, nullable=False)
    manuscriptSize = Column(Integer, nullable=False)
    category = Column(String, nullable=False)
    submittedAt = Column(String, nullable=False)
    status = Column(String, nullable=False)
    doi = Column(String, unique=True, index=True, nullable=True)
    version = Column(Integer, default=1, nullable=False)

class SubmissionAuditLogModel(Base):
    __tablename__ = "submission_audit_logs"

    id = Column(String, primary_key=True, index=True)
    submission_id = Column(String, index=True, nullable=False)
    editor_email = Column(String, nullable=False)
    old_status = Column(String, nullable=True)
    new_status = Column(String, nullable=False)
    action_timestamp = Column(String, nullable=False)
    comments = Column(String, nullable=True)

class ReviewerModel(Base):
    __tablename__ = "reviewers"

    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    expertise_keywords = Column(String, nullable=True)

class ReviewAssignmentModel(Base):
    __tablename__ = "review_assignments"

    id = Column(String, primary_key=True, index=True)
    submission_id = Column(String, index=True, nullable=False)
    reviewer_email = Column(String, index=True, nullable=False)
    status = Column(String, default="pending", nullable=False) # pending, accepted, completed, declined
    recommendation = Column(String, nullable=True) # Accept, Minor Revisions, Major Revisions, Reject
    comments_for_editor = Column(String, nullable=True)
    comments_for_author = Column(String, nullable=True)
    assigned_at = Column(String, nullable=False)
    completed_at = Column(String, nullable=True)

class RevisionModel(Base):
    __tablename__ = "revisions"

    id = Column(String, primary_key=True, index=True)
    submission_id = Column(String, index=True, nullable=False)
    version_number = Column(Integer, nullable=False)
    manuscriptName = Column(String, nullable=False)
    manuscriptSize = Column(Integer, nullable=False)
    author_response_letter = Column(String, nullable=True)
    uploaded_at = Column(String, nullable=False)

class EditorModel(Base):
    __tablename__ = "editors"

    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

class BoardMemberModel(Base):
    __tablename__ = "board_members"

    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)

# Pydantic Models for Validation
class AuthorSchema(BaseModel):
    name: str
    email: str
    affiliation: str
    orcid: Optional[str] = None

class EditorSignupSchema(BaseModel):
    email: str
    password: str = Field(..., min_length=8)
    confirm_password: str

class SubmissionCreate(BaseModel):
    title: str = Field(..., min_length=10, max_length=200)
    abstract: str = Field(..., min_length=150, max_length=2500)
    keywords: List[str] = Field(..., min_length=4, max_length=8)
    author: AuthorSchema
    coAuthors: Optional[List[AuthorSchema]] = None
    manuscriptName: str
    manuscriptSize: int = Field(..., le=25 * 1024 * 1024)
    category: str
    submittedAt: str
    status: str
    doi: Optional[str] = None
    version: Optional[int] = 1

class SubmissionPatch(BaseModel):
    status: Optional[str] = None
    comments: Optional[str] = None

class SubmissionResponse(SubmissionCreate):
    id: str

    class Config:
        from_attributes = True

def parse_submission(db_obj: SubmissionModel) -> SubmissionResponse:
    return SubmissionResponse(
        id=db_obj.id,
        title=db_obj.title,
        abstract=db_obj.abstract,
        keywords=json.loads(db_obj.keywords),
        author=json.loads(db_obj.author),
        coAuthors=json.loads(db_obj.coAuthors) if db_obj.coAuthors else None,
        manuscriptName=db_obj.manuscriptName,
        manuscriptSize=db_obj.manuscriptSize,
        category=db_obj.category,
        submittedAt=db_obj.submittedAt,
        status=db_obj.status,
        doi=getattr(db_obj, "doi", None),
        version=getattr(db_obj, "version", 1)
    )
