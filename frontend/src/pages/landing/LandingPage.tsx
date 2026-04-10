import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/landing/HeroSection";
import HowItWorks from "@/components/landing/HowItWorks";
import ForCandidates from "@/components/landing/ForCandidates";
import ForRecruiters from "@/components/landing/ForRecruiters";
import AccessibilityCommitment from "@/components/landing/AccessibilityCommitment";

const LandingPage = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Navbar />
      <main id="main-content" role="main">
        <HeroSection />
        <HowItWorks />
        <ForCandidates />
        <ForRecruiters />
        <AccessibilityCommitment />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
