from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import io
import logging
from .services.xlsx_parser import parse_mdcat_xlsx
from .services.pdf_ingestion import process_pdf_to_questions
from .services.mistake_analyzer import analyze_mistakes
from .services.weakness_radar import calculate_weakness_radar
from .supabase_client import get_supabase
from typing import Dict, Any, List

logging.basicConfig(level=logging.INFO)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the actual domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    logging.error("ValueError on %s: %s", request.url.path, exc)
    return JSONResponse(status_code=400, content={"detail": str(exc)})

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logging.exception("Unhandled exception on %s", request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Internal Server Error", "error": str(exc)})

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
    logging.info("upload_dataset invoked title=%s year=%s filename=%s", title, year, file.filename)

    if year <= 0:
        raise ValueError("Year must be a positive integer")

    # Read file content
    try:
        content = await file.read()
        logging.info("upload_dataset file read: %s bytes", len(content))
    except Exception as read_exc:
        logging.exception("Failed to read uploaded file")
        raise HTTPException(status_code=400, detail=f"Failed to read file: {read_exc}")

    # Parse questions
    questions, skipped, error = parse_mdcat_xlsx(content)
    logging.info("upload_dataset parsed %s questions, skipped=%s, error=%s", len(questions), skipped[:10], error)

    if error:
        raise HTTPException(status_code=400, detail=error)

    if not questions:
        raise HTTPException(status_code=400, detail="No valid questions found in file")

    # Store in staging_questions
    supabase = get_supabase()
    logging.info("upload_dataset: inserting %s questions into staging_questions", len(questions))

    try:
        result = supabase.table("staging_questions").insert(questions).execute()
        logging.info("upload_dataset: supabase insert result type=%s", type(result))
    except Exception as exc:
        logging.exception("Supabase insert failed")
        raise HTTPException(status_code=500, detail=f"Database write failed: {str(exc)}")

    db_error = None
    try:
        if hasattr(result, "error") and getattr(result, "error", None):  # type: ignore
            db_error = getattr(result, "error", None)  # type: ignore
        elif isinstance(result, dict) and result.get("error"):
            db_error = result.get("error")
    except Exception:
        db_error = None

    if db_error:
        logging.error("Supabase insert error: %s", db_error)
        raise HTTPException(status_code=500, detail=f"Database error: {db_error}")

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
    logging.info("upload_pdf invoked title=%s year=%s filename=%s", title, year, file.filename)

    if year <= 0:
        raise ValueError("Year must be a positive integer")

    try:
        pdf_content = await file.read()
        logging.info("upload_pdf file read: %s bytes", len(pdf_content))
    except Exception as read_exc:
        logging.exception("Failed to read uploaded PDF file")
        raise HTTPException(status_code=400, detail=f"Failed to read PDF file: {read_exc}")

    questions, skipped, error = process_pdf_to_questions(pdf_content, year)
    logging.info("upload_pdf processed %s questions, skipped=%s, error=%s", len(questions), skipped[:10], error)

    if error:
        raise HTTPException(status_code=400, detail=error)

    if not questions:
        raise HTTPException(status_code=400, detail="No valid questions found in PDF")

    supabase = get_supabase()
    logging.info("upload_pdf: inserting %s questions into staging_questions", len(questions))

    try:
        result = supabase.table("staging_questions").insert(questions).execute()
        logging.info("upload_pdf: supabase insert result type=%s", type(result))
    except Exception as exc:
        logging.exception("Supabase insert failed")
        raise HTTPException(status_code=500, detail=f"Database write failed: {str(exc)}")

    db_error = None
    try:
        if hasattr(result, "error") and getattr(result, "error", None):  # type: ignore
            db_error = getattr(result, "error", None)  # type: ignore
        elif isinstance(result, dict) and result.get("error"):
            db_error = result.get("error")
    except Exception:
        db_error = None

    if db_error:
        logging.error("Supabase insert error: %s", db_error)
        raise HTTPException(status_code=500, detail=f"Database error: {db_error}")

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
