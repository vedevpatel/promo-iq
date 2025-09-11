'use client';

import { motion, type Variants } from 'framer-motion'; // Import the 'Variants' type
import type { ReactNode } from 'react';

interface LiquidFillButtonProps {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

export const LiquidFillButton = ({ children, ...props }: LiquidFillButtonProps) => {
  const fillDuration = 0.3;

  // Explicitly type the variants object with the 'Variants' type
  const buttonVariants: Variants = {
    rest: {
      scale: 1,
      boxShadow: '0px 0px 0px rgba(249, 115, 22, 0)', // orange-500 at 0 opacity
    },
    hover: {
      scale: 1.05,
      boxShadow: '0px 0px 25px rgba(249, 115, 22, 0.6)', // The "glow"
      transition: {
        delay: fillDuration,
        type: 'spring',
        stiffness: 300,
        damping: 15,
      },
    },
    disabled: {
      scale: 1,
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  };

  const liquidVariants: Variants = {
    rest: { y: '100%' },
    hover: {
      y: '0%',
      transition: {
        duration: fillDuration,
        ease: 'easeInOut',
      },
    },
  };

  const textVariants: Variants = {
    rest: { color: '#f97316' }, // text-orange-500
    hover: {
      color: '#ffffff', // text-white
      transition: {
        duration: 0.3,
        delay: 0.1,
      },
    },
  };

  return (
    <motion.button
      className="relative w-full overflow-hidden rounded-lg cursor-pointer border-2 border-orange-500 px-3.5 py-2.5 text-sm font-semibold"
      variants={buttonVariants}
      whileHover={props.disabled ? '' : 'hover'}
      whileTap={{ scale: props.disabled ? 1 : 0.98 }}
      initial="rest"
      animate={props.disabled ? 'disabled' : 'rest'}
      {...props}
    >
      {/* The filling liquid effect */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 z-0 h-full bg-gradient-to-t from-orange-600 to-orange-500"
        variants={liquidVariants}
      />
      
      {/* The text content */}
      <motion.span
        className="relative z-10 block text-center font-bold"
        variants={textVariants}
      >
        {children}
      </motion.span>
    </motion.button>
  );
};

