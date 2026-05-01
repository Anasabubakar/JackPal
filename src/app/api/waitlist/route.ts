import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: Request) {
  try {
    const { email, name } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName  = (name ?? "").trim();

    // ── 1. Add to MailerLite ──────────────────────────────────────────────────
    const mlKey = process.env.MAILERLITE_API_KEY;
    if (mlKey) {
      const groupIds = [
        process.env.MAILERLITE_GROUP_IDS,
        process.env.MAILERLITE_WAITLIST_GROUP_IDS,
      ]
        .join(",")
        .split(",")
        .map((g) => g.trim())
        .filter(Boolean);

      const body: Record<string, unknown> = {
        email: trimmedEmail,
        fields: trimmedName ? { name: trimmedName } : {},
        status: "active",
      };
      if (groupIds.length) body.groups = groupIds;

      const mlRes = await fetch("https://connect.mailerlite.com/api/subscribers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${mlKey}`,
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!mlRes.ok && mlRes.status !== 409) {
        const err = await mlRes.json().catch(() => ({}));
        console.error("MailerLite error:", err);
      }
    }

    // ── 2. Notify via Resend ──────────────────────────────────────────────────
    const resendKey  = process.env.RESEND_API_KEY;
    const notifyTo   = process.env.RESEND_TO_EMAIL;
    const notifyFrom = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

    if (resendKey && notifyTo) {
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from: `JackPal <${notifyFrom}>`,
        to: [notifyTo],
        subject: `New waitlist signup — ${trimmedEmail}`,
        html: `
          <p style="font-family:sans-serif">
            <strong>New JackPal waitlist signup</strong><br/><br/>
            <b>Email:</b> ${trimmedEmail}<br/>
            ${trimmedName ? `<b>Name:</b> ${trimmedName}` : ""}
          </p>
        `,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Waitlist error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
