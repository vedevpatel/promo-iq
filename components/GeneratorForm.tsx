'use client';

import { useState, useRef, useEffect } from 'react';
import type { FormEvent } from 'react';
import { motion, useInView, useAnimation } from 'framer-motion';
import { LiquidFillButton } from './LiquidFillButton';
import ReactMarkdown from 'react-markdown';

// Interface for Claude response
interface ClaudeResult {
  prompt: string;
  system_prompt: string;
  response: string;
  timestamp: string;
}

export const GeneratorForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [claudeResult, setClaudeResult] = useState<ClaudeResult | null>(null);

  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) controls.start('visible');
  }, [isInView, controls]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
  };
const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  setIsLoading(true);
  setError(null);
  setClaudeResult(null);

  const formData = new FormData(event.currentTarget);
  const title = formData.get('product_title')?.toString().trim() || '';
  const description = formData.get('product_description')?.toString().trim() || '';
  const audience = formData.get('target_audience')?.toString().trim() || '';

  if (!title || !description || !audience) {
    setError('Please fill out all required fields.');
    setIsLoading(false);
    return;
  }

  try {
    // Step 1: Search selling advice
    const adviceResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/search-selling-advice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product: `${title} - ${description}`,
        target_audience: audience,
        search_limit: 5,
      }),
    });
    if (!adviceResponse.ok) throw new Error('Failed to get selling advice');
    const adviceData = await adviceResponse.json();

    // Step 2: Call Claude to generate a **Markdown marketing plan**
    const prompt = `
Create a marketing plan for the product "${title}". 
Audience: ${audience}. 
Product description: ${description}. 
Selling advice: ${JSON.stringify(adviceData)}.

**Instructions:** 
- Output the plan in Markdown format.
- Use # for main headings, ## for subheadings.
- Use **bold** for emphasis.
- Use - for bullet points.
- Include sections: Executive Summary, Target Audience, Marketing Strategy, Budget, KPIs, Timeline, Risk Management.
- Keep it structured and easy to read.
    `;

    const systemPrompt = 'You are a marketing expert and creative AI assistant.';
    const claudeResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/claude`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, system_prompt: systemPrompt }),
    });

    if (!claudeResponse.ok) throw new Error('Failed to generate marketing plan');

    const claudeData: ClaudeResult = await claudeResponse.json();
    setClaudeResult(claudeData);
  } catch (err: any) {
    setError(err.message);
  } finally {
    setIsLoading(false);
  }
};


  return (
    <div id="generator-form" ref={ref} className="py-24 sm:py-32">
      <motion.div
        className="mx-auto w-full max-w-3xl px-6 lg:px-8"
        variants={containerVariants}
        initial="hidden"
        animate={controls}
      >
        <motion.div
          className="bg-black/30 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-white/10"
          variants={itemVariants}
        >
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl text-center">
            Generate Your Marketing Plan
          </h2>
          <p className="mt-2 text-center text-lg leading-8 text-gray-300">
            Provide your product details to generate a marketing plan.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6 mt-10">
            {/* Product Title */}
            <motion.div variants={itemVariants}>
              <label htmlFor="product_title" className="block text-sm font-medium leading-6 text-gray-300">
                Product Title
              </label>
              <input
                type="text"
                name="product_title"
                id="product_title"
                required
                placeholder="Awesome Energy Drink"
                className="block w-full rounded-md border-0 bg-white/5 py-2 px-3 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-orange-500 placeholder:text-gray-500"
              />
            </motion.div>

            {/* Product Description */}
            <motion.div variants={itemVariants}>
              <label htmlFor="product_description" className="block text-sm font-medium leading-6 text-gray-300">
                Product Description
              </label>
              <textarea
                name="product_description"
                id="product_description"
                rows={4}
                required
                placeholder="Describe your product here..."
                className="block w-full rounded-md border-0 bg-white/5 py-2 px-3 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-orange-500 placeholder:text-gray-500"
              />
            </motion.div>

            {/* Target Audience */}
            <motion.div variants={itemVariants}>
              <label htmlFor="target_audience" className="block text-sm font-medium leading-6 text-gray-300">
                Target Audience
              </label>
              <input
                type="text"
                name="target_audience"
                id="target_audience"
                required
                placeholder="e.g., Young professionals, fitness enthusiasts"
                className="block w-full rounded-md border-0 bg-white/5 py-2 px-3 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-orange-500 placeholder:text-gray-500"
              />
            </motion.div>

            {/* Submit Button */}
            <motion.div variants={itemVariants}>
              <LiquidFillButton type="submit" disabled={isLoading}>
                {isLoading ? 'Generating...' : 'Generate Plan'}
              </LiquidFillButton>
            </motion.div>
          </form>

          {/* Results */}
          {error && <p className="mt-4 text-center text-red-400">{error}</p>}

          {claudeResult && (
            <div className="mt-12">
              <h3 className="text-2xl font-bold text-white text-center">Marketing Plan</h3>
              <div className="mt-6 border-t border-white/10 pt-6 prose prose-invert max-w-none">
                {/* Render Claude response as Markdown */}
                <ReactMarkdown>{claudeResult.response}</ReactMarkdown>

                {/* Placeholder Ad Image */}
                <div className="mt-8 flex justify-center">
                  <img
                    src="https://via.placeholder.com/400x250?text=Ad+Image+Placeholder"
                    alt="Ad placeholder"
                    className="rounded-lg shadow-xl"
                  />
                </div>

                <p className="text-gray-400 mt-2 text-sm">{claudeResult.timestamp}</p>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};
