'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

// Global variable persists across StrictMode remounts in the same session
let welcomeScreenHasPlayed = false;

export default function WelcomeScreen({ onComplete }) {
  const [shouldRender, setShouldRender] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (welcomeScreenHasPlayed) {
      if (onComplete) onComplete();
      return;
    }

    setShouldRender(true);

    const fadeTimer = setTimeout(() => {
      setVisible(false);
      if (onComplete) onComplete();
    }, 3200);

    const removeTimer = setTimeout(() => {
      welcomeScreenHasPlayed = true;
      setShouldRender(false);
    }, 4000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [onComplete]);

  if (!shouldRender) return null;

  return (
    <div
      className={`welcome-screen-bg ${
        !visible ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Background Orbs */}
      <div className="welcome-orb-1" />
      <div className="welcome-orb-2" />

      {/* Content wrapper */}
      <div className="relative z-10 flex flex-col items-center">
        
        {/* Animated Logo Container */}
        <div className="welcome-logo-container">
          <div className="welcome-logo-glow-ring" />
          <div className="welcome-logo-img-wrapper">
            <Image
              src="/logo.png"
              alt="Adamjee Logo"
              width={100}
              height={100}
              priority
              className="object-contain"
            />
          </div>
        </div>

        {/* Brand Text */}
        <h1 className="welcome-title">Adamjee Coaching</h1>
        <p className="welcome-subtitle">Campus 12 — Karachi</p>

        {/* Animated Progress Bar */}
        <div className="welcome-loader-container">
          <div className="welcome-loader-bar" />
        </div>

      </div>
    </div>
  );
}
