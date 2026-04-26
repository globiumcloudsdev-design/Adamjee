"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "#home", label: "Home" },
  { href: "#about", label: "About" },
  { href: "#features", label: "Features" },
  { href: "#admissions", label: "Admissions" },
  { href: "#contact", label: "Contact" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b backdrop-blur-xl transition-all duration-300 ${
        isScrolled
          ? "border-[#4f6297]/50 bg-[#1c2450]/88"
          : "border-white/80 bg-white/80"
      }`}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/#home" className="flex items-center gap-3">
          <div className="relative h-12 w-12 overflow-hidden rounded-2xl shadow-lg shadow-slate-900/20">
            <Image
              src={isScrolled ? "/logo-white.jpeg" : "/logo-dark.jpeg"}
              alt="Adamjee Coaching logo"
              fill
              className="object-cover"
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
              Coaching System
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {navItems.map((item) => (
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
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/login">
            <Button
              variant="outline"
              className={`btn-saas px-5 shadow-depth glow-hover hover:shadow-lg hover:brightness-[1.05] ${
                isScrolled
                  ? "border-white/35 bg-white/10 text-white hover:bg-white/20"
                  : "border-[#c8d8ef] bg-white text-[#3c4d74] hover:bg-[#f5f9ff]"
              }`}
            >
              Login
            </Button>
          </Link>
          <Link href="/login">
            <Button className="btn-saas bg-gradient-to-r from-[#76c2e2] via-[#576fb5] to-[#241654] px-5 text-white shadow-lg shadow-[#576fb5]/30 hover:brightness-[1.06] shadow-depth glow-hover hover:shadow-xl">
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border transition-colors lg:hidden ${
            isScrolled
              ? "border-white/35 text-white hover:bg-white/10"
              : "border-[#c8d8ef] text-[#445581] hover:bg-[#f5f9ff]"
          }`}
          aria-label="Toggle navigation"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div
        className={`border-t px-4 pb-5 pt-4 backdrop-blur-xl transition-all duration-300 lg:hidden ${
          isScrolled
            ? "border-[#4f6297]/60 bg-[#1c2450]/96"
            : "border-[#d4e1f4] bg-white/95"
        } ${isOpen ? "max-h-96 opacity-100" : "max-h-0 overflow-hidden opacity-0"}`}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-3">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                isScrolled
                  ? "text-slate-100 hover:bg-white/10"
                  : "text-[#445581] hover:bg-[#f5f9ff]"
              }`}
              onClick={() => setIsOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <Link href="/login" className="flex-1" onClick={() => setIsOpen(false)}>
              <Button
                variant="outline"
                className={`btn-saas w-full shadow-depth glow-hover hover:shadow-lg hover:brightness-[1.05] ${
                  isScrolled
                    ? "border-white/35 bg-white/10 text-white hover:bg-white/20"
                    : "border-[#c8d8ef] bg-white text-[#3c4d74] hover:bg-[#f5f9ff]"
                }`}
              >
                Login
              </Button>
            </Link>
            <Link href="/login" className="flex-1" onClick={() => setIsOpen(false)}>
<Button className="btn-saas w-full bg-gradient-to-r from-[#76c2e2] via-[#576fb5] to-[#241654] text-white shadow-depth glow-hover hover:shadow-xl hover:brightness-[1.05]">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}