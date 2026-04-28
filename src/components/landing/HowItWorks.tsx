import { Reveal } from "./Reveal";
import { steps } from "./data";

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative overflow-hidden bg-[#020A2A] py-16 sm:py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(61,196,255,0.16),transparent_38%)]" />
      <div className="relative mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <Reveal>
          <p className="text-xs font-semibold tracking-[0.18em] text-[#7BC8FF]">SIMPLE BY DESIGN</p>
          <h2 className="mt-3 max-w-[20ch] text-[clamp(1.9rem,4.1vw,3rem)] leading-tight text-white">
            Three steps to a smarter study session
          </h2>
        </Reveal>

        <div className="mt-9 grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <Reveal key={step.id} delay={index * 0.07}>
              <article className="group h-full rounded-3xl border border-[#263F84] bg-gradient-to-b from-[#081D60]/85 to-[#051548]/85 p-6 shadow-[0_14px_34px_rgba(0,0,0,0.24)] transition hover:-translate-y-1 hover:border-[#3A67CF] hover:shadow-[0_16px_42px_rgba(59,143,255,0.24)]">
                <p className="text-sm font-semibold tracking-[0.12em] text-[#67C9FF]">{step.id}</p>
                <h3 className="mt-3 text-2xl leading-tight text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#D5E6FF]">{step.description}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

