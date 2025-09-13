'use client';

import { useState, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { LiquidFillButton } from '@/components/LiquidFillButton';
import { useRouter } from 'next/navigation';

export default function MarketingForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const router = useRouter();

  const getBase64 = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const title = formData.get('product_title')?.toString().trim() || '';
    const description = formData.get('product_description')?.toString().trim() || '';
    const audience = formData.get('target_audience')?.toString().trim() || '';
    const imageFile = formData.get('product_image') as File | null;

    if (!title || !description || !audience || !imageFile) {
      setError('Please fill out all required fields, including the product image.');
      setIsLoading(false);
      return;
    }

    try {
      const base64Result = await getBase64(imageFile);
      const match = base64Result.match(/data:(.*?);base64,(.*)/);
      if (!match) throw new Error('Failed to process image.');
      const [, imageMediaType, imageBase64] = match;

      // Store form data in localStorage to pass to results page
      localStorage.setItem(
        'formData',
        JSON.stringify({ title, description, audience, imageBase64, imageMediaType })
      );

      router.push('/results');
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  // Animations
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.2 } },
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
            placeholder="e.g., Awesome Energy Drink"
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
            placeholder="e.g., A refreshing, zero-sugar energy drink with natural electrolytes..."
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
          <label className="block text-gray-300 font-medium mb-2">
            Upload your product image *
          </label>
          <div className="flex items-center gap-4 mb-2">
            <input
              id="product_image"
              type="file"
              name="product_image"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
              required
            />
            <label
              htmlFor="product_image"
              className="cursor-pointer bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg transition-transform hover:scale-105"
            >
              Choose File
            </label>
            <span className="text-gray-400">
              {selectedImage ? selectedImage.name : 'No file selected'}
            </span>
          </div>
          {imagePreview && (
            <img
              src={imagePreview}
              alt="Selected product preview"
              className="w-32 h-32 object-cover rounded-lg border border-gray-700 mt-2"
            />
          )}
        </motion.div>

        <motion.div variants={itemVariants}>
          <LiquidFillButton type="submit" disabled={isLoading}>
            {isLoading ? 'Generating...' : 'Generate Plan'}
          </LiquidFillButton>
        </motion.div>
      </motion.form>

      {error && (
        <motion.div
          className="mt-6 p-4 bg-red-900/50 border border-red-700 text-red-200 rounded-lg"
          variants={itemVariants}
        >
          {error}
        </motion.div>
      )}
    </motion.div>
  );
}