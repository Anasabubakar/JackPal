import { BrandLogo } from "./BrandLogo";
import { Reveal } from "./Reveal";
import { featureCards } from "./data";

export function FeatureGrid() {
  return (
    <section className="bg-[#EEF4FF] py-16 text-[#102349] sm:py-24">
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <Reveal>
          <p className="text-xs font-semibold tracking-[0.18em] text-[#2A73ED]">REAL ACTION</p>
          <div className="mt-2 hidden sm:block">
            <BrandLogo className="h-11 w-11" />
          </div>
          <h2 className="mt-3 max-w-[16ch] text-[clamp(1.9rem,4.2vw,3rem)] leading-tight">
            Everything you need. Nothing you do not.
          </h2>
        </Reveal>

        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featureCards.map((feature, index) => (
            <Reveal key={feature.title} delay={index * 0.05}>
              <article className="h-full rounded-3xl border border-[#D5E3FA] bg-white p-6 shadow-[0_12px_30px_rgba(21,48,95,0.08)] transition hover:-translate-y-1 hover:shadow-[0_20px_38px_rgba(21,48,95,0.14)]">
                <h3 className="text-xl leading-tight text-[#0E2958]">{feature.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#2C476F]">{feature.description}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
