import HeroSection from "@/app/components/about/HeroSection";
import WhatIsSection from "@/app/components/about/WhatIsSection";
import HowItWorksSection from "@/app/components/about/HowItWorksSection";
import BenefitsSection from "@/app/components/about/BenefitsSection";
import DeviceSection from "@/app/components/about/DeviceSection";
import FAQSection from "@/app/components/about/FAQSection";
import FinalCTASection from "@/app/components/about/FinalCTASection";

export default function Page() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <WhatIsSection />
      <HowItWorksSection />
      <BenefitsSection />
      <DeviceSection />
      <FAQSection />
      <FinalCTASection />
    </main>
  );
}