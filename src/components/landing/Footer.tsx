import { BrandLogo } from "./BrandLogo";

const productLinks = ["How It Works", "Voices", "Features", "Pricing", "Waitlist"];
const companyLinks = ["About", "Blog", "Career", "Contact"];
const legalLinks = ["Privacy Policy", "Terms of Use", "Cookie Policy"];

export function Footer() {
  return (
    <footer className="bg-[#01071F] py-12 text-[#D7E6FF] sm:py-14">
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 border-b border-[#1F356E] pb-10 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
          <div>
            <div className="flex items-center">
              <BrandLogo className="h-11 w-11" />
            </div>
            <p className="mt-4 max-w-[30ch] text-sm leading-relaxed text-[#A9C1E8]">
              Learn in a way that actually works. Your notes, your voice, your pace.
            </p>
          </div>

          <nav aria-label="Product" className="space-y-3">
            <p className="text-sm font-semibold tracking-[0.08em] text-white">PRODUCT</p>
            {productLinks.map((item) => (
              <a key={item} href="#" className="block text-sm text-[#B7CDED] transition hover:text-white">
                {item}
              </a>
            ))}
          </nav>

          <nav aria-label="Company" className="space-y-3">
            <p className="text-sm font-semibold tracking-[0.08em] text-white">COMPANY</p>
            {companyLinks.map((item) => (
              <a key={item} href="#" className="block text-sm text-[#B7CDED] transition hover:text-white">
                {item}
              </a>
            ))}
          </nav>

          <nav aria-label="Legal" className="space-y-3">
            <p className="text-sm font-semibold tracking-[0.08em] text-white">LEGAL</p>
            {legalLinks.map((item) => (
              <a key={item} href="#" className="block text-sm text-[#B7CDED] transition hover:text-white">
                {item}
              </a>
            ))}
          </nav>
        </div>

        <div className="mt-6 flex flex-col gap-3 text-xs text-[#9FB8DE] sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Jackpals. All rights reserved. Built with love for Nigerian students.</p>
          <p>Socials</p>
        </div>
      </div>
    </footer>
  );
}
