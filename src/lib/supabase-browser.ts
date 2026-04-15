import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { saveSession } from "@/lib/api";

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error("Supabase env vars are not set.");
    _client = createClient(url, key);
  }
  return _client;
}

export function getSupabase() {
  return getClient();
}

export async function signUpWithEmail(email: string, password: string, fullName: string) {
  const { data, error } = await getClient().auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await getClient().auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  if (!data.session) throw new Error("Login failed — check your email to confirm your account.");
  saveSession(data.session.access_token, {
    id: data.user.id,
    email: data.user.email!,
    full_name: data.user.user_metadata?.full_name || "",
  });
  return data;
}

export async function signInWithGoogle() {
  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback`
      : "/auth/callback";

  const { error } = await getClient().auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });

  if (error) throw new Error(error.message);
}
