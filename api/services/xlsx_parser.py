import pandas as pd
import io
from typing import List, Dict, Any, Tuple
import uuid

VALID_SUBJECTS = ["Biology", "Chemistry", "Physics", "English", "General"]

def parse_mdcat_xlsx(file_content: bytes) -> Tuple[List[Dict[str, Any]], List[int], str]:
    """
    Parses MDCAT XLSX file and returns list of questions, skipped rows, and error message if any.
    """
    try:
        df = pd.read_excel(io.BytesIO(file_content))
    except Exception as e:
        return [], [], f"Failed to read Excel file: {str(e)}"

    if df.empty:
        return [], [], "Excel file is empty"

    # Standardize column names (case-insensitive and strip)
    df.columns = [str(c).strip() for c in df.columns]
    
    required_columns = ["Question", "A", "B", "C", "D", "Correct", "Subject"]
    missing_columns = [col for col in required_columns if col not in df.columns]
    
    if missing_columns:
        return [], [], f"Missing required columns: {', '.join(missing_columns)}"

    questions = []
    skipped_rows = []
    batch_id = str(uuid.uuid4())

    for index, row in df.iterrows():
        # Row index in Excel is 0-indexed + 2 (header + 1-based)
        if isinstance(index, int):
            excel_row_num = index + 2
        elif isinstance(index, float):
            excel_row_num = int(index) + 2
        else:
            excel_row_num = 0

        q_text = str(row.get("Question", "")).strip()
        opt_a = str(row.get("A", "")).strip()
        opt_b = str(row.get("B", "")).strip()
        opt_c = str(row.get("C", "")).strip()
        opt_d = str(row.get("D", "")).strip()
        correct = str(row.get("Correct", "")).strip().upper()
        subject = str(row.get("Subject", "")).strip()
        explanation = str(row.get("Explanation", "")).strip() if "Explanation" in df.columns else ""
        year = str(row.get("Year", "")).strip() if "Year" in df.columns else ""
        image_url = str(row.get("Image", "")).strip() if "Image" in df.columns else ""

        # Validation checks
        if not q_text or q_text == "nan" or not opt_a or not opt_b or not opt_c or not opt_d:
            skipped_rows.append(excel_row_num)
            continue

        if correct not in ["A", "B", "C", "D"]:
            skipped_rows.append(excel_row_num)
            continue

        if subject not in VALID_SUBJECTS:
            # Try to normalize or default to General
            if subject.capitalize() in VALID_SUBJECTS:
                subject = subject.capitalize()
            else:
                subject = "General"

        questions.append({
            "batch_id": batch_id,
            "question_text": q_text,
            "option_a": opt_a,
            "option_b": opt_b,
            "option_c": opt_c,
            "option_d": opt_d,
            "correct_option": correct,
            "subject": subject,
            "explanation": explanation,
            "year": int(year) if year.isdigit() else None,
            "image_url": image_url if image_url != "nan" else None,
            "status": "pending"
        })

    return questions, skipped_rows, ""
