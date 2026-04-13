import React from 'react';
import { ShoppingBag, Github, Twitter, Mail, MapPin, Phone, Heart, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CATEGORIES } from '../types';

export function Footer() {
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
              Pakistan's trusted halal e-commerce marketplace. Connecting conscious shoppers with verified halal sellers since 2024.
            </p>
            <div className="flex items-center gap-1 text-xs text-primary font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              All products are Halal Certified
            </div>
            {/* Social */}
            <div className="flex gap-3 pt-1">
              <a id="footer-twitter" href="#" className="w-9 h-9 bg-gray-800 rounded-xl flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white transition-all">
                <Twitter className="w-4 h-4" />
              </a>
              <a id="footer-github" href="https://github.com/Ahmiii281" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-gray-800 rounded-xl flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white transition-all">
                <Github className="w-4 h-4" />
              </a>
              <a id="footer-mail" href="mailto:bilalahmed@halalbazaar.com" className="w-9 h-9 bg-gray-800 rounded-xl flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white transition-all">
                <Mail className="w-4 h-4" />
              </a>
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
                { label: 'Become a Seller', to: '/seller' },
                { label: 'About Us', to: '#' },
                { label: 'Blog', to: '#' },
                { label: 'Contact Us', to: '#' },
                { label: 'Privacy Policy', to: '#' },
                { label: 'Terms of Service', to: '#' },
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
            <ul className="space-y-4 text-sm text-gray-400">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>DHA Phase 6, Lahore, Pakistan 54000</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-primary shrink-0" />
                <span>+92-300-1234567</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <span>support@halalbazaar.com</span>
              </li>
            </ul>

            {/* Hours */}
            <div className="mt-6 p-4 bg-gray-900 rounded-xl border border-gray-800">
              <p className="text-xs font-bold text-white mb-2">Support Hours</p>
              <p className="text-xs text-gray-400">Mon – Sat: 9:00 AM – 9:00 PM</p>
              <p className="text-xs text-gray-400">Sunday: 10:00 AM – 6:00 PM</p>
            </div>
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
