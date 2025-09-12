'use client';

import { useState, useEffect, FormEvent } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { LiquidFillButton } from '@/components/LiquidFillButton';

interface ClaudeResult {
  prompt: string;
  system_prompt: string;
  response: string;
  timestamp: string;
}

export default function MarketingForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [claudeResult, setClaudeResult] = useState<ClaudeResult | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);

  // Engagement messages (sequential, not looping)
  const loadingMessages = [
    'Visiting websites for the latest selling strategies...',
    'Retrieving market insights...',
    'Analyzing competitor positioning...',
    'Designing campaign outline...',
    'Finalizing your marketing plan...'
  ];

  useEffect(() => {
    if (!isLoading) return;
    setLoadingStep(0);

    const interval = setInterval(() => {
      setLoadingStep((prev) => {
        if (prev < loadingMessages.length - 1) {
          return prev + 1;
        }
        clearInterval(interval); // stop once last message is reached
        return prev;
      });
    }, 4000); // advance every 4s

    return () => clearInterval(interval);
  }, [isLoading]);

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
      // 🕵️ 1. Scraper call
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

      // 📄 2. Prompt
      const prompt = `
Create a marketing plan for the product "${title}".
Audience: ${audience}.
Product description: ${description}.
Selling advice: ${JSON.stringify(adviceData)}.

**Instructions:**
- Generate the output in **pure Markdown**, not HTML.
- Include sections: Executive Summary, Target Audience, UVP, Objectives, Strategy, Budget, KPIs, Timeline, Risk Management, Success Factors.
- Use Markdown headings, bullet points, tables, and separators (---).
- Emphasize key points with **bold** or *italic*.
`;

      const systemPrompt = 'You are a marketing expert and creative AI assistant.';

      // 🔌 3. Claude SSE streaming
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/claude`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, system_prompt: systemPrompt }),
      });

      if (!response.ok || !response.body) throw new Error('Failed to connect to Claude SSE');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      setClaudeResult({
        prompt,
        system_prompt: systemPrompt,
        response: '',
        timestamp: new Date().toISOString(),
      });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });

        chunk.split('\n\n').forEach((line) => {
          if (!line.startsWith('data:')) return;
          const data = line.replace(/^data:\s*/, '');
          if (!data) return;

          try {
            const parsed = JSON.parse(data);

            if (parsed.type === 'chunk') {
              accumulated += parsed.content;
              setClaudeResult((prev) =>
                prev ? { ...prev, response: accumulated } : null
              );
            }

            if (parsed.type === 'complete') {
              setClaudeResult((prev) =>
                prev ? { ...prev, timestamp: parsed.timestamp } : null
              );
              setIsLoading(false);
            }
          } catch (err) {
            console.error('SSE parse error:', err, data);
          }
        });
      }
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  // Animations
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      id="generator-form"
      className="max-w-4xl mx-auto p-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.h1
        className="text-3xl font-bold mb-6 text-center text-gray-100"
        variants={itemVariants}
      >
        AI Marketing Strategy Generator
      </motion.h1>

      <motion.form
        onSubmit={handleSubmit}
        className="space-y-6 bg-gray-900 p-6 rounded-2xl shadow-xl border border-gray-800"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants}>
          <label className="block text-gray-300 font-medium mb-2">
            Product Title *
          </label>
          <input
            type="text"
            name="product_title"
            className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Eco-Friendly Sneakers"
            required
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <label className="block text-gray-300 font-medium mb-2">
            Product Description *
          </label>
          <textarea
            name="product_description"
            className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:ring-2 focus:ring-blue-500"
            placeholder="Describe your product..."
            rows={3}
            required
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <label className="block text-gray-300 font-medium mb-2">
            Target Audience *
          </label>
          <input
            type="text"
            name="target_audience"
            className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Young professionals, fitness enthusiasts"
            required
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <LiquidFillButton type="submit" disabled={isLoading}>
            {isLoading ? 'Generating...' : 'Generate Plan'}
          </LiquidFillButton>
        </motion.div>

        {isLoading && (
          <motion.div
            variants={itemVariants}
            className="mt-6 text-center text-gray-400 text-sm animate-pulse"
          >
            {loadingMessages[loadingStep]}
          </motion.div>
        )}
      </motion.form>

      {error && (
        <motion.div
          className="mt-6 p-4 bg-red-900/50 border border-red-700 text-red-200 rounded-lg"
          variants={itemVariants}
        >
          {error}
        </motion.div>
      )}

      {claudeResult && (
        <motion.div
          className="mt-10 p-6 bg-gray-900 rounded-2xl shadow-xl border border-gray-800"
          variants={itemVariants}
        >
          <h2 className="text-xl font-semibold mb-4 text-gray-100">
            Generated Marketing Plan
          </h2>

          <div className="prose prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {claudeResult.response || '*Waiting for content...*'}
            </ReactMarkdown>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
