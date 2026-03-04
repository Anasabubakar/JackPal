'use server';

import { Resend } from 'resend';

const getRedirectUrl = () => process.env.FORM_SUCCESS_REDIRECT_URL?.trim() || null;

const sanitize = (value: FormDataEntryValue | null) => (typeof value === 'string' ? value.trim() : '');

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const MAILERLITE_BASE_URL = 'https://connect.mailerlite.com/api';

const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }
  return new Resend(apiKey);
};

const parseGroupIds = (value: string | undefined) =>
  (value || '')
    .split(',')
    .map((groupId) => groupId.trim())
    .filter(Boolean);

const getSharedMailerLiteGroupIds = () =>
  parseGroupIds(process.env.MAILERLITE_GROUP_IDS);

const getNewsletterGroupIds = () => {
  const shared = getSharedMailerLiteGroupIds();
  if (shared.length > 0) {
    return shared;
  }
  return parseGroupIds(process.env.MAILERLITE_NEWSLETTER_GROUP_IDS);
};

const getWaitlistGroupIds = () => {
  const shared = getSharedMailerLiteGroupIds();
  if (shared.length > 0) {
    return shared;
  }
  return parseGroupIds(process.env.MAILERLITE_WAITLIST_GROUP_IDS);
};

type SyncSubscriberOptions = {
  email: string;
  name?: string;
  groups?: string[];
};

const syncMailerLiteSubscriber = async ({ email, name, groups = [] }: SyncSubscriberOptions) => {
  const apiKey = process.env.MAILERLITE_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false as const, error: 'Missing MAILERLITE_API_KEY. Add it in .env.local.' };
  }

  const payload: {
    email: string;
    fields?: { name?: string };
    groups?: string[];
  } = {
    email,
  };

  if (name) {
    payload.fields = { name };
  }

  if (groups.length > 0) {
    payload.groups = groups;
  }

  const response = await fetch(`${MAILERLITE_BASE_URL}/subscribers`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  if (!response.ok) {
    let details = '';
    try {
      details = JSON.stringify(await response.json());
    } catch {
      details = await response.text();
    }

    console.error('MailerLite sync failed:', response.status, details);
    return { ok: false as const, error: 'Failed to sync subscriber to MailerLite. Please try again.' };
  }

  return { ok: true as const };
};

const sendResendNotification = async (subject: string, html: string) => {
  const resend = getResendClient();
  if (!resend) {
    return { ok: false as const, error: 'Missing RESEND_API_KEY. Add it in .env.local.' };
  }

  const from = process.env.RESEND_FROM_EMAIL?.trim() || 'onboarding@resend.dev';
  const to = process.env.RESEND_TO_EMAIL?.trim() || 'jackpal.read@gmail.com';

  try {
    const result = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });

    if (result.error) {
      console.error('Resend notification API error:', result.error);
      return {
        ok: false as const,
        error: `Resend error: ${result.error.message || 'Unknown Resend error.'}`,
      };
    }

    if (!result.data?.id) {
      console.error('Resend notification returned no message id:', result);
      return { ok: false as const, error: 'Resend did not confirm message delivery request.' };
    }

    console.log('Resend notification queued:', result.data.id);
    return { ok: true as const };
  } catch (error) {
    console.error('Resend notification failed:', error);
    return { ok: false as const, error: 'Failed to send Resend notification. Please try again.' };
  }
};

export async function subscribeToNewsletter(formData: FormData) {
  const email = sanitize(formData.get('email'));

  if (!email || !isValidEmail(email)) {
    return { error: 'Please enter a valid email address.' };
  }

  try {
    const [mailerLiteResult, resendResult] = await Promise.all([
      syncMailerLiteSubscriber({
        email,
        groups: getNewsletterGroupIds(),
      }),
      sendResendNotification(
        'New JackPal newsletter signup',
        `<p><strong>Newsletter signup:</strong> ${email}</p>`
      ),
    ]);

    if (!mailerLiteResult.ok) {
      return { error: mailerLiteResult.error };
    }

    if (!resendResult.ok) {
      return { error: resendResult.error };
    }

    return { success: true, redirectTo: getRedirectUrl() };
  } catch (error) {
    console.error('Newsletter sync failed:', error);
    return { error: 'Failed to sync subscriber. Please try again.' };
  }
}

export async function submitWaitlist(formData: FormData) {
  const fullName = sanitize(formData.get('fullName'));
  const email = sanitize(formData.get('email'));
  const studyLevel = sanitize(formData.get('studyLevel'));
  const featuresWanted = sanitize(formData.get('featuresWanted'));
  const painPoint = sanitize(formData.get('painPoint'));
  const studyMethods = formData
    .getAll('studyMethods')
    .filter((v): v is string => typeof v === 'string')
    .map((v) => v.trim())
    .filter(Boolean);

  if (!fullName || !email || !studyLevel || !featuresWanted) {
    return { error: 'Please fill all required fields.' };
  }

  if (!isValidEmail(email)) {
    return { error: 'Please enter a valid email address.' };
  }

  const safeStudyMethods = studyMethods.length > 0 ? studyMethods.join(', ') : 'None selected';
  const safePainPoint = painPoint || 'Not provided';

  try {
    const [mailerLiteResult, resendResult] = await Promise.all([
      syncMailerLiteSubscriber({
        email,
        name: fullName,
        groups: getWaitlistGroupIds(),
      }),
      sendResendNotification(
        'New JackPal waitlist submission',
        `
          <h2>New Waitlist Submission</h2>
          <p><strong>Full Name:</strong> ${fullName}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Level of Study:</strong> ${studyLevel}</p>
          <p><strong>Features Wanted:</strong> ${featuresWanted}</p>
          <p><strong>Pain Point:</strong> ${safePainPoint}</p>
          <p><strong>Current Study Methods:</strong> ${safeStudyMethods}</p>
        `
      ),
    ]);

    if (!mailerLiteResult.ok) {
      return { error: mailerLiteResult.error };
    }

    if (!resendResult.ok) {
      return { error: resendResult.error };
    }

    // Keep waitlist-specific details for internal debugging/tracing in server logs.
    console.log('Waitlist submission synced to MailerLite + Resend:', {
      email,
      fullName,
      studyLevel,
      featuresWanted,
      painPoint: safePainPoint,
      studyMethods: studyMethods.length > 0 ? studyMethods : ['None selected'],
    });

    return { success: true, redirectTo: getRedirectUrl() };
  } catch (error) {
    console.error('Waitlist sync failed:', error);
    return { error: 'Failed to sync waitlist signup. Please try again.' };
  }
}
