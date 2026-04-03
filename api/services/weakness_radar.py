from typing import List, Dict, Any
from ..supabase_client import get_supabase

def calculate_weakness_radar(user_id: str) -> Dict[str, Any]:
    """
    Generates a weakness radar based on subject performance.
    """
    supabase = get_supabase()
    
    # Use the view created in migration
    result = supabase.table("user_subject_performance") \
        .select("*") \
        .eq("user_id", user_id) \
        .execute()
    
    performance = result.data
    
    if not performance:
        return {"message": "Not enough data to generate radar."}
    
    radar_data = []
    for p in performance:
        radar_data.append({
            "subject": p["subject"],
            "score": p["accuracy_pct"],
            "fullMark": 100
        })
    
    return {
        "user_id": user_id,
        "radar_data": radar_data
    }
