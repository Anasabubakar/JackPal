'use server';

export async function subscribeToNewsletter(formData: FormData) {
  const email = formData.get('email') as string;

  if (!email) {
    return { error: 'Email is required' };
  }

  // Simulate a database save or API call to a mailing service
  await new Promise((resolve) => setTimeout(resolve, 2000));

  console.log(`Subscribed to newsletter: ${email}`);

  return { success: true };
}
