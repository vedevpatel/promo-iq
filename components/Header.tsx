// components/Header.tsx
import Link from 'next/link';

export const Header = () => {
  return (
    <header className="absolute top-0 left-0 right-0 z-30">
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-white">
          AdSynth AI
        </Link>
        <div className="hidden md:flex items-center space-x-8 text-gray-300">
          <Link href="#" className="hover:text-white transition-colors">Features</Link>
          <Link href="#" className="hover:text-white transition-colors">Blog</Link>
          <Link href="#" className="hover:text-white transition-colors">Contact</Link>
        </div>
      </nav>
    </header>
  );
};