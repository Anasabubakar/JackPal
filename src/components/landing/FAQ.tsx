"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { faqs } from "./data";
import { Reveal } from "./Reveal";

export function FAQ() {
  const [openItem, setOpenItem] = useState(0);

  return (
    <section id="faq" className="bg-[#F4F8FF] py-16 text-[#102349] sm:py-24">
      <div className="mx-auto w-full max-w-[900px] px-4 sm:px-6 lg:px-8">
        <Reveal>
          <p className="text-center text-xs font-semibold tracking-[0.18em] text-[#2A73ED]">QUESTIONS</p>
          <h2 className="mt-3 text-center text-[clamp(1.9rem,4.1vw,3rem)] leading-tight">Frequently Asked Questions.</h2>
        </Reveal>

        <div className="mt-9 space-y-3">
          {faqs.map((item, index) => {
            const isOpen = openItem === index;
            const contentId = `faq-content-${index}`;
            return (
              <Reveal key={item.question} delay={index * 0.05}>
                <article className="overflow-hidden rounded-2xl border border-[#D2E1F7] bg-white">
                  <h3>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left text-sm font-semibold text-[#0E2A5B] sm:px-5 sm:text-base"
                      onClick={() => setOpenItem(isOpen ? -1 : index)}
                      aria-expanded={isOpen}
                      aria-controls={contentId}
                      id={`faq-trigger-${index}`}
                    >
                      <span>{item.question}</span>
                      <ChevronDown className={["h-5 w-5 shrink-0 transition", isOpen ? "rotate-180" : ""].join(" ")} />
                    </button>
                  </h3>
                  <div
                    id={contentId}
                    role="region"
                    aria-labelledby={`faq-trigger-${index}`}
                    className={[
                      "grid transition-all duration-300",
                      isOpen ? "grid-rows-[1fr] border-t border-[#E4EDFB]" : "grid-rows-[0fr]",
                    ].join(" ")}
                  >
                    <div className="overflow-hidden">
                      <p className="px-4 py-4 text-sm leading-relaxed text-[#314F7A] sm:px-5">{item.answer}</p>
                    </div>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

