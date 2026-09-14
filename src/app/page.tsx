import { AmbientHero } from "@/components/hero/ambient-hero";
import { StackingShowcase } from "@/components/showcase/stacking-showcase";
import { GlassRadioPricing } from "@/components/pricing/glass-radio-pricing";
import { FaqList } from "@/components/faq-list";
import { CapabilityStrip } from "@/components/capability-strip";
import { ClosingCta } from "@/components/closing-cta";
import { ParallaxSection } from "@/components/layout/parallax-section";

export default function HomePage() {
  return (
    <>
      <AmbientHero />
      <CapabilityStrip />
      <StackingShowcase />
      <ParallaxSection>
        <GlassRadioPricing />
      </ParallaxSection>
      <FaqList />
      <ClosingCta />
    </>
  );
}
