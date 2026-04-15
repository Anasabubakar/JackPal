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
          full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || "",
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
