'use server';

import { Resend } from 'resend';

const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new Resend(apiKey);
};

const getRedirectUrl = () => process.env.FORM_SUCCESS_REDIRECT_URL?.trim() || null;

const sanitize = (value: FormDataEntryValue | null) => (typeof value === 'string' ? value.trim() : '');

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export async function subscribeToNewsletter(formData: FormData) {
  const email = sanitize(formData.get('email'));

  if (!email || !isValidEmail(email)) {
    return { error: 'Email is required' };
  }

  const resend = getResendClient();
  if (!resend) {
    return { error: 'Missing RESEND_API_KEY. Add it in .env.local.' };
  }

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: process.env.RESEND_TO_EMAIL || 'jackpal.read@gmail.com',
      subject: 'New JackPal newsletter signup',
      html: `<p><strong>Newsletter signup:</strong> ${email}</p>`,
    });

    return { success: true, redirectTo: getRedirectUrl() };
  } catch (error) {
    console.error('Newsletter email failed:', error);
    return { error: 'Failed to send email. Please try again.' };
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

  const resend = getResendClient();
  if (!resend) {
    return { error: 'Missing RESEND_API_KEY. Add it in .env.local.' };
  }

  const safeStudyMethods = studyMethods.length > 0 ? studyMethods.join(', ') : 'None selected';
  const safePainPoint = painPoint || 'Not provided';

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: process.env.RESEND_TO_EMAIL || 'jackpal.read@gmail.com',
      subject: 'New JackPal waitlist submission',
      html: `
        <h2>New Waitlist Submission</h2>
        <p><strong>Full Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Level of Study:</strong> ${studyLevel}</p>
        <p><strong>Features Wanted:</strong> ${featuresWanted}</p>
        <p><strong>Pain Point:</strong> ${safePainPoint}</p>
        <p><strong>Current Study Methods:</strong> ${safeStudyMethods}</p>
      `,
    });

    return { success: true, redirectTo: getRedirectUrl() };
  } catch (error) {
    console.error('Waitlist email failed:', error);
    return { error: 'Failed to send waitlist form. Please try again.' };
  }
}
