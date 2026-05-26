'use client';

import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram, Linkedin, Mail, MapPin, Phone, Twitter, ArrowUpRight } from "lucide-react";

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/#about" },
  { label: "Features", href: "/#features" },
  { label: "Admissions", href: "/#admissions" },
  { label: "Contact Us", href: "/#contact" },
];

const supportLinks = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Account Delete Policy", href: "/delete-account-policy" },
  { label: "Student Login", href: "/login" },
  { label: "Staff Login", href: "/login" },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-gradient-to-b from-[#0a0f24] via-[#0c1231] to-[#050714] text-slate-300 border-t border-slate-800/40">
      {/* Decorative Glowing Orbs */}
      <div className="absolute -left-36 -top-36 h-72 w-72 rounded-full bg-blue-600/10 blur-[80px]" />
      <div className="absolute -right-36 bottom-0 h-96 w-96 rounded-full bg-indigo-600/10 blur-[100px]" />
      
      {/* Top Accent Gradient Border */}
      <div className="h-[3px] w-full bg-gradient-to-r from-[#76c2e2] via-[#576fb5] to-[#241654]" />

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 relative z-10">
        <div className="grid gap-12 lg:grid-cols-12">
          
          {/* Column 1: Brand details (Col span 4) */}
          <div className="lg:col-span-4 flex flex-col space-y-6">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative h-14 w-14 overflow-hidden rounded-2xl bg-white p-1.5 shadow-xl transition-transform group-hover:scale-105 duration-300">
                <Image
                  src="/logo.png"
                  alt="Adamjee Coaching logo"
                  width={56}
                  height={56}
                  className="object-contain"
                />
              </div>
              <div>
                <span className="text-xl font-bold text-white tracking-tight block">
                  Adamjee Coaching
                </span>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#76c2e2]">
                  Campus 12 — Karachi
                </span>
              </div>
            </Link>
            
            <p className="text-sm leading-relaxed text-slate-400">
              Empowering future leaders through academic excellence, cutting-edge technology, and modern coaching methodologies.
            </p>

            <div className="flex gap-3">
              {[
                { icon: Facebook, href: "https://facebook.com", color: "hover:border-blue-500 hover:text-blue-400 hover:shadow-blue-500/20" },
                { icon: Twitter, href: "https://twitter.com", color: "hover:border-sky-400 hover:text-sky-300 hover:shadow-sky-400/20" },
                { icon: Instagram, href: "https://instagram.com", color: "hover:border-pink-500 hover:text-pink-400 hover:shadow-pink-500/20" },
                { icon: Linkedin, href: "https://linkedin.com", color: "hover:border-blue-600 hover:text-blue-500 hover:shadow-blue-600/20" },
              ].map((social, idx) => (
                <a
                  key={idx}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Social Link"
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-[#0f1737] text-slate-400 transition-all hover:-translate-y-1 hover:shadow-lg ${social.color}`}
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Column 2: Quick Links (Col span 2) */}
          <div className="lg:col-span-2">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-white">
              Navigation
            </h3>
            <ul className="mt-6 space-y-3">
              {quickLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="inline-flex items-center text-sm text-slate-400 transition-colors hover:text-[#76c2e2] group"
                  >
                    <span>{item.label}</span>
                    <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-0.5 translate-x-0.5 group-hover:opacity-100 transition-all duration-200" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Resources (Col span 3) */}
          <div className="lg:col-span-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-white">
              Resources & Policies
            </h3>
            <ul className="mt-6 space-y-3">
              {supportLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="inline-flex items-center text-sm text-slate-400 transition-colors hover:text-[#76c2e2] group"
                  >
                    <span>{item.label}</span>
                    <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-0.5 translate-x-0.5 group-hover:opacity-100 transition-all duration-200" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact details (Col span 3) */}
          <div className="lg:col-span-3 flex flex-col space-y-6">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-white">
                Contact Desk
              </h3>
              <div className="mt-6 space-y-4 text-sm">
                <a
                  href="tel:+923352778488"
                  className="flex items-start gap-3 text-slate-400 hover:text-[#76c2e2] transition-colors group"
                >
                  <Phone className="h-4 w-4 shrink-0 text-[#76c2e2] mt-0.5 group-hover:scale-110 transition-transform" />
                  <div>
                    <span className="block">+92 335 2778488</span>
                    <span className="text-xs text-slate-500">021-37520456</span>
                  </div>
                </a>

                <a
                  href="mailto:globiumclouds@gmail.com"
                  className="flex items-start gap-3 text-slate-400 hover:text-[#76c2e2] transition-colors group"
                >
                  <Mail className="h-4 w-4 shrink-0 text-[#76c2e2] mt-0.5 group-hover:scale-110 transition-transform" />
                  <span className="break-all">globiumclouds@gmail.com</span>
                </a>

                <div className="flex items-start gap-3 text-slate-400 group">
                  <MapPin className="h-4 w-4 shrink-0 text-[#76c2e2] mt-0.5" />
                  <span className="leading-relaxed">
                    House R-84, near Al-Habeeb Restaurant, Sector 15-A/4, Buffer Zone, Karachi
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom copyright segment */}
        <div className="mt-16 pt-8 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500 text-center sm:text-left">
            &copy; {new Date().getFullYear()} Adamjee Coaching Campus 12. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>Powered by</span>
            <a
              href="https://globiumclouds.com"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-slate-400 hover:text-[#76c2e2] transition-colors"
            >
              Globium Clouds
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
}
