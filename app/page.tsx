'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { GeneratorForm } from "@/components/GeneratorForm";
import { VantaBackground } from "@/components/VantaBackground";
import { AuroraBackground } from '@/components/AuroraBackground';

export default function HomePage() {
  const mainRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: mainRef,
    offset: ["start start", "end start"]
  });

  const vantaOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const auroraOpacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);

  return (
    <main ref={mainRef}>
      <motion.div style={{ opacity: vantaOpacity }} className="fixed inset-0 -z-10">
        <VantaBackground />
      </motion.div>
      <motion.div style={{ opacity: auroraOpacity }} className="fixed inset-0 -z-10">
        <AuroraBackground />
      </motion.div>

      <div className="relative z-10">
        <section className="container mx-auto min-h-screen flex items-center px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="text-center md:text-left">
              <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-4">
                From Idea to Impact. Generate Smarter Ads in Seconds.
              </h1>
              <p className="text-lg text-gray-300 mb-8">
                Transform your ad game with comprehensive AI automation through AdSynth at every step.
              </p>
              <a href="#generator-form">
                <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition-transform hover:scale-105">
                  Get Started
                </button>
              </a>
            </div>
            <div className="hidden md:block">
              <div className="bg-black/30 backdrop-blur-sm p-4 rounded-2xl shadow-2xl">
                <p className="text-center text-gray-400 p-20">
                  [Visuals of Generated Ads Will Go Here]
                </p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <GeneratorForm />
        </section>
      </div>
    </main>
  );
}