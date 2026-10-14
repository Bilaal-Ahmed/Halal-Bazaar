import React from 'react';
import { ShoppingBag, Github, Mail, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CATEGORIES } from '../types';

export function Footer() {
  const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL?.trim();

  return (
    <footer className="bg-gray-950 text-gray-300">
      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand column */}
          <div className="lg:col-span-1 space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="bg-primary p-1.5 rounded-xl">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-black text-white tracking-tight">
                Halal<span className="text-primary">-Bazaar</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed text-gray-400">
              A marketplace where independent sellers can share product listings and shoppers can discover and order from them.
            </p>
            {/* Social */}
            <div className="flex gap-3 pt-1">
              <a id="footer-github" href="https://github.com/Ahmiii281/Halal-Bazaar" target="_blank" rel="noopener noreferrer" aria-label="Halal-Bazaar GitHub repository" className="w-9 h-9 bg-gray-800 rounded-xl flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white transition-all">
                <Github className="w-4 h-4" />
              </a>
              {supportEmail && <a id="footer-mail" href={`mailto:${supportEmail}`} aria-label="Email support" className="w-9 h-9 bg-gray-800 rounded-xl flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white transition-all">
                <Mail className="w-4 h-4" />
              </a>}
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-white font-bold mb-5 text-sm uppercase tracking-wider">Categories</h4>
            <ul className="space-y-3">
              {CATEGORIES.map(cat => (
                <li key={cat.slug}>
                  <Link
                    to={`/products?category=${cat.slug}`}
                    className="text-sm text-gray-400 hover:text-primary transition-colors flex items-center gap-2"
                  >
                    <span>{cat.icon}</span>
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold mb-5 text-sm uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              {[
                { label: 'Shop All Products', to: '/products' },
                { label: 'Buyer Dashboard', to: '/dashboard' },
                { label: 'Become a Seller', to: '/profile' },
                { label: 'About Us', to: '/about' },
                { label: 'Blog', to: '/blog' },
                { label: 'FAQs', to: '/faq' },
                { label: 'Contact Us', to: '/contact' },
                { label: 'Privacy Policy', to: '/privacy' },
                { label: 'Terms of Service', to: '/terms' },
              ].map(link => (
                <li key={link.label}>
                  <Link to={link.to} className="hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-bold mb-5 text-sm uppercase tracking-wider">Contact</h4>
            <p className="text-sm text-gray-400">
              {supportEmail
                ? <>Email us at <a className="text-primary hover:underline" href={`mailto:${supportEmail}`}>{supportEmail}</a>.</>
                : 'Support contact details have not been configured yet.'}
            </p>
            <Link to="/contact" className="mt-4 inline-flex text-sm font-semibold text-primary hover:underline">Contact options</Link>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Halal-Bazaar. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            Developed with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> by{' '}
            <span className="font-bold text-white">Bilal Ahmed</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
