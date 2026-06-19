import { HowItWorksSection } from "@/components/how-it-works/HowItWorksSection";
import { HeroSection } from "@/components/hero/HeroSection";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { FaqSection } from "@/components/sections/FaqSection";
import { FeaturesOverviewSection } from "@/components/sections/FeaturesOverviewSection";
import { PricingSection } from "@/components/sections/PricingSection";
import { ProductShowcaseSection } from "@/components/sections/ProductShowcaseSection";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <HeroSection />
        <HowItWorksSection />
        <FeaturesOverviewSection />
        <ProductShowcaseSection />
        <PricingSection />
        <TestimonialsSection />
        <FaqSection />
      </main>
      <SiteFooter />
    </>
  );
}
