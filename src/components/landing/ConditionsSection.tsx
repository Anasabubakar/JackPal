import { ShieldCheck } from "lucide-react";
import { Reveal } from "./Reveal";
import { conditionBullets } from "./data";

export function ConditionsSection() {
  return (
    <section className="bg-[#020A2A] py-16 sm:py-24">
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <Reveal>
          <article className="relative overflow-hidden rounded-[32px] border border-[#2A458D] bg-gradient-to-r from-[#071A58] to-[#041343] p-7 shadow-[0_18px_44px_rgba(0,0,0,0.34)] sm:p-10">
            <div className="pointer-events-none absolute -right-24 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(70,214,255,0.42)_0%,rgba(70,214,255,0)_70%)]" />

            <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] text-[#93CCFF]">Privacy & performance</p>
                <h2 className="mt-3 max-w-[22ch] text-[clamp(1.8rem,4vw,2.9rem)] leading-tight text-white">
                  Built for real-world <span className="text-[#38C1FF]">Nigerian conditions.</span>
                </h2>
                <p className="mt-4 max-w-[65ch] text-sm leading-relaxed text-[#CFE1FF] sm:text-base">
                  Jackpals does not assume you have fast WiFi, unlimited data, or a 2024 flagship phone. It is engineered for the actual
                  constraints of student life.
                </p>

                <ul className="mt-6 space-y-3">
                  {conditionBullets.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-[#E3EEFF]">
                      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#56D0FF]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="relative hidden h-64 items-center justify-center lg:flex">
                <div className="absolute h-56 w-56 rounded-full border border-[#3A67D0]/50" />
                <div className="absolute h-44 w-44 rounded-full border border-[#3EC7FF]/45" />
                <div className="h-28 w-28 rounded-full bg-[radial-gradient(circle,#5EE0FF_0%,#2B79FF_70%)] blur-[2px]" />
              </div>
            </div>
          </article>
        </Reveal>
      </div>
    </section>
  );
}

