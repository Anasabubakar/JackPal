import { ConditionsSection } from "@/components/landing/ConditionsSection";
import { FAQ } from "@/components/landing/FAQ";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Navbar } from "@/components/landing/Navbar";
import { Pricing } from "@/components/landing/Pricing";
import { ProblemReality } from "@/components/landing/ProblemReality";
import { ReferralCTA } from "@/components/landing/ReferralCTA";
import { ScrollProgress } from "@/components/landing/ScrollProgress";
import { SocialProof } from "@/components/landing/SocialProof";
import { VoiceFeature } from "@/components/landing/VoiceFeature";

export default function Home() {
  return (
    <div className="overflow-x-clip bg-[#020A2A] text-white">
      <ScrollProgress />
      <Navbar />
      <main>
        <Hero />
        <SocialProof />
        <ProblemReality />
        <HowItWorks />
        <VoiceFeature />
        <FeatureGrid />
        <ConditionsSection />
        <Pricing />
        <ReferralCTA />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}

