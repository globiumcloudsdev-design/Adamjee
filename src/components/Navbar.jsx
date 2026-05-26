"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowRight, Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const mainNavLinks = [
  { href: "/#home", label: "Home" },
  { href: "/#about", label: "About Us" },
  { href: "/#features", label: "Features" },
  { href: "/#admissions", label: "Admissions" },
  { href: "/#contact", label: "Contact" },
];

const campusLinks = [
  { href: "/#position-holders", label: "Achievers" },
  { href: "/#gallery", label: "Gallery" },
];

const policyLinks = [
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/delete-account-policy", label: "Account Delete Policy" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileCampusOpen, setMobileCampusOpen] = useState(false);
  const [mobilePoliciesOpen, setMobilePoliciesOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b backdrop-blur-xl transition-all duration-300 ${
        isScrolled
          ? "border-[#4f6297]/50 bg-[#1c2450]/92 shadow-lg shadow-[#1c2450]/30"
          : "border-white/80 bg-white/85"
      }`}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/#home" className="flex items-center gap-3">
          <div className="relative h-12 w-12 overflow-hidden rounded-2xl shadow-lg shadow-slate-900/20">
            <Image
              src="/logo.png"
              alt="Adamjee Coaching logo"
              fill
              className="object-contain p-1 bg-white"
              sizes="48px"
              priority
            />
          </div>
          <div>
            <p className={`text-lg font-bold tracking-tight transition-colors ${isScrolled ? "text-white" : "text-slate-900"}`}>
              Adamjee Coaching
            </p>
            <p
              className={`text-xs font-medium uppercase tracking-[0.24em] transition-colors ${
                isScrolled ? "text-sky-100/80" : "text-[#5a6b92]"
              }`}
            >
              Coaching Center
            </p>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-6 lg:flex">
          {mainNavLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`text-sm font-medium transition-colors ${
                isScrolled ? "text-slate-100 hover:text-white" : "text-[#5a6b92] hover:text-[#344f94]"
              }`}
            >
              {item.label}
            </Link>
          ))}

          {/* Campus Life Dropdown */}
          <div className="relative group py-2">
            <button
              className={`flex items-center gap-1 text-sm font-medium transition-colors cursor-pointer ${
                isScrolled ? "text-slate-100 hover:text-white" : "text-[#5a6b92] hover:text-[#344f94]"
              }`}
            >
              Campus Life
              <ChevronDown className="h-4 w-4 transition-transform duration-200 group-hover:rotate-180" />
            </button>
            <div
              className={`absolute left-0 mt-2 w-48 rounded-2xl border p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-xl z-50 ${
                isScrolled
                  ? "border-[#4f6297]/50 bg-[#1c2450] text-slate-100"
                  : "border-slate-200/50 bg-white text-slate-700"
              }`}
            >
              {campusLinks.map((subItem) => (
                <Link
                  key={subItem.label}
                  href={subItem.href}
                  className={`block rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                    isScrolled
                      ? "text-slate-200 hover:bg-white/10 hover:text-white"
                      : "text-slate-700 hover:bg-[#f5f9ff] hover:text-[#344f94]"
                  }`}
                >
                  {subItem.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Policies Dropdown */}
          <div className="relative group py-2">
            <button
              className={`flex items-center gap-1 text-sm font-medium transition-colors cursor-pointer ${
                isScrolled ? "text-slate-100 hover:text-white" : "text-[#5a6b92] hover:text-[#344f94]"
              }`}
            >
              Policies
              <ChevronDown className="h-4 w-4 transition-transform duration-200 group-hover:rotate-180" />
            </button>
            <div
              className={`absolute left-0 mt-2 w-56 rounded-2xl border p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-xl z-50 ${
                isScrolled
                  ? "border-[#4f6297]/50 bg-[#1c2450] text-slate-100"
                  : "border-slate-200/50 bg-white text-slate-700"
              }`}
            >
              {policyLinks.map((subItem) => (
                <Link
                  key={subItem.label}
                  href={subItem.href}
                  className={`block rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                    isScrolled
                      ? "text-slate-200 hover:bg-white/10 hover:text-white"
                      : "text-slate-700 hover:bg-[#f5f9ff] hover:text-[#344f94]"
                  }`}
                >
                  {subItem.label}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/login">
            <Button className="bg-gradient-to-r from-[#76c2e2] via-[#576fb5] to-[#241654] px-6 text-white shadow-lg hover:brightness-110 transition-all duration-300">
              Login
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((c) => !c)}
          className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border transition-colors lg:hidden ${
            isScrolled ? "border-white/35 text-white hover:bg-white/10" : "border-[#c8d8ef] text-[#445581] hover:bg-[#f5f9ff]"
          }`}
          aria-label="Toggle navigation"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`border-t px-4 pb-5 pt-4 backdrop-blur-xl transition-all duration-300 lg:hidden ${
          isScrolled ? "border-[#4f6297]/60 bg-[#1c2450]/96" : "border-[#d4e1f4] bg-white/95"
        } ${isOpen ? "max-h-screen opacity-100" : "max-h-0 overflow-hidden opacity-0"}`}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-2">
          {mainNavLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                isScrolled ? "text-slate-100 hover:bg-white/10" : "text-[#445581] hover:bg-[#f5f9ff]"
              }`}
              onClick={() => setIsOpen(false)}
            >
              {item.label}
            </Link>
          ))}

          {/* Campus Life Collapsible */}
          <div className="flex flex-col">
            <button
              onClick={() => setMobileCampusOpen(!mobileCampusOpen)}
              className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-colors text-left ${
                isScrolled ? "text-slate-100 hover:bg-white/10" : "text-[#445581] hover:bg-[#f5f9ff]"
              }`}
            >
              <span>Campus Life</span>
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${mobileCampusOpen ? "rotate-180" : ""}`} />
            </button>
            <div className={`pl-4 overflow-hidden transition-all duration-300 ${mobileCampusOpen ? "max-h-40 opacity-100 py-1" : "max-h-0 opacity-0"}`}>
              {campusLinks.map((subItem) => (
                <Link
                  key={subItem.label}
                  href={subItem.href}
                  className={`block rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                    isScrolled ? "text-slate-200 hover:bg-white/10" : "text-[#445581] hover:bg-[#f5f9ff]"
                  }`}
                  onClick={() => {
                    setIsOpen(false);
                    setMobileCampusOpen(false);
                  }}
                >
                  {subItem.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Policies Collapsible */}
          <div className="flex flex-col">
            <button
              onClick={() => setMobilePoliciesOpen(!mobilePoliciesOpen)}
              className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-colors text-left ${
                isScrolled ? "text-slate-100 hover:bg-white/10" : "text-[#445581] hover:bg-[#f5f9ff]"
              }`}
            >
              <span>Policies</span>
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${mobilePoliciesOpen ? "rotate-180" : ""}`} />
            </button>
            <div className={`pl-4 overflow-hidden transition-all duration-300 ${mobilePoliciesOpen ? "max-h-40 opacity-100 py-1" : "max-h-0 opacity-0"}`}>
              {policyLinks.map((subItem) => (
                <Link
                  key={subItem.label}
                  href={subItem.href}
                  className={`block rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                    isScrolled ? "text-slate-200 hover:bg-white/10" : "text-[#445581] hover:bg-[#f5f9ff]"
                  }`}
                  onClick={() => {
                    setIsOpen(false);
                    setMobilePoliciesOpen(false);
                  }}
                >
                  {subItem.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-3">
            <Link href="/login" className="w-full" onClick={() => setIsOpen(false)}>
              <Button className="w-full bg-gradient-to-r from-[#76c2e2] via-[#576fb5] to-[#241654] text-white">
                Login <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}