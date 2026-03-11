import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

_client: Client | None = None
_admin_client: Client | None = None


def get_supabase() -> Client:
    global _client
    if _client is None:
        url = os.environ["SUPABASE_URL"]
        key = os.environ["SUPABASE_ANON_KEY"]
        _client = create_client(url, key)
    return _client


def get_supabase_admin() -> Client:
    """Service role client — bypasses RLS. Use only for server-side operations."""
    global _admin_client
    if _admin_client is None:
        url = os.environ["SUPABASE_URL"]
        key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
        _admin_client = create_client(url, key)
    return _admin_client
