'use client';

import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Heart, MessageCircle, Send, Bookmark } from 'lucide-react';

export const InteractiveHeroImage = () => {
  const x = useMotionValue(200);
  const y = useMotionValue(250); // half of card height

  const rotateX = useTransform(y, [0, 500], [15, -15]);
  const rotateY = useTransform(x, [0, 400], [-15, 15]);

  return (
    <motion.div
      className="mx-auto w-64 sm:w-72 md:w-80 lg:w-96 xl:w-[400px] rounded-2xl overflow-hidden bg-white shadow-xl flex flex-col"
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        perspective: 1000,
        height: 500, // 4:5 aspect ratio
        maxHeight: '90vh',
      }}
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        x.set(event.clientX - rect.left);
        y.set(event.clientY - rect.top);
      }}
      onMouseLeave={() => {
        x.set(200);
        y.set(250);
      }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-white">
        <div className="flex items-center gap-2">
          {/* Profile avatar */}
          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-black text-xs font-bold">
            NB
          </div>
          {/* Username + Verified */}
          <div className="flex items-center gap-1">
            <span className="font-semibold text-black text-sm">New Balance</span>
            {/* Verified tick */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="w-4 h-4"
            >
              <circle cx="12" cy="12" r="12" fill="#3897f0" />
              <path
                fill="#fff"
                d="M10 14.5l-2.5-2.5 1.4-1.4L10 11.7l4.6-4.6 1.4 1.4L10 14.5z"
              />
            </svg>
          </div>
        </div>
        {/* Sponsored label */}
        <span className="text-xs font-medium text-black/70">Sponsored</span>
      </div>

      {/* Image */}
      <div className="flex-1 overflow-hidden">
        <img
          src="https://substackcdn.com/image/fetch/$s_!ww8o!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fbucketeer-e05bbc84-baa3-437e-9518-adb32be77984.s3.amazonaws.com%2Fpublic%2Fimages%2Fc4edd57c-2ea5-4d0e-9bc4-f1388ccca509_1080x1350.jpeg"
          alt="Sneakers Concept"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Action bar */}
      <div className="flex justify-between items-center px-3 py-2 border-t bg-white z-10">
        <div className="flex gap-4">
          <Heart className="w-5 h-5 text-black" />
          <MessageCircle className="w-5 h-5 text-black" />
          <Send className="w-5 h-5 text-black" />
        </div>
        <Bookmark className="w-5 h-5 text-black" />
      </div>

      {/* Caption */}
      <div className="px-3 pb-3 text-sm bg-white z-10 text-black">
        <span className="font-semibold mr-2">New Balance</span>
        Step into the future. Shop our new sneakers 👟✨
      </div>
    </motion.div>
  );
};
