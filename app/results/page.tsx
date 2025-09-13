'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useRouter } from 'next/navigation';
import { LiquidFillButton } from '@/components/LiquidFillButton';

interface ClaudeResult {
  prompt: string;
  system_prompt: string;
  response: string;
  timestamp: string;
}

interface FormData {
  title: string;
  description: string;
  audience: string;
}

export default function ResultsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claudeResult, setClaudeResult] = useState<ClaudeResult | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const router = useRouter();

  // Engagement messages (sequential, not looping)
  const loadingMessages = [
    'Visiting websites for the latest selling strategies...',
    'Retrieving market insights...',
    'Analyzing competitor positioning...',
    'Designing campaign outline...',
    'Finalizing your marketing plan...'
  ];

  useEffect(() => {
    // Handle loading messages animation
    if (!isLoading) return;
    setLoadingStep(0);

    const interval = setInterval(() => {
      setLoadingStep((prev) => {
        if (prev < loadingMessages.length - 1) {
          return prev + 1;
        }
        clearInterval(interval); // Stop once last message is reached
        return prev;
      });
    }, 4000); // Advance every 4s

    return () => clearInterval(interval);
  }, [isLoading]);

  useEffect(() => {
    // Retrieve form data and process API calls
    const fetchMarketingPlan = async () => {
      try {
        const storedFormData = localStorage.getItem('formData');
        if (!storedFormData) {
          setError('No form data found. Please submit the form again.');
          setIsLoading(false);
          return;
        }

        const { title, description, audience }: FormData = JSON.parse(storedFormData);
        // Delay cleanup to ensure data is used
        setTimeout(() => localStorage.removeItem('formData'), 1000);

        // 1. Scraper call
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

        // 2. Prompt
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

        // 3. Claude SSE streaming
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

    fetchMarketingPlan();
  }, []);

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
      className="max-w-4xl mx-auto p-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.h1
        className="text-3xl font-bold mb-6 text-center text-gray-100"
        variants={itemVariants}
      >
        Your Marketing Plan
      </motion.h1>

      <motion.div variants={itemVariants}>
        <LiquidFillButton onClick={() => router.push('/')}>
          Back to Form
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

      {error && (
        <motion.div
          className="mt-6 p-4 bg-red-900/50 border border-red-700 text-red-200 rounded-lg"
          variants={itemVariants}
        >
          {error}
        </motion.div>
      )}

      {claudeResult && !isLoading && (
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