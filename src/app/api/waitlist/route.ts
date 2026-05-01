import { NextResponse } from "next/server";
import { Resend } from "resend";

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function parseGroupIds(...sources: (string | undefined)[]): string[] {
  const set = new Set<string>();
  for (const src of sources) {
    (src || "")
      .split(",")
      .map((g) => g.trim())
      .filter(Boolean)
      .forEach((g) => set.add(g));
  }
  return Array.from(set);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

type WaitlistPayload = {
  email?: unknown;
  fullName?: unknown;
  name?: unknown;
  phone?: unknown;
  institution?: unknown;
  level?: unknown;
  fieldOfStudy?: unknown;
  primaryUse?: unknown;
  struggle?: unknown;
  referralSource?: unknown;
  wantsNigerianVoices?: unknown;
};

export async function POST(req: Request) {
  try {
    const data = (await req.json()) as WaitlistPayload;

    const email = String(data.email ?? "")
      .trim()
      .toLowerCase();
    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const fullName = String(data.fullName ?? data.name ?? "").trim();
    const phone = String(data.phone ?? "").trim();
    const institution = String(data.institution ?? "").trim();
    const level = String(data.level ?? "").trim();
    const fieldOfStudy = String(data.fieldOfStudy ?? "").trim();
    const primaryUse = String(data.primaryUse ?? "").trim();
    const struggle = String(data.struggle ?? "").trim();
    const referralSource = String(data.referralSource ?? "").trim();
    const wantsNigerianVoices = Boolean(data.wantsNigerianVoices);

    const isDetailed = [institution, level, fieldOfStudy, primaryUse, struggle].every((v) => v.length > 0);

    if (isDetailed && !fullName) {
      return NextResponse.json({ error: "Please enter your full name." }, { status: 400 });
    }

    const displayName = fullName || "Waitlist subscriber";
    const isLegacyShort = !isDetailed;

    if (isLegacyShort && !fullName) {
      // email-only style signup still allowed; use neutral label in emails
    }

    // ── MailerLite ───────────────────────────────────────────────────────────
    const mlKey = process.env.MAILERLITE_API_KEY?.trim();
    const groupIds = parseGroupIds(process.env.MAILERLITE_GROUP_IDS, process.env.MAILERLITE_WAITLIST_GROUP_IDS);

    const mlFields: Record<string, string> = {};
    if (displayName && displayName !== "Waitlist subscriber") mlFields.name = displayName;
    if (phone) mlFields.phone = phone;
    if (institution) mlFields.company = institution;

    const sendMailerLite = async (fields: Record<string, string>) => {
      if (!mlKey) return { ok: true as const };
      const body: Record<string, unknown> = {
        email,
        status: "active",
      };
      if (Object.keys(fields).length > 0) body.fields = fields;
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
        const errJson = await mlRes.json().catch(() => ({}));
        console.error("MailerLite error:", mlRes.status, errJson);
        return {
          ok: false as const,
          error: `MailerLite could not add this subscriber (${mlRes.status}).`,
        };
      }
      return { ok: true as const };
    };

    let mlResult = await sendMailerLite(mlFields);
    if (!mlResult.ok && Object.keys(mlFields).length > 0) {
      const minimalFields: Record<string, string> = {};
      if (displayName && displayName !== "Waitlist subscriber") {
        minimalFields.name = displayName;
      }
      mlResult = await sendMailerLite(minimalFields);
    }
    if (!mlResult.ok) {
      return NextResponse.json({ error: mlResult.error }, { status: 502 });
    }

    // ── Resend ────────────────────────────────────────────────────────────────
    const resendKey = process.env.RESEND_API_KEY?.trim();
    const notifyTo = process.env.RESEND_TO_EMAIL?.trim();
    const notifyFrom = process.env.RESEND_FROM_EMAIL?.trim() || "onboarding@resend.dev";
    const fromHeader = `Jackpals <${notifyFrom}>`;

    if (resendKey && notifyTo) {
      const resend = new Resend(resendKey);
      const safe = {
        displayName: escapeHtml(displayName),
        email: escapeHtml(email),
        phone: escapeHtml(phone || "—"),
        institution: escapeHtml(institution || "—"),
        level: escapeHtml(level || "—"),
        fieldOfStudy: escapeHtml(fieldOfStudy || "—"),
        primaryUse: escapeHtml(primaryUse || "—"),
        struggle: escapeHtml(struggle || "—"),
        referralSource: escapeHtml(referralSource || "—"),
        voices: wantsNigerianVoices ? "Yes" : "No",
      };

      const internalHtml = `
        <!DOCTYPE html>
        <html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#0f172a;max-width:560px">
          <h2 style="margin:0 0 16px">New waitlist signup</h2>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr><td style="padding:8px 0;border-bottom:1px solid #e2e8f0"><strong>Name</strong></td><td style="padding:8px 0;border-bottom:1px solid #e2e8f0">${safe.displayName}</td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid #e2e8f0"><strong>Email</strong></td><td style="padding:8px 0;border-bottom:1px solid #e2e8f0">${safe.email}</td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid #e2e8f0"><strong>Phone</strong></td><td style="padding:8px 0;border-bottom:1px solid #e2e8f0">${safe.phone}</td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid #e2e8f0"><strong>School</strong></td><td style="padding:8px 0;border-bottom:1px solid #e2e8f0">${safe.institution}</td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid #e2e8f0"><strong>Level</strong></td><td style="padding:8px 0;border-bottom:1px solid #e2e8f0">${safe.level}</td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid #e2e8f0"><strong>Field of study</strong></td><td style="padding:8px 0;border-bottom:1px solid #e2e8f0">${safe.fieldOfStudy}</td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid #e2e8f0"><strong>Primary use</strong></td><td style="padding:8px 0;border-bottom:1px solid #e2e8f0">${safe.primaryUse}</td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid #e2e8f0"><strong>Biggest struggle</strong></td><td style="padding:8px 0;border-bottom:1px solid #e2e8f0">${safe.struggle}</td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid #e2e8f0"><strong>Heard via</strong></td><td style="padding:8px 0;border-bottom:1px solid #e2e8f0">${safe.referralSource}</td></tr>
            <tr><td style="padding:8px 0"><strong>Nigerian voices / early access</strong></td><td style="padding:8px 0">${safe.voices}</td></tr>
          </table>
          <p style="margin-top:20px;font-size:12px;color:#64748b">${isLegacyShort ? "Note: short form (legacy or minimal fields)." : "Full waitlist form."}</p>
        </body></html>`;

      const internalResult = await resend.emails.send({
        from: fromHeader,
        to: [notifyTo],
        subject: `New waitlist — ${email}`,
        html: internalHtml,
      });

      if (internalResult.error) {
        console.error("Resend internal error:", internalResult.error);
        return NextResponse.json(
          { error: internalResult.error.message || "Could not send notification email." },
          { status: 502 },
        );
      }
    } else if (!resendKey || !notifyTo) {
      console.warn("Waitlist: RESEND_API_KEY or RESEND_TO_EMAIL missing; skipped team notification email.");
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Waitlist error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
