import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

const client = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

export async function synthesizeSpeech(text: string, voiceId: string = 'JBFqnCBsd6RMkjVDRZzb') {
  try {
    const audio = await client.textToSpeech.convert(voiceId, {
      text,
      modelId: 'eleven_multilingual_v2',
      outputFormat: 'mp3_44100_128',
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
