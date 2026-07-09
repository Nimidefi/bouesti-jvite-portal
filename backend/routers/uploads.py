import os
import aiofiles
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from pydantic import BaseModel

router = APIRouter(
    prefix="/api/uploads",
    tags=["uploads"]
)

UPLOAD_DIR = "uploads"
MAX_FILE_SIZE = 25 * 1024 * 1024 # 25 MB
ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx"}

if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

class UploadResponse(BaseModel):
    filename: str
    size: int
    url: str

import uuid

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
}

@router.post("", response_model=UploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(file: UploadFile = File(...)):
    # Validate file extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File extension {ext} not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}")
    
    # Validate MIME type if present
    if file.content_type and file.content_type != "application/octet-stream" and file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid file content type ({file.content_type}). Please upload a valid PDF or Word document.")

    # Sanitize filename to prevent directory traversal and file overwrite collisions
    safe_filename = f"{uuid.uuid4().hex[:8]}_{os.path.basename(file.filename)}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)
    
    # Save file and calculate size
    size = 0
    async with aiofiles.open(file_path, 'wb') as out_file:
        while content := await file.read(1024 * 1024):  # read in 1MB chunks
            size += len(content)
            if size > MAX_FILE_SIZE:
                os.remove(file_path)
                raise HTTPException(status_code=413, detail=f"File too large. Maximum size is {MAX_FILE_SIZE / (1024 * 1024)} MB")
            await out_file.write(content)

    return UploadResponse(
        filename=safe_filename,
        size=size,
        url=f"/uploads/{safe_filename}"
    )
