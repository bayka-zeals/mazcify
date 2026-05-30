import LandingNav from '@/components/landing/LandingNav'
import Hero from '@/components/landing/Hero'
import HowItWorks from '@/components/landing/HowItWorks'
import Features from '@/components/landing/Features'
import LandingCTA from '@/components/landing/LandingCTA'
import Footer from '@/components/landing/Footer'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-bg text-text">
      <LandingNav />
      <Hero />
      <HowItWorks />
      <Features />
      <LandingCTA />
      <Footer />
    </main>
  )
}
