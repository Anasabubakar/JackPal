import { Suspense } from "react";
import ResetPasswordClient from "./reset-password-client";

export const dynamic = "force-dynamic";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F7F7F7]" />}>
      <ResetPasswordClient />
    </Suspense>
  );
}
