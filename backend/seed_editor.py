from database import SessionLocal, engine, Base
from models import EditorModel, BoardMemberModel
import uuid
from routers.auth import get_password_hash

# Ensure tables exist
Base.metadata.create_all(bind=engine)

def seed_editor():
    db = SessionLocal()
    
    # 1. Seed Authorized Board Members
    authorized_emails = ["editor@journal.com", "board@journal.com", "reviewer@journal.com"]
    for email in authorized_emails:
        if not db.query(BoardMemberModel).filter(BoardMemberModel.email == email).first():
            db.add(BoardMemberModel(
                id=f"bm_{uuid.uuid4().hex[:8]}",
                email=email
            ))
            print(f"Added authorized board member: {email}")

    # 2. Seed Default Editor
    editor_email = "editor@journal.com"
    existing = db.query(EditorModel).filter(EditorModel.email == editor_email).first()
    if existing:
        print(f"Editor {editor_email} already exists.")
    else:
        editor = EditorModel(
            id=f"ed_{uuid.uuid4().hex[:8]}",
            email=editor_email,
            hashed_password=get_password_hash("editor123")
        )
        db.add(editor)
        print(f"Created editor: {editor_email} / editor123")

    db.commit()
    db.close()

if __name__ == "__main__":
    seed_editor()
