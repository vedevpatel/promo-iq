// /components/core/text-reveal.tsx
'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface TextRevealProps {
  children: string;
  className?: string;
  from?: 'top' | 'bottom' | 'left' | 'right';
  split?: 'word' | 'letter';
  blur?: number;
  delay?: number;
  duration?: number;
}

export const TextReveal: React.FC<TextRevealProps> = ({
  children,
  className = '',
  from = 'bottom',
  split = 'word',
  blur = 3,
  delay = 0.5,
  duration = 1.5,
}) => {
  // Split text into letters or words
  const textArray = split === 'letter' ? children.split('') : children.split(' ');

  // Motion variants
  const variants = {
    hidden: {
      opacity: 0,
      y: from === 'top' ? -20 : from === 'bottom' ? 20 : 0,
      x: from === 'left' ? -20 : from === 'right' ? 20 : 0,
      filter: `blur(${blur}px)`,
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      filter: 'blur(0px)',
      transition: {
        duration: duration,
      },
    },
  };

  return (
    <span className={`inline-block ${className}`}>
      {textArray.map((item, idx) => (
        <motion.span
          key={idx}
          className={split === 'word' ? 'inline-block mr-1' : ''}
          variants={variants}
          initial="hidden"
          animate="visible"
          transition={{ delay: delay + idx * 0.05 }}
        >
          {item}
          {split === 'letter' ? '' : ' '}
        </motion.span>
      ))}
    </span>
  );
};
