'use client';

import { useState, useEffect, useRef } from 'react';
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
  imageBase64: string;
  imageMediaType: string;
}

export default function ResultsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claudeResult, setClaudeResult] = useState<ClaudeResult | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const [generatedAds, setGeneratedAds] = useState<string[]>([]);
  const router = useRouter();
  const isMounted = useRef(true);
  const [imagePromptResult, setImagePromptResult] = useState<string>(''); // for image prompt only


  // Engagement messages (sequential, not looping)
  const loadingMessages = [
    'Visiting websites for the latest selling strategies...',
    'Retrieving market insights...',
    'Analyzing competitor positioning...',
    'Designing campaign outline...',
    'Finalizing your marketing plan...'
  ];

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

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

async function getClaudeResponse(
  prompt: string,
  systemPrompt: string,
  imageBase64?: string,
  imageMediaType?: string,
  onChunk?: (chunk: string) => void // optional callback for streaming
): Promise<string> {
  const body: any = { prompt, system_prompt: systemPrompt };
  if (imageBase64 && imageMediaType) {
    body.image_base64 = imageBase64;
    body.image_media_type = imageMediaType;
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/claude`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok || !response.body) throw new Error(`Failed to connect to Claude: ${response.statusText}`);

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let accumulated = '';

  return new Promise((resolve, reject) => {
    const read = async () => {
      try {
        const { done, value } = await reader.read();
        if (done) {
          resolve(accumulated);
          return;
        }

        const chunk = decoder.decode(value, { stream: true });

        chunk.split('\n\n').forEach((line) => {
          if (!line.startsWith('data:')) return;
          const data = line.replace(/^data:\s*/, '');
          if (!data) return;

          try {
            const parsed = JSON.parse(data);

            if (parsed.type === 'chunk') {
              accumulated += parsed.content;
              if (isMounted.current && onChunk) {
                onChunk(parsed.content); // only updates UI if callback provided
              }
            }

            if (parsed.type === 'complete') {
              resolve(accumulated);
            }
          } catch (err) {
            console.error('SSE parse error:', err);
          }
        });

        read();
      } catch (err) {
        reject(err);
      }
    };
    read();
  });
}


  useEffect(() => {
    const fetchMarketingPlan = async () => {
      try {
        const storedFormData = localStorage.getItem('formData');
        if (!storedFormData) {
          setError('No form data found. Please submit the form again.');
          setIsLoading(false);
          return;
        }

        const { title, description, audience, imageBase64, imageMediaType }: FormData = JSON.parse(storedFormData);
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
        if (!adviceResponse.ok) throw new Error(`Failed to get selling advice: ${adviceResponse.statusText}`);
        const adviceData = await adviceResponse.json();

        // 2. Prompt for marketing plan
        const planPrompt = `
Create a marketing plan for the product "${title}".
Audience: ${audience}.
Product description: ${description}.
Selling advice: ${JSON.stringify(adviceData)}.
The product image is attached. Use it to inform the marketing plan.

**Instructions:**
- Generate the output in **pure Markdown**, not HTML.
- Include sections: Executive Summary, Target Audience, UVP, Objectives, Strategy, Budget, KPIs, Timeline, Risk Management, Success Factors.
- Use Markdown headings, bullet points, tables, and separators (---).
- Emphasize key points with **bold** or *italic*.
`;

        const systemPrompt = 'You are a marketing expert and creative AI assistant.';

        // 3. Start Claude SSE streaming for plan
        getClaudeResponse(
        planPrompt,
        systemPrompt,
        imageBase64,
        imageMediaType,
        (chunk) => {
            if (!isMounted.current) return;
            setClaudeResult((prev) =>
            prev
                ? { ...prev, response: (prev.response || '') + chunk }
                : {
                    prompt: planPrompt,
                    system_prompt: systemPrompt,
                    response: chunk,
                    timestamp: new Date().toISOString(),
                }
            );
        }
        ).then(() => {
        if (isMounted.current) setIsLoading(false);
        }).catch((err) => {
        if (isMounted.current) {
            setError('Failed to generate marketing plan. Please try again.');
            setIsLoading(false);
        }
        });


        // Parallel: Generate image prompt and ads (in background)
        const generateImages = async () => {
          try {
            const imagePromptPrompt = `
Generate a very detailed prompt for an ad image for the product "${title}".
Audience: ${audience}.
Product description: ${description}.
Selling advice: ${JSON.stringify(adviceData)}.
Attached is the product image. Analyze its colors, composition, and key elements to create a highly detailed prompt optimized for Google Imagen 4.
The ad should be modern and clean, with vibrant visuals, clear product focus, and appeal to the target audience.
Include specific details like background, lighting, mood, and any text overlays.
Return only the prompt text.
`;

            const systemPromptForImage = 'You are an expert in creating detailed image prompts for AI image generators.';

            const detailedPrompt = await getClaudeResponse(imagePromptPrompt, systemPromptForImage, imageBase64, imageMediaType);
            
            setImagePromptResult(detailedPrompt); // store for debugging if needed

            const adsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/generate-product-ads`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                product_description: description,
                product_image: imageBase64,
                target_audience: audience,
                ad_style: detailedPrompt,
                num_prompts: 4,
              }),
            });

            if (!adsResponse.ok) {
              const errorData = await adsResponse.json();
              throw new Error(`Failed to generate ads: ${errorData.detail?.[0]?.msg || adsResponse.statusText}`);
            }

            const adsData = await adsResponse.json();
            console.log('Image API response:', adsData);
            if (isMounted.current) {
              setGeneratedAds(adsData.generated_ads || []);
            }
          } catch (imageErr: any) {
            console.error('Image generation error:', imageErr.message);
            if (isMounted.current) {
              setGeneratedAds([]); // Ensure placeholders are shown
            }
          }
        };

        generateImages();
        
      } catch (err: any) {
        if (isMounted.current) {
          setError('Failed to generate marketing plan. Please try again.');
          setIsLoading(false);
        }
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

      {claudeResult && !error && (
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

      {claudeResult && !error && (
        <motion.div
          className="mt-10 p-6 bg-gray-900 rounded-2xl shadow-xl border border-gray-800"
          variants={itemVariants}
        >
          <h2 className="text-xl font-semibold mb-4 text-gray-100">
            Generated Ad Images
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {generatedAds.length > 0 ? (
              generatedAds.map((ad, index) => (
                <img
                  key={index}
                  src={`data:image/png;base64,${ad}`}
                  alt={`Generated Ad ${index + 1}`}
                  className="w-full h-48 object-cover rounded-lg shadow-lg"
                />
              ))
            ) : (
              Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="w-full h-48 bg-gray-700 rounded-lg flex items-center justify-center text-gray-400 text-sm"
                >
                  Image not available
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}