'use server';

const getRedirectUrl = () => process.env.FORM_SUCCESS_REDIRECT_URL?.trim() || null;

const sanitize = (value: FormDataEntryValue | null) => (typeof value === 'string' ? value.trim() : '');

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const MAILERLITE_BASE_URL = 'https://connect.mailerlite.com/api';

const parseGroupIds = (value: string | undefined) =>
  (value || '')
    .split(',')
    .map((groupId) => groupId.trim())
    .filter(Boolean);

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

export async function subscribeToNewsletter(formData: FormData) {
  const email = sanitize(formData.get('email'));

  if (!email || !isValidEmail(email)) {
    return { error: 'Please enter a valid email address.' };
  }

  try {
    const result = await syncMailerLiteSubscriber({
      email,
      groups: parseGroupIds(process.env.MAILERLITE_NEWSLETTER_GROUP_IDS),
    });

    if (!result.ok) {
      return { error: result.error };
    }

    return { success: true, redirectTo: getRedirectUrl() };
  } catch (error) {
    console.error('Newsletter MailerLite sync failed:', error);
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

  try {
    const result = await syncMailerLiteSubscriber({
      email,
      name: fullName,
      groups: parseGroupIds(process.env.MAILERLITE_WAITLIST_GROUP_IDS),
    });

    if (!result.ok) {
      return { error: result.error };
    }

    // Keep waitlist-specific details for internal debugging/tracing in server logs.
    console.log('Waitlist submission synced to MailerLite:', {
      email,
      fullName,
      studyLevel,
      featuresWanted,
      painPoint: painPoint || 'Not provided',
      studyMethods: studyMethods.length > 0 ? studyMethods : ['None selected'],
    });

    return { success: true, redirectTo: getRedirectUrl() };
  } catch (error) {
    console.error('Waitlist MailerLite sync failed:', error);
    return { error: 'Failed to sync waitlist signup. Please try again.' };
  }
}
