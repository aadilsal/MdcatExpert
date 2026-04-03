import os
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv
from fastapi import HTTPException

# Load .env.local first, then .env as fallback
env_local = Path(__file__).parent.parent / ".env.local"
env_file = Path(__file__).parent.parent / ".env"

if env_local.exists():
    load_dotenv(env_local)
elif env_file.exists():
    load_dotenv(env_file)
else:
    load_dotenv()

def get_supabase() -> Client:
    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

    if not url:
        raise HTTPException(status_code=500, detail="Missing NEXT_PUBLIC_SUPABASE_URL. Add it to .env.local")
    
    if not key:
        raise HTTPException(status_code=500, detail="Missing SUPABASE_SERVICE_ROLE_KEY. Get it from Supabase dashboard (Settings > API > Service role key) and add to .env.local")

    try:
        client = create_client(url, key)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to initialize Supabase client: {exc}")

    return client
