from typing import List, Dict, Any
from ..supabase_client import get_supabase

def analyze_mistakes(user_id: str) -> Dict[str, Any]:
    """
    Analyzes a student's past mistakes to identify patterns.
    """
    supabase = get_supabase()
    
    # Fetch incorrect answers for the user
    # This assumes user_answers and attempts tables are populated
    result = supabase.table("user_answers") \
        .select("*, questions(*)") \
        .eq("is_correct", False) \
        .execute()
    
    mistakes = result.data
    
    if not mistakes:
        return {"message": "No mistakes found to analyze."}
    
    # Simple logic to group by subject and count
    subject_mistakes = {}
    for m in mistakes:
        subject = m["questions"]["subject"]
        subject_mistakes[subject] = subject_mistakes.get(subject, 0) + 1
    
    return {
        "total_mistakes": len(mistakes),
        "by_subject": subject_mistakes,
        "insights": [
            f"You have the most mistakes in {max(subject_mistakes, key=subject_mistakes.get)}." if subject_mistakes else "Keep practicing!"
        ]
    }
