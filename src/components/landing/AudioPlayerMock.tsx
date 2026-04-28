import Image from "next/image";
import { Play, Volume2 } from "lucide-react";

const voices = ["Adaora", "Zainab", "Nonso", "Jude"];

export function AudioPlayerMock({
  large = false,
  showMascot = false,
}: {
  large?: boolean;
  showMascot?: boolean;
}) {
  return (
    <div className="relative mx-auto w-full max-w-[520px]">
      <div
        className={[
          "relative overflow-hidden rounded-[28px] border border-[#2B4EA8]/80 bg-gradient-to-b from-[#0A226D]/95 to-[#041A58]/95",
          "shadow-[0_20px_60px_rgba(0,0,0,0.45)]",
          large ? "p-6 sm:p-8" : "p-5 sm:p-6",
        ].join(" ")}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_90%_0%,rgba(84,205,255,0.24),transparent_42%),radial-gradient(circle_at_0%_100%,rgba(53,126,255,0.2),transparent_44%)]" />
        <div className="relative">
          <p className="text-xs font-semibold tracking-[0.18em] text-[#9AC2FF]">NOW PLAYING</p>
          <div className="mt-3 rounded-2xl border border-[#3A64CA]/70 bg-[#0B2A7D]/70 p-4">
            <p className={large ? "text-lg font-semibold" : "text-base font-semibold"}>BIO302 - Cell Division Notes</p>
            <p className="mt-1 text-xs text-[#B8D0FF]">12 pages · 18 min listen</p>
          </div>

          <div className="mt-5 flex items-end gap-[4px]">
            {Array.from({ length: large ? 34 : 26 }).map((_, i) => (
              <span
                key={i}
                className={[
                  "animate-wave rounded-full bg-gradient-to-b from-[#66DDFF] to-[#2AA6FF]",
                  large ? "w-[4px] sm:w-[5px]" : "w-[3px] sm:w-[4px]",
                ].join(" ")}
                style={{ height: `${10 + ((i * 7) % (large ? 28 : 20))}px`, animationDelay: `${(i % 8) * 0.1}s` }}
              />
            ))}
          </div>

          <div className="mt-5 h-1.5 rounded-full bg-[#113988]">
            <div className="h-full w-[64%] rounded-full bg-gradient-to-r from-[#32BBFF] to-[#4D9CFF]" />
          </div>

          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#4D79DD] bg-[#1651C8] text-white transition hover:bg-[#1E61DC]"
              aria-label="Play audio preview"
            >
              <Play className="h-4 w-4 fill-current" />
            </button>
            <div className="flex items-center gap-1.5 rounded-full border border-[#3159BE] bg-[#0E307F] px-3 py-1.5 text-xs text-[#D7E8FF]">
              <Volume2 className="h-3.5 w-3.5" />
              1x
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {voices.map((voice) => (
              <span
                key={voice}
                className="rounded-full border border-[#3863C9] bg-[#0D2A75] px-3 py-1 text-xs font-semibold text-[#D9E7FF]"
              >
                {voice}
              </span>
            ))}
          </div>
        </div>
      </div>

      {showMascot ? (
        <Image
          src="/images/JackPal 1.png"
          alt="Jackpals blue audio mascot"
          width={120}
          height={120}
          className="absolute -bottom-9 -right-2 hidden animate-float lg:block"
          priority={false}
        />
      ) : null}
    </div>
  );
}

