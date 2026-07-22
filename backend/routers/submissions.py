import json
import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request, Response
from sqlalchemy.orm import Session

from database import get_db
from models import (
    SubmissionModel, SubmissionCreate, SubmissionResponse, SubmissionPatch, parse_submission,
    EditorModel, SubmissionAuditLogModel, RevisionModel
)
from routers.auth import get_current_editor, get_current_author
from email_service import send_new_submission_email, send_author_submission_confirmation, send_submission_status_update
from limiter import limiter

router = APIRouter(
    prefix="/api/submissions",
    tags=["submissions"]
)

@router.post("", response_model=SubmissionResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
def create_submission(request: Request, submission: SubmissionCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    sub_id = f"sub_{uuid.uuid4().hex[:8]}"
    db_submission = SubmissionModel(
        id=sub_id,
        title=submission.title,
        abstract=submission.abstract,
        keywords=json.dumps(submission.keywords),
        author=json.dumps(submission.author.model_dump()),
        coAuthors=json.dumps([c.model_dump() for c in submission.coAuthors]) if submission.coAuthors else None,
        manuscriptName=submission.manuscriptName,
        manuscriptSize=submission.manuscriptSize,
        category=submission.category,
        submittedAt=submission.submittedAt,
        status=submission.status
    )
    db.add(db_submission)
    db.commit()
    db.refresh(db_submission)
    
    # Send emails in background: one to Editor, one to Author
    file_path = f"/uploads/{submission.manuscriptName}"
    background_tasks.add_task(send_new_submission_email, sub_id, submission.title, submission.author.name, file_path)
    background_tasks.add_task(send_author_submission_confirmation, sub_id, submission.title, submission.author.name, submission.author.email)
    
    return parse_submission(db_submission)

@router.get("/my", response_model=List[SubmissionResponse])
def get_my_submissions(db: Session = Depends(get_db), current_author_email: str = Depends(get_current_author)):
    submissions = db.query(SubmissionModel).all()
    # Filter by author email in the JSON field
    my_subs = []
    for sub in submissions:
        try:
            author_data = json.loads(sub.author)
            if author_data.get("email", "").lower() == current_author_email.lower():
                my_subs.append(sub)
        except:
            continue
    return [parse_submission(sub) for sub in my_subs]

@router.get("", response_model=List[SubmissionResponse])
def get_submissions(db: Session = Depends(get_db)):
    submissions = db.query(SubmissionModel).all()
    return [parse_submission(sub) for sub in submissions]

@router.get("/{submission_id}", response_model=SubmissionResponse)
def get_submission(submission_id: str, db: Session = Depends(get_db)):
    submission = db.query(SubmissionModel).filter(SubmissionModel.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    return parse_submission(submission)

@router.patch("/{submission_id}", response_model=SubmissionResponse)
def update_submission(submission_id: str, patch: SubmissionPatch, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_editor: EditorModel = Depends(get_current_editor)):
    submission = db.query(SubmissionModel).filter(SubmissionModel.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    old_status = submission.status
    if patch.status is not None and patch.status != submission.status:
        submission.status = patch.status
        
        # Issue DOI if accepted or published and not already issued
        if submission.status in ["accepted", "published"] and not getattr(submission, "doi", None):
            submission.doi = f"10.5555/dovite.2026.{submission.id.split('_')[-1]}"
            
        # Write immutable COPE audit log record
        audit_log = SubmissionAuditLogModel(
            id=f"log_{uuid.uuid4().hex[:8]}",
            submission_id=submission.id,
            editor_email=current_editor.email,
            old_status=old_status,
            new_status=submission.status,
            action_timestamp=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
            comments=patch.comments
        )
        db.add(audit_log)
        db.commit()
        db.refresh(submission)
        
        # Send status update email to author in background (including editorial comments/feedback)
        try:
            author_data = json.loads(submission.author)
            background_tasks.add_task(
                send_submission_status_update,
                submission.id,
                submission.title,
                author_data.get("name", "Author"),
                author_data.get("email"),
                patch.status,
                patch.comments
            )
        except Exception as e:
            print(f"Failed to dispatch status update email: {e}")
    else:
        if patch.comments:
            audit_log = SubmissionAuditLogModel(
                id=f"log_{uuid.uuid4().hex[:8]}",
                submission_id=submission.id,
                editor_email=current_editor.email,
                old_status=old_status,
                new_status=submission.status,
                action_timestamp=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
                comments=patch.comments
            )
            db.add(audit_log)
            
            # Send editorial feedback/comments email to author in background
            try:
                author_data = json.loads(submission.author)
                background_tasks.add_task(
                    send_submission_status_update,
                    submission.id,
                    submission.title,
                    author_data.get("name", "Author"),
                    author_data.get("email"),
                    submission.status,
                    patch.comments
                )
            except Exception as e:
                print(f"Failed to dispatch comments update email: {e}")
        db.commit()
        db.refresh(submission)

    return parse_submission(submission)

@router.delete("/{submission_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_submission(submission_id: str, db: Session = Depends(get_db), current_editor: EditorModel = Depends(get_current_editor)):
    submission = db.query(SubmissionModel).filter(SubmissionModel.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    db.delete(submission)
    db.commit()
    return None

@router.get("/{submission_id}/audit-logs")
def get_submission_audit_logs(submission_id: str, db: Session = Depends(get_db)):
    """Retrieves the complete COPE-compliant immutable audit trail of all editorial decisions and status changes."""
    logs = db.query(SubmissionAuditLogModel).filter(SubmissionAuditLogModel.submission_id == submission_id).order_by(SubmissionAuditLogModel.action_timestamp.desc()).all()
    return [{
        "id": log.id,
        "submission_id": log.submission_id,
        "editor_email": log.editor_email,
        "old_status": log.old_status,
        "new_status": log.new_status,
        "action_timestamp": log.action_timestamp,
        "comments": log.comments
    } for log in logs]

@router.get("/{submission_id}/revisions")
def get_submission_revisions(submission_id: str, db: Session = Depends(get_db)):
    """Retrieves all uploaded manuscript revisions (v1, v2, etc.) for this submission."""
    revisions = db.query(RevisionModel).filter(RevisionModel.submission_id == submission_id).order_by(RevisionModel.version_number.asc()).all()
    return [{
        "id": rev.id,
        "submission_id": rev.submission_id,
        "version_number": rev.version_number,
        "manuscriptName": rev.manuscriptName,
        "manuscriptSize": rev.manuscriptSize,
        "author_response_letter": rev.author_response_letter,
        "uploaded_at": rev.uploaded_at
    } for rev in revisions]

from pydantic import BaseModel
class RevisionCreateSchema(BaseModel):
    manuscriptName: str
    manuscriptSize: int
    author_response_letter: Optional[str] = None

@router.post("/{submission_id}/revisions", status_code=status.HTTP_201_CREATED)
def create_submission_revision(submission_id: str, rev_data: RevisionCreateSchema, db: Session = Depends(get_db)):
    """Allows an author to upload a revised manuscript (v2, v3) and response-to-reviewers letter."""
    submission = db.query(SubmissionModel).filter(SubmissionModel.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    current_ver = getattr(submission, "version", 1) or 1
    new_ver = current_ver + 1
    
    revision_record = RevisionModel(
        id=f"rev_{uuid.uuid4().hex[:8]}",
        submission_id=submission_id,
        version_number=new_ver,
        manuscriptName=rev_data.manuscriptName,
        manuscriptSize=rev_data.manuscriptSize,
        author_response_letter=rev_data.author_response_letter,
        uploaded_at=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    )
    db.add(revision_record)
    submission.version = new_ver
    submission.manuscriptName = rev_data.manuscriptName
    submission.manuscriptSize = rev_data.manuscriptSize
    db.commit()
    
    return {"status": "success", "new_version": new_ver, "revision_id": revision_record.id}

@router.get("/{submission_id}/jats.xml")
def get_submission_jats_xml(submission_id: str, db: Session = Depends(get_db)):
    """Generates standard NISO JATS XML format required by PubMed Central, Google Scholar, and OpenAIRE."""
    submission = db.query(SubmissionModel).filter(SubmissionModel.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    author_info = json.loads(submission.author)
    doi_val = getattr(submission, "doi", "") or f"10.5555/dovite.2026.{submission.id.split('_')[-1]}"
    
    xml_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE article PUBLIC "-//NLM//DTD JATS (Z39.96) Journal Publishing DTD v1.2 20190208//EN" "JATS-journalpublishing1.dtd">
<article article-type="research-article" dtd-version="1.2" xml:lang="en" xmlns:xlink="http://www.w3.org/1999/xlink">
  <front>
    <journal-meta>
      <journal-id journal-id-type="publisher-id">Dovite Journal</journal-id>
      <journal-title-group>
        <journal-title>Dovite Journal of Multidisciplinary Research</journal-title>
      </journal-title-group>
      <issn pub-type="epub">2999-0000</issn>
      <publisher>
        <publisher-name>Dovite Journal Editorial Board</publisher-name>
      </publisher>
    </journal-meta>
    <article-meta>
      <article-id pub-id-type="doi">{doi_val}</article-id>
      <title-group>
        <article-title>{submission.title}</article-title>
      </title-group>
      <contrib-group>
        <contrib contrib-type="author">
          <name>
            <surname>{author_info.get('name', '').split(' ')[-1]}</surname>
            <given-names>{' '.join(author_info.get('name', '').split(' ')[:-1])}</given-names>
          </name>
          <email>{author_info.get('email', '')}</email>
          <xref ref-type="aff" rid="aff1"/>
        </contrib>
      </contrib-group>
      <aff id="aff1">{author_info.get('affiliation', 'Independent Researcher')}</aff>
      <pub-date pub-type="epub">
        <day>{submission.submittedAt.split('-')[-1] if '-' in submission.submittedAt else '01'}</day>
        <month>07</month>
        <year>2026</year>
      </pub-date>
      <abstract>
        <p>{submission.abstract}</p>
      </abstract>
    </article-meta>
  </front>
</article>"""
    return Response(content=xml_content, media_type="application/xml")

@router.get("/{submission_id}/metadata")
def get_submission_dublin_core_metadata(submission_id: str, db: Session = Depends(get_db)):
    """Returns standard Dublin Core metadata key-value tags for academic indexing engines."""
    submission = db.query(SubmissionModel).filter(SubmissionModel.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
        
    author_info = json.loads(submission.author)
    doi_val = getattr(submission, "doi", "") or f"10.5555/dovite.2026.{submission.id.split('_')[-1]}"
    
    return {
        "DC.Title": submission.title,
        "DC.Creator": author_info.get("name"),
        "DC.Identifier": doi_val,
        "DC.Date": submission.submittedAt,
        "DC.Description": submission.abstract[:300] + "...",
        "DC.Subject": ", ".join(json.loads(submission.keywords)) if submission.keywords else submission.category,
        "DC.Publisher": "Dovite Journal",
        "DC.Language": "en"
    }
