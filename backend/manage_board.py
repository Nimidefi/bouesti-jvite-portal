import sys
import uuid
from database import SessionLocal
from models import BoardMemberModel

def main():
    if len(sys.argv) < 2:
        print("Usage: python manage_board.py [list | add <email> | remove <email>]")
        return

    action = sys.argv[1].lower()
    db = SessionLocal()

    try:
        if action == "list":
            members = db.query(BoardMemberModel).all()
            print(f"\nAuthorized Editorial Board Members ({len(members)} total):")
            for m in members:
                print(f"  [{m.id}] {m.email}")
            print()

        elif action == "add":
            if len(sys.argv) < 3:
                print("Error: Please provide an email address to add.")
                return
            email = sys.argv[2].strip()
            existing = db.query(BoardMemberModel).filter(BoardMemberModel.email == email).first()
            if existing:
                print(f"Email '{email}' is already in the authorized board member list (ID: {existing.id}).")
            else:
                new_m = BoardMemberModel(id=f"bm_{uuid.uuid4().hex[:8]}", email=email)
                db.add(new_m)
                db.commit()
                print(f"Successfully added '{email}' to authorized board members list.")

        elif action == "remove":
            if len(sys.argv) < 3:
                print("Error: Please provide an email address to remove.")
                return
            email = sys.argv[2].strip()
            existing = db.query(BoardMemberModel).filter(BoardMemberModel.email == email).first()
            if not existing:
                print(f"Email '{email}' was not found in the board member list.")
            else:
                db.delete(existing)
                db.commit()
                print(f"Successfully removed '{email}' from authorized board members list.")
        else:
            print("Invalid action. Use: list, add, or remove")
    finally:
        db.close()

if __name__ == "__main__":
    main()
