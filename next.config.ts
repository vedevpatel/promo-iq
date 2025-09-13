/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Your new 10mb limit
    },
  },
};

export default nextConfig;