import { Share2 } from "lucide-react";
import { Reveal } from "./Reveal";

export function ReferralCTA() {
  return (
    <section className="bg-[#F4F8FF] py-14 text-[#102349] sm:py-16">
      <div className="mx-auto w-full max-w-[940px] px-4 sm:px-6 lg:px-8">
        <Reveal>
          <article className="rounded-3xl border border-[#D7E4FA] bg-white p-6 text-center shadow-[0_12px_32px_rgba(28,53,105,0.1)] sm:p-8">
            <span className="inline-flex rounded-full border border-[#BBD6FF] bg-[#EAF2FF] px-3 py-1 text-xs font-semibold tracking-[0.16em] text-[#2058B5]">
              Spread the word
            </span>
            <h2 className="mt-4 text-[clamp(1.6rem,3.6vw,2.4rem)] leading-tight text-[#102A58]">Know a student who needs this?</h2>
            <p className="mx-auto mt-3 max-w-[60ch] text-sm leading-relaxed text-[#33517C] sm:text-base">
              Jackpals is better when your study group uses it. Share it with one person and help them reclaim hours of wasted commute
              time.
            </p>
            <button
              type="button"
              className="mx-auto mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#2E76F7] to-[#35C2FF] px-6 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(55,148,255,0.35)] transition hover:brightness-110"
            >
              <Share2 className="h-4 w-4" />
              Share Jackpals
            </button>
          </article>
        </Reveal>
      </div>
    </section>
  );
}

