import HeroSection from '@/components/landing/HeroSection'
import ClaimUnderpaymentEstimator from '@/components/landing/ClaimUnderpaymentEstimator'
import SocialProofSection from '@/components/landing/SocialProofSection'
import ToolsSection from '@/components/landing/ToolsSection'
import FreePolicyAnalysis from '@/components/landing/FreePolicyAnalysis'
import DashboardVisualSection from '@/components/landing/DashboardVisualSection'
import EstimateReviewVisual from '@/components/landing/EstimateReviewVisual'
import StepByStepProcess from '@/components/landing/StepByStepProcess'
import FourRequirements from '@/components/landing/FourRequirements'
import StructureVsChaos from '@/components/landing/StructureVsChaos'
import TypicalClaimGap from '@/components/landing/TypicalClaimGap'
import FinalCTAProof from '@/components/landing/FinalCTAProof'

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <ClaimUnderpaymentEstimator />
      <SocialProofSection />
      <ToolsSection />
      <FreePolicyAnalysis />
      <DashboardVisualSection />
      <EstimateReviewVisual />
      <StepByStepProcess />
      <FourRequirements />
      <StructureVsChaos />
      <TypicalClaimGap />
      <FinalCTAProof />
    </main>
  )
}
