import os
import secrets
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request, BackgroundTasks
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from limiter import limiter
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import JWTError, jwt
from database import get_db
from models import EditorModel, BoardMemberModel, EditorSignupSchema, AuthorModel, AuthorRegistrationSchema, AuthorLoginSchema
from email_service import send_otp_email
import uuid

# In-memory OTP storage mapping: email -> (otp_code, expiration_datetime)
ACTIVE_OTPS = {}

router = APIRouter(
    prefix="/api/auth",
    tags=["auth"]
)

SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not SECRET_KEY:
    if os.getenv("ENVIRONMENT") == "production":
        raise RuntimeError("CRITICAL: JWT_SECRET_KEY environment variable is not set in production!")
    SECRET_KEY = "fallback_secret_for_demo_only"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 7 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

class Token(BaseModel):
    access_token: str
    token_type: str

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/login", response_model=Token)
@limiter.limit("5/minute")
def login_for_access_token(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    editor = db.query(EditorModel).filter(EditorModel.email == form_data.username).first()
    if not editor or not verify_password(form_data.password, editor.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": editor.email, "role": "editor"}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/signup", response_model=Token)
@limiter.limit("3/minute")
def signup_editor(request: Request, payload: EditorSignupSchema, db: Session = Depends(get_db)):
    if payload.password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
        
    # Check if email is in the authorized board members list
    board_member = db.query(BoardMemberModel).filter(BoardMemberModel.email == payload.email).first()
    if not board_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Registration restricted to authorized editorial board members only."
        )
        
    # Check if editor already exists
    existing_editor = db.query(EditorModel).filter(EditorModel.email == payload.email).first()
    if existing_editor:
        raise HTTPException(status_code=400, detail="Editor already registered")
        
    new_editor = EditorModel(
        id=f"ed_{uuid.uuid4().hex[:8]}",
        email=payload.email,
        hashed_password=get_password_hash(payload.password)
    )
    db.add(new_editor)
    db.commit()
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": new_editor.email, "role": "editor"}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

def get_current_editor(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        role: str = payload.get("role")
        if email is None or role != "editor":
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    editor = db.query(EditorModel).filter(EditorModel.email == email).first()
    if editor is None:
        raise credentials_exception
    return editor

class BoardMemberCreate(BaseModel):
    email: str

class BoardMemberResponse(BaseModel):
    id: str
    email: str

    class Config:
        from_attributes = True

@router.get("/board-members", response_model=list[BoardMemberResponse])
def list_board_members(db: Session = Depends(get_db), current_editor: EditorModel = Depends(get_current_editor)):
    return db.query(BoardMemberModel).all()

@router.post("/board-members", response_model=BoardMemberResponse)
def add_board_member(payload: BoardMemberCreate, db: Session = Depends(get_db), current_editor: EditorModel = Depends(get_current_editor)):
    existing = db.query(BoardMemberModel).filter(BoardMemberModel.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email is already in the authorized board members list.")
    new_member = BoardMemberModel(
        id=f"bm_{uuid.uuid4().hex[:8]}",
        email=payload.email
    )
    db.add(new_member)
    db.commit()
    db.refresh(new_member)
    return new_member

@router.delete("/board-members/{member_id}")
def delete_board_member(member_id: str, db: Session = Depends(get_db), current_editor: EditorModel = Depends(get_current_editor)):
    member = db.query(BoardMemberModel).filter(BoardMemberModel.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Board member not found.")
    db.delete(member)
    db.commit()
    return {"status": "success", "message": f"Removed {member.email}"}

class OTPRequest(BaseModel):
    email: str
    purpose: str = "Verification"

class OTPVerify(BaseModel):
    email: str
    otp_code: str

@router.post("/send-otp")
@limiter.limit("3/minute")
def send_verification_otp(request: Request, payload: OTPRequest, background_tasks: BackgroundTasks):
    otp_code = f"{secrets.randbelow(1000000):06d}"
    print(f"\n[DEV MODE] Generated OTP for {payload.email}: {otp_code}\n")
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    ACTIVE_OTPS[payload.email.lower()] = (otp_code, expires_at)
    
    background_tasks.add_task(send_otp_email, payload.email.lower(), otp_code, payload.purpose)
    return {"status": "success", "message": f"Verification code sent to {payload.email}"}

@router.post("/verify-otp")
@limiter.limit("10/minute")
def verify_verification_otp(request: Request, payload: OTPVerify):
    email_key = payload.email.lower()
    if email_key not in ACTIVE_OTPS:
        raise HTTPException(status_code=400, detail="Invalid verification code or code expired.")
    
    stored_otp, expires_at = ACTIVE_OTPS[email_key]
    if datetime.utcnow() > expires_at:
        ACTIVE_OTPS.pop(email_key, None)
        raise HTTPException(status_code=400, detail="Verification code has expired. Please request a new code.")
        
    if stored_otp != payload.otp_code.strip():
        raise HTTPException(status_code=400, detail="Incorrect verification code.")
        
    ACTIVE_OTPS.pop(email_key, None)
    return {"status": "success", "message": "Email successfully verified."}

@router.post("/author-register", response_model=Token)
@limiter.limit("5/minute")
def register_author(request: Request, payload: AuthorRegistrationSchema, db: Session = Depends(get_db)):
    existing_author = db.query(AuthorModel).filter(AuthorModel.email == payload.email).first()
    if existing_author:
        raise HTTPException(status_code=400, detail="Author already registered with this email.")
        
    new_author = AuthorModel(
        id=f"auth_{uuid.uuid4().hex[:8]}",
        email=payload.email,
        name=payload.name,
        hashed_password=get_password_hash(payload.password),
        affiliation=payload.affiliation,
        country=payload.country,
        orcid=payload.orcid,
        field_of_research=payload.field_of_research
    )
    db.add(new_author)
    db.commit()
    db.refresh(new_author)
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": new_author.email, "role": "author"}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/author-login", response_model=Token)
@limiter.limit("10/minute")
def author_login(request: Request, payload: AuthorLoginSchema, db: Session = Depends(get_db)):
    author = db.query(AuthorModel).filter(AuthorModel.email == payload.email).first()
    if not author or not verify_password(payload.password, author.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": author.email, "role": "author"}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

def get_current_author(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        role: str = payload.get("role")
        if email is None or role not in ["author", "editor"]:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    author = db.query(AuthorModel).filter(AuthorModel.email == email).first()
    if not author:
        # Check if they are an editor
        if role == "editor":
            editor = db.query(EditorModel).filter(EditorModel.email == email).first()
            if editor:
                return {"email": editor.email, "country": "N/A", "name": "Editor"} # Fallback for editors
        raise credentials_exception
    return author

@router.get("/me")
def get_author_profile(author = Depends(get_current_author)):
    if isinstance(author, dict):
        return author # Editor fallback
    return {
        "email": author.email,
        "name": author.name,
        "affiliation": author.affiliation,
        "country": author.country,
        "orcid": author.orcid,
        "field_of_research": author.field_of_research
    }

class ResetPasswordRequest(BaseModel):
    email: str
    otp_code: str
    new_password: str = Field(..., min_length=8)

@router.post("/reset-password")
@limiter.limit("5/minute")
def reset_password(request: Request, payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    email_key = payload.email.lower()
    if email_key not in ACTIVE_OTPS:
        raise HTTPException(status_code=400, detail="Invalid verification code or code expired.")
    
    stored_otp, expires_at = ACTIVE_OTPS[email_key]
    if datetime.utcnow() > expires_at:
        ACTIVE_OTPS.pop(email_key, None)
        raise HTTPException(status_code=400, detail="Verification code has expired. Please request a new code.")
        
    if stored_otp != payload.otp_code.strip():
        raise HTTPException(status_code=400, detail="Incorrect verification code.")
        
    author = db.query(AuthorModel).filter(AuthorModel.email == email_key).first()
    if not author:
        raise HTTPException(status_code=404, detail="Author not found.")
        
    author.hashed_password = get_password_hash(payload.new_password)
    db.commit()
    
    ACTIVE_OTPS.pop(email_key, None)
    return {"status": "success", "message": "Password successfully reset."}
