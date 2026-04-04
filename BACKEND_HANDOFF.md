# Backend Handoff — `feature/backend-supabase`

## What Changed

### Auth
- `/auth/signup` — creates user in Supabase Auth
- `/auth/login` — signs in with Supabase, returns JWT access token
- `/auth/reset` — sends password reset email via Supabase
- Email confirmation is **disabled** in Supabase dashboard (users log in immediately after signup)

### Storage
- Documents uploaded to **Supabase Storage** bucket: `documents`
- Audio chunks uploaded to **Supabase Storage** bucket: `audio`
- All metadata stored in **Supabase DB** (tables: `documents`, `audio_tracks`, `activity`)

### Audio Performance
- Audio chunk URLs are now **signed Supabase Storage URLs** (browser downloads directly from Supabase CDN — no backend proxy hop)
- Re-clicking LISTEN on the same voice/engine returns cached chunks instantly (no re-synthesis)

---

## What the Frontend Needs to Do

### 1. Environment Variables
Add to `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://bmofusapddseovfbdomr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtb2Z1c2FwZGRzZW92ZmJkb21yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNzE0NzAsImV4cCI6MjA4ODY0NzQ3MH0.OWqqoj4cZthc37j2kQdH2Iszu9sJxnhefd_-Qttf4dI
```

### 2. Install Supabase JS Client
```bash
npm install @supabase/supabase-js --force
```

### 3. Create `src/lib/supabase-browser.ts`
```ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 4. Create `src/app/auth/callback/page.tsx`
This page handles the redirect after Google OAuth. Supabase redirects here with the session.

```tsx
'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";
import { saveSession } from "@/lib/api";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        saveSession(session.access_token, {
          id: session.user.id,
          email: session.user.email!,
          full_name:
            session.user.user_metadata?.full_name ||
            session.user.user_metadata?.name ||
            "",
        });
        router.replace("/dashboard");
      } else {
        router.replace("/login?error=oauth_failed");
      }
    });
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-[#F7F7F7]">
      <p className="text-[#02013D] font-black uppercase tracking-widest text-xs animate-pulse">
        Signing you in…
      </p>
    </div>
  );
}
```

### 5. Wire the Google Button in `src/app/login/page.tsx`
Import supabase and add the handler:

```ts
import { supabase } from "@/lib/supabase-browser";

const handleGoogleLogin = async () => {
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  });
};
```

Attach to the Google button:
```tsx
<button onClick={handleGoogleLogin}>
  Continue with Google
</button>
```

### 6. Supabase Dashboard Settings (one-time)
- **Authentication → Sign In / Providers → Google** — enable and paste Google OAuth Client ID + Secret
- **Authentication → URL Configuration**
  - Site URL: `http://localhost:3000`
  - Redirect URLs: add `http://localhost:3000/auth/callback`

### 7. Google Cloud Console (one-time)
1. Go to [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials
2. Create **OAuth 2.0 Client ID** → Web application
3. Authorized redirect URI: `https://bmofusapddseovfbdomr.supabase.co/auth/v1/callback`
4. Copy Client ID + Secret → paste into Supabase (step 6)

---

## Auth Flow Summary

```
Email/Password:
  Frontend → POST /auth/login (backend) → Supabase sign_in_with_password → JWT returned → saved to localStorage

Google OAuth:
  Frontend → supabase.auth.signInWithOAuth() → Google → Supabase callback → /auth/callback (frontend) → JWT saved → /dashboard
```

---

## Backend `.env` Required Keys
```
SUPABASE_URL=https://bmofusapddseovfbdomr.supabase.co
SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
JWT_SECRET=<any secret string>
```

> **Never commit `.env` files.** They are already in `.gitignore`.
