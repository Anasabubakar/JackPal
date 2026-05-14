import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

const client = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

// Nigerian English default voice ID — resolved from env, falls back to female then male
const DEFAULT_NIGERIAN_VOICE_ID =
  process.env.ELEVENLABS_VOICE_CHINENYE_ID ||
  process.env.ELEVENLABS_NIGERIAN_FEMALE_VOICE_ID ||
  process.env.ELEVENLABS_VOICE_JUDE_ID ||
  process.env.ELEVENLABS_NIGERIAN_MALE_VOICE_ID ||
  '';

export async function synthesizeSpeech(text: string, voiceId?: string) {
  const resolvedVoiceId = voiceId || DEFAULT_NIGERIAN_VOICE_ID;
  if (!resolvedVoiceId) {
    throw new Error('No ElevenLabs Nigerian English voice ID configured. Set ELEVENLABS_VOICE_CHINENYE_ID in your environment.');
  }
  try {
    const audio = await client.textToSpeech.convert(resolvedVoiceId, {
      text,
      // eleven_turbo_v2_5: faster, cheaper, maintains Nigerian English accent stability
      modelId: 'eleven_turbo_v2_5',
      outputFormat: 'mp3_44100_128',
      voiceSettings: {
        stability: 0.75,
        similarityBoost: 0.95,
        style: 0.20,
        useSpeakerBoost: true,
      },
    });

    // In a server environment, we return the stream or buffer.
    // For a Next.js server action, we might want to convert it to base64.
    const chunks: Uint8Array[] = [];
    // @ts-ignore - audio is a Readable stream in Node
    for await (const chunk of audio) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    return buffer.toString('base64');
  } catch (error) {
    console.error('ElevenLabs synthesis failed:', error);
    throw new Error('Failed to synthesize speech');
  }
}
