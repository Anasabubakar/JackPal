'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { JackpalsLogo } from "@/components/brand/JackpalsLogo";
import { getSupabase } from "@/lib/supabase-browser";
import { saveSession } from "@/lib/api";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    getSupabase().auth.getSession().then(({ data: { session } }) => {
      if (session) {
        saveSession(session.access_token, {
          id: session.user.id,
          email: session.user.email!,
          full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || "",
        });
        router.replace("/dashboard");
      } else {
        router.replace("/login?error=oauth_failed");
      }
    });
  }, [router]);

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6 bg-[#F7F7F7] px-4">
      <JackpalsLogo variant="wordmark" priority className="h-10 w-auto" />
      <p className="animate-pulse text-center text-xs font-black uppercase tracking-widest text-[#02013D]">
        Signing you in…
      </p>
    </div>
  );
}
