import { Check } from "lucide-react";
import { AudioPlayerMock } from "./AudioPlayerMock";
import { Reveal } from "./Reveal";
import { voiceBullets } from "./data";

export function VoiceFeature() {
  return (
    <section id="voices" className="bg-[#F4F8FF] py-16 text-[#102349] sm:py-24">
      <div className="mx-auto grid w-full max-w-[1200px] gap-10 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8">
        <Reveal>
          <div className="relative">
            <AudioPlayerMock large />
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <h2 className="max-w-[20ch] text-[clamp(1.9rem,4.2vw,3rem)] leading-tight text-[#0E2858]">
            Voices that actually sound like <span className="text-[#2B84FF]">you.</span>
          </h2>
          <p className="mt-5 text-[15px] leading-relaxed text-[#29456F] sm:text-base">
            Our Nigerian AI voices are not just text-to-speech. They carry rhythm, warmth, and familiarity. When you hear something
            that sounds like home, your brain stays present.
          </p>
          <ul className="mt-6 space-y-3">
            {voiceBullets.map((item) => (
              <li key={item} className="flex items-start gap-3 rounded-xl border border-[#D7E3F7] bg-white p-3 text-sm leading-relaxed">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2F7BFF] text-white">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
