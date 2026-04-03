from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import io
from .services.xlsx_parser import parse_mdcat_xlsx
from .services.pdf_ingestion import process_pdf_to_questions
from .services.mistake_analyzer import analyze_mistakes
from .services.weakness_radar import calculate_weakness_radar
from .supabase_client import get_supabase
from typing import Dict, Any, List

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the actual domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/py/health")
def health_check():
    return {"status": "healthy", "service": "MDCAT Elite Backend"}

@app.get("/api/py/hello")
def hello_world():
    return {"message": "Hello from FastAPI on Vercel!"}

@app.post("/api/py/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    title: str = Form(...),
    year: int = Form(...)
):
    # Read file content
    content = await file.read()
    
    # Parse questions
    questions, skipped, error = parse_mdcat_xlsx(content)
    
    if error:
        raise HTTPException(status_code=400, detail=error)
    
    if not questions:
        raise HTTPException(status_code=400, detail="No valid questions found in file")

    # Store in staging_questions
    supabase = get_supabase()
    
    result = supabase.table("staging_questions").insert(questions).execute()
    
    if result and hasattr(result, "error") and result.error:  # type: ignore
         raise HTTPException(status_code=500, detail=f"Database error: {result.error}")  # type: ignore

    return {
        "success": True,
        "batch_id": questions[0]["batch_id"],
        "total_parsed": len(questions),
        "skipped_rows": skipped,
        "message": f"Successfully staged {len(questions)} questions for review."
    }

@app.post("/api/py/upload-pdf")
async def upload_pdf(
    file: UploadFile = File(...),
    title: str = Form(...),
    year: int = Form(...)
):
    pdf_content = await file.read()

    questions, skipped, error = process_pdf_to_questions(pdf_content, year)

    if error:
        raise HTTPException(status_code=400, detail=error)

    if not questions:
        raise HTTPException(status_code=400, detail="No valid questions found in PDF")

    supabase = get_supabase()

    result = supabase.table("staging_questions").insert(questions).execute()

    if result and hasattr(result, "error") and result.error:  # type: ignore
        raise HTTPException(status_code=500, detail=f"Database error: {result.error}")  # type: ignore

    return {
        "success": True,
        "batch_id": questions[0]["batch_id"],
        "total_parsed": len(questions),
        "skipped_rows": skipped,
        "message": f"Successfully staged {len(questions)} questions for review."
    }

@app.get("/api/py/staging/{batch_id}")
async def get_staging(batch_id: str):
    supabase = get_supabase()
    result = supabase.table("staging_questions").select("*").eq("batch_id", batch_id).execute()
    return result.data

@app.put("/api/py/staging/{id}")
async def update_staging(id: str, data: Dict[str, Any]):
    supabase = get_supabase()
    result = supabase.table("staging_questions").update(data).eq("id", id).execute()
    return result.data

@app.delete("/api/py/staging/{id}")
async def delete_staging(id: str):
    supabase = get_supabase()
    result = supabase.table("staging_questions").delete().eq("id", id).execute()
    return {"success": True}

@app.post("/api/py/publish/{batch_id}")
async def publish_batch(batch_id: str, title: str = Form(...), year: int = Form(...), subject: str = Form(...)):
    supabase = get_supabase()
    
    # 1. Fetch approved staging questions
    staging = supabase.table("staging_questions").select("*").eq("batch_id", batch_id).eq("status", "approved").execute()
    
    if not staging.data:
        # Fallback: take all if none marked approved? No, let's be strict or assume all pending as approved if needed
        staging = supabase.table("staging_questions").select("*").eq("batch_id", batch_id).execute()

    if not staging.data:
        raise HTTPException(status_code=404, detail="No questions found for this batch")

    # 2. Create Quiz
    quiz_data = {
        "title": title,
        "year": year,
        "subject": subject,
        "total_questions": len(staging.data),
        "is_premium": False # Default
    }
    quiz_res = supabase.table("quizzes").insert(quiz_data).execute()
    if not quiz_res or not quiz_res.data or len(quiz_res.data) == 0:
        raise HTTPException(status_code=500, detail="Failed to create quiz")
    quiz_id = quiz_res.data[0]["id"]  # type: ignore

    # 3. Insert into Questions and map via quiz_questions
    # We'll do this in a loop or batch if supported well by client
    for q in staging.data:
        if not isinstance(q, dict):
            continue
        q_data = {
            "question_text": q.get("question_text", ""),
            "option_a": q.get("option_a", ""),
            "option_b": q.get("option_b", ""),
            "option_c": q.get("option_c", ""),
            "option_d": q.get("option_d", ""),
            "correct_option": q.get("correct_option"),
            "subject": q.get("subject", "General"),
            "explanation": q.get("explanation"),
            "year": q.get("year"),
            "image_url": q.get("image_url")
        }
        q_res = supabase.table("questions").insert(q_data).execute()
        if not q_res or not q_res.data or len(q_res.data) == 0:  # type: ignore
            continue
        q_id = q_res.data[0]["id"]  # type: ignore  # type: ignore
        
        # Link to quiz
        supabase.table("quiz_questions").insert({
            "quiz_id": quiz_id,
            "question_id": q_id
        }).execute()

    # 4. Cleanup staging
    supabase.table("staging_questions").delete().eq("batch_id", batch_id).execute()

    return {"success": True, "quiz_id": quiz_id, "questions_published": len(staging.data)}

@app.get("/api/py/analytics/mistakes/{user_id}")
async def get_mistake_analysis(user_id: str):
    return analyze_mistakes(user_id)

@app.get("/api/py/analytics/radar/{user_id}")
async def get_weakness_radar(user_id: str):
    return calculate_weakness_radar(user_id)

# Root redirect or documentation could be added here
@app.get("/api/py")
def read_root():
    return {"message": "MDCAT Elite API Layer"}
