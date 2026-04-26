'use client';
import Link from "next/link";
import { Facebook, Instagram, Linkedin, Mail, MapPin, Phone, Twitter } from "lucide-react";

const footerLinks = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Features", href: "#features" },
  { label: "Admissions", href: "#admissions" },
  { label: "Contact", href: "#contact" },
];

export default function Footer() {
  return (
    <footer className="border-t border-[#d8e5f5] bg-[linear-gradient(160deg,#1c2450,#2a3566_45%,#241654)] text-slate-200">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#76c2e2] to-[#576fb5] text-white shadow-lg shadow-[#76c2e2]/30">
                A
              </div>
              <div>
                <p className="text-xl font-bold text-white">Adamjee Coaching</p>
                <p className="text-sm text-slate-300">Coaching Management System</p>
              </div>
            </div>
            <p className="max-w-md text-sm leading-6 text-slate-300">
              A modern coaching platform for admissions, attendance, examinations, parent communication, and reporting in one place.
            </p>
            <div className="mt-6 flex gap-4">
              <a href="#" aria-label="Facebook" className="rounded-xl border border-white/15 p-3 text-slate-300 transition-colors hover:border-[#76c2e2]/60 hover:text-[#b5e7ff]">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="#" aria-label="Twitter" className="rounded-xl border border-white/15 p-3 text-slate-300 transition-colors hover:border-[#76c2e2]/60 hover:text-[#b5e7ff]">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="#" aria-label="Instagram" className="rounded-xl border border-white/15 p-3 text-slate-300 transition-colors hover:border-[#76c2e2]/60 hover:text-[#b5e7ff]">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="#" aria-label="LinkedIn" className="rounded-xl border border-white/15 p-3 text-slate-300 transition-colors hover:border-[#76c2e2]/60 hover:text-[#b5e7ff]">
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-300">Quick Links</h3>
            <ul className="mt-5 space-y-3">
              {footerLinks.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-sm text-slate-200 transition-colors hover:text-[#b5e7ff]">
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/login" className="text-sm text-slate-200 transition-colors hover:text-[#b5e7ff]">
                  Login
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-300">Contact</h3>
            <div className="mt-5 space-y-4 text-sm text-slate-200">
              <p className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 text-[#8ed4f2]" />
                <span>+92 335 2778488 || 02137520456</span>
              </p>
              <p className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 text-[#8ed4f2]" />
                <span>globiumclouds@gmail.com</span>
              </p>
              <p className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-[#8ed4f2]" />
                <span>House R-84, near Al.Habeeb Restaurant, Sector 15-A/4, Buffer Zone, Karachi, Pakistan</span>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-8 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-500">© 2026 Adamjee Coaching System. All rights reserved.</p>
          <div className="flex flex-wrap gap-5 text-sm text-slate-500">
            <Link href="#about" className="transition-colors hover:text-white">
              About
            </Link>
            <Link href="#features" className="transition-colors hover:text-white">
              Features
            </Link>
            <Link href="#contact" className="transition-colors hover:text-white">
              Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
