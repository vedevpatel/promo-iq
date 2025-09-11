'use client';

import { useState, useRef, useEffect } from 'react';
import type { FormEvent } from 'react';
import { motion, useInView, useAnimation } from 'framer-motion';
import { LiquidFillButton } from './LiquidFillButton';
// The interface for the expected API response
interface AdResult {
  product_description: string;
  target_audience: string;
  ad_style: string;
  generated_ads: string[];
  timestamp: string;
}

export const GeneratorForm = () => {
  // State management for the form
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AdResult | null>(null);

  // Animation setup for Framer Motion
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
  };

  // Function to handle form submission
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData(event.currentTarget);
    formData.append('num_prompts', '2');
    
    const apiEndpoint = process.env.NEXT_PUBLIC_API_URL + '/claude';

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail?.[0]?.msg || 'Something went wrong');
      }

      const data: AdResult = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

    return (
    <div id="generator-form" ref={ref} className="py-24 sm:py-32">
      <motion.div 
        className="mx-auto w-full max-w-2xl px-6 lg:px-8"
        variants={containerVariants}
      >
        <motion.div 
          className="bg-black/30 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-white/10"
          variants={itemVariants}
        >
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl text-center">
            Generate Your Ad Campaign
          </h2>
          <p className="mt-2 text-center text-lg leading-8 text-gray-300">
            Provide your product details to get started.
          </p>
          <form onSubmit={handleSubmit} className="space-y-6 mt-10">
            <motion.div variants={itemVariants}>
              <label htmlFor="product_description" className="block text-sm font-medium leading-6 text-gray-300">
                Product Description
              </label>
              <div className="mt-2">
                <textarea name="product_description" id="product_description" rows={4} required className="block w-full rounded-md border-0 bg-white/5 py-2 px-3 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-orange-500"/>
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <label htmlFor="target_audience" className="block text-sm font-medium leading-6 text-gray-300">
                Target Audience
              </label>
              <div className="mt-2">
                <input type="text" name="target_audience" id="target_audience" required placeholder="e.g., Young professionals, fitness enthusiasts" className="block w-full rounded-md border-0 bg-white/5 py-2 px-3 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-orange-500 placeholder:text-gray-500"/>
              </div>
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <label htmlFor="ad_style" className="block text-sm font-medium leading-6 text-gray-300">
                Ad Style
              </label>
              <div className="mt-2">
                <input type="text" name="ad_style" id="ad_style" required placeholder="e.g., Modern and clean, vintage, playful" className="block w-full rounded-md border-0 bg-white/5 py-2 px-3 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-orange-500 placeholder:text-gray-500"/>
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <label htmlFor="product_image" className="block text-sm font-medium leading-6 text-gray-300">
                Product Image
              </label>
              <div className="mt-2">
                <input type="file" name="product_image" id="product_image" required accept="image/*" className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-orange-500/10 file:text-orange-400 hover:file:bg-orange-500/20"/>
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <LiquidFillButton type="submit" disabled={isLoading}>
                {isLoading ? 'Generating...' : 'Generate Campaign'}
              </LiquidFillButton>
            </motion.div>
          </form>

          {/* Results Section */}
          {error && <p className="mt-4 text-center text-red-400">Error: {error}</p>}

          {result && (
            <div className="mt-12">
              <h3 className="text-2xl font-bold text-white text-center">Your Campaign is Ready!</h3>
              <div className="mt-6 border-t border-white/10 pt-6">
                <dl className="space-y-4 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-400">Target Audience:</dt>
                    <dd className="text-white font-medium">{result.target_audience}</dd>
                  </div>
                   <div className="flex justify-between">
                    <dt className="text-gray-400">Ad Style:</dt>
                    <dd className="text-white font-medium">{result.ad_style}</dd>
                  </div>
                </dl>
                
                <h4 className="text-xl font-bold text-white mt-8 mb-4">Generated Ads:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {result.generated_ads.map((adUrl, index) => (
                    <img key={index} src={adUrl} alt={`Generated ad ${index + 1}`} className="rounded-lg shadow-xl" />
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

