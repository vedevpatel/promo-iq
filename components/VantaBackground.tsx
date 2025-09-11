// components/VantaBackground.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import FOG from 'vanta/dist/vanta.fog.min';
import * as THREE from 'three';
import { motion, useScroll, useTransform } from 'framer-motion'; // Import motion hooks

export const VantaBackground = () => {
  const [vantaEffect, setVantaEffect] = useState<any>(null);
  const vantaRef = useRef(null);

  const { scrollYProgress } = useScroll(); // Track scroll progress of the whole page
  
  // Create an opacity value that goes from 1 to 0 as we scroll 20% down the page
  const opacity = useTransform(scrollYProgress, [0, 0.9], [1, 0]);

  useEffect(() => {
    if (!vantaEffect) {
      setVantaEffect(
        FOG({
          el: vantaRef.current,
          THREE: THREE,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.0,
          minWidth: 200.0,
          highlightColor: 0xad5fff,
          midtoneColor: 0xff38a5,
          lowlightColor: 0x2d256e,
          baseColor: 0x111827,
          blurFactor: 0.6,
          speed: 1.2,
          zoom: 0.6,
        })
      );
    }
    return () => {
      if (vantaEffect) vantaEffect.destroy();
    };
  }, [vantaEffect]);

  // Wrap the div in motion.div and apply the opacity.
  // We also make it 'sticky' so it stays in place while fading.
  return (
    <motion.div
      ref={vantaRef}
      // Change from 'sticky' to 'fixed' and add 'left-0' and 'z-0'
      className="fixed top-0 left-0 h-screen w-full z-0"
      style={{ opacity }} // The scroll-to-fade still works perfectly
    />
  );
};