export const AUDIO_PREVIEW_VOICES = [
  {
    name: "Adaora",
    origin: "Igbo - Female",
    gender: "Female",
    src: "/audio/adaora_yarngpt.mp3",
  },
  {
    name: "Zainab",
    origin: "Hausa - Female",
    gender: "Female",
    src: "/audio/zainab_yarngpt.mp3",
  },
  {
    name: "Nonso",
    origin: "Igbo - Male",
    gender: "Male",
    src: "/audio/nonso_yarngpt.mp3",
  },
  {
    name: "Jude",
    origin: "Yoruba - Male",
    gender: "Male",
    src: "/audio/jude_yarngpt.mp3",
  },
] as const;

export type AudioPreviewVoice = typeof AUDIO_PREVIEW_VOICES[number];
