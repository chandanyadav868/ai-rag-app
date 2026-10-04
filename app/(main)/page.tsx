"use client";

import React from 'react';
import HeroSection from '@/components/HeroSection';
import ProductPillarsSection from '@/components/ProductPillarsSection';
import SuperpowersSection from '@/components/SuperpowersSection';
import HowItWorksSection from '@/components/HowItWorksSection';
import Testomonial from '@/components/Testomonial';
import FaqSection from '@/components/FaqSection';
import Footer from '@/components/Footer';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#040812] text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 1. Hero Section with Live Interactive Product Playground */}
      <div className="pt-24 sm:pt-28">
        <HeroSection />
      </div>

      {/* 2. Complete Creative Suite: 4 Core Product Pillars */}
      <ProductPillarsSection />

      {/* 3. Technical Architecture: Privacy, WebGPU & Memory Safety */}
      <SuperpowersSection />

      {/* 4. 3-Step Creation Workflow */}
      <HowItWorksSection />

      {/* 5. Creator Reviews & Social Proof */}
      <Testomonial />

      {/* 6. Frequently Asked Questions */}
      <FaqSection />

      {/* 7. Comprehensive Footer */}
      <Footer />
    </main>
  );
}