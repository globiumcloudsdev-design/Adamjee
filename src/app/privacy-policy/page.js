'use client';
import React, { useState, useEffect } from 'react';
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { 
  Shield, 
  Lock, 
  Eye, 
  FileText, 
  CheckCircle, 
  UserCheck, 
  Database, 
  Mail, 
  ArrowRight, 
  Server,
  Key,
  Globe,
  Settings,
  HelpCircle
} from "lucide-react";

export default function PrivacyPolicy() {
  const [activeSection, setActiveSection] = useState('introduction');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const handleScroll = () => {
      const sections = ['introduction', 'data-collection', 'data-usage', 'security', 'student-records', 'user-rights', 'cookies', 'contact'];
      const scrollPosition = window.scrollY + 200;

      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 100,
        behavior: 'smooth'
      });
      setActiveSection(id);
    }
  };

  const navItems = [
    { id: 'introduction', label: '1. Introduction', icon: Shield },
    { id: 'data-collection', label: '2. Information We Collect', icon: Database },
    { id: 'data-usage', label: '3. How We Use Data', icon: Eye },
    { id: 'security', label: '4. Security and Storage', icon: Lock },
    { id: 'student-records', label: '5. Student Academic Records', icon: UserCheck },
    { id: 'user-rights', label: '6. Your Rights & Choices', icon: Key },
    { id: 'cookies', label: '7. Cookies & Analytics', icon: Settings },
    { id: 'contact', label: '8. Contact Information', icon: Mail },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 selection:bg-[#76c2e2]/30 selection:text-[#1c2450]">
      <Navbar />
      
      {/* ── Sleek Hero Banner ── */}
      <section className="relative overflow-hidden bg-[linear-gradient(160deg,#1c2450,#2a3566_45%,#241654)] py-20 text-white md:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(118,194,226,0.15),transparent_50%)]" />
        <div className="absolute -bottom-48 -left-48 h-96 w-96 rounded-full bg-[#576fb5]/10 blur-3xl" />
        <div className="absolute -right-48 -top-48 h-96 w-96 rounded-full bg-[#76c2e2]/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#b5e7ff]">
              <Shield className="h-3.5 w-3.5" /> Legal & Security
            </span>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Privacy Policy
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-300">
              At Adamjee Coaching Center, we prioritize the protection and confidentiality of the personal and academic data of our students, parents, and faculty members. Learn how we safeguard your information.
            </p>
            <div className="mt-8 text-sm text-slate-400">
              <span>Last Updated: May 18, 2026</span>
              <span className="mx-2">•</span>
              <span>Version 2.1</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Content Layout ── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-4">
          
          {/* ── Left Sidebar Navigation (Desktop Sticky) ── */}
          <aside className="lg:col-span-1">
            <div className="sticky top-28 space-y-2 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <p className="px-3 text-xs font-bold uppercase tracking-wider text-slate-400">Navigation</p>
              <nav className="mt-3 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => scrollToSection(item.id)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-all ${
                        isActive 
                          ? "bg-gradient-to-r from-[#1c2450] to-[#2a3566] text-white shadow-md shadow-[#1c2450]/10" 
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-[#b5e7ff]" : "text-slate-400"}`} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="mt-6 border-t border-slate-100 pt-6">
                <div className="rounded-xl bg-[#76c2e2]/10 p-4 text-xs text-slate-600">
                  <p className="font-bold text-[#1c2450] flex items-center gap-1">
                    <Lock className="h-3 w-3 text-[#76c2e2]" /> ISO 27001 Ready
                  </p>
                  <p className="mt-1 leading-relaxed">
                    Our database structures use AES-256 encryption for sensitive record files.
                  </p>
                </div>
              </div>
            </div>
          </aside>

          {/* ── Right Content Area ── */}
          <main className="space-y-16 lg:col-span-3">
            
            {/* Section 1: Introduction */}
            <article id="introduction" className="scroll-mt-28 rounded-3xl border border-slate-200/60 bg-white p-8 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1c2450]/5 text-[#1c2450]">
                  <Shield className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-bold text-[#1c2450]">1. Introduction</h2>
              </div>
              <div className="mt-6 space-y-4 text-base leading-relaxed text-slate-600">
                <p>
                  Welcome to the <strong>Adamjee Coaching Center Management System</strong>. This platform is designed to streamline academic administrative tasks, parent-teacher collaboration, exam coordination, and student tracking.
                </p>
                <p>
                  This Privacy Policy describes how we collect, store, protect, process, and share personal and academic information across our branch administrative dashboards, parent notification interfaces, student portfolios, and online databases. By accessing our dashboard or services, you consent to the data practices described in this statement.
                </p>
                <div className="rounded-2xl border-l-4 border-[#76c2e2] bg-slate-50 p-4 font-medium text-slate-700">
                  We commit to never selling, sharing, or distributing student, parent, or faculty records to third-party advertisers or external marketing institutions under any circumstances.
                </div>
              </div>
            </article>

            {/* Section 2: Data Collection */}
            <article id="data-collection" className="scroll-mt-28 rounded-3xl border border-slate-200/60 bg-white p-8 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1c2450]/5 text-[#1c2450]">
                  <Database className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-bold text-[#1c2450]">2. Information We Collect</h2>
              </div>
              <div className="mt-6 space-y-6 text-base leading-relaxed text-slate-600">
                <p>
                  We collect information necessary to provide high-quality educational and administrative services. The types of data collected are as follows:
                </p>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
                    <h3 className="font-bold text-[#1c2450] flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1c2450] text-[10px] text-white">A</span>
                      For Students
                    </h3>
                    <ul className="mt-3 space-y-2 text-sm text-slate-600 list-disc pl-5">
                      <li>Full Name, Gender, Date of Birth (DOB)</li>
                      <li>General Register (GR) Number, Roll Number, Section, Class</li>
                      <li>Academic Profile Photo, B-Form or CNIC Numbers</li>
                      <li>Subject selection, enrollment details, and class assignments</li>
                      <li>Biometric / QR Code scans for attendance tracking</li>
                    </ul>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
                    <h3 className="font-bold text-[#1c2450] flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1c2450] text-[10px] text-white">B</span>
                      For Parents & Guardians
                    </h3>
                    <ul className="mt-3 space-y-2 text-sm text-slate-600 list-disc pl-5">
                      <li>Guardian name, Relationship to student</li>
                      <li>Active contact numbers (SMS & Call alerts)</li>
                      <li>Email Address (Welcome letters & Fee invoices)</li>
                      <li>Home Address (Verification records)</li>
                      <li>Fee voucher payment proofs and banking details</li>
                    </ul>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
                  <h3 className="font-bold text-[#1c2450] flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1c2450] text-[10px] text-white">C</span>
                    System-Level Automated Data
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Our servers record standard web logs including IP address, browser footprint, timezone, page navigation latency, and device info. This automated telemetry helps us optimize database lookup times, detect suspicious access, and ensure high system availability.
                  </p>
                </div>
              </div>
            </article>

            {/* Section 3: Data Usage */}
            <article id="data-usage" className="scroll-mt-28 rounded-3xl border border-slate-200/60 bg-white p-8 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1c2450]/5 text-[#1c2450]">
                  <Eye className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-bold text-[#1c2450]">3. How We Use Your Data</h2>
              </div>
              <div className="mt-6 space-y-4 text-base leading-relaxed text-slate-600">
                <p>
                  The information we collect is strictly used for functional educational operations. Specific purposes include:
                </p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="flex gap-3">
                    <CheckCircle className="h-5 w-5 shrink-0 text-[#76c2e2]" />
                    <div>
                      <h4 className="font-bold text-[#1c2450]">Attendance Notification</h4>
                      <p className="text-sm text-slate-500">Sending instant alerts to parents via SMS/app when a student scans in/out using QR codes.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle className="h-5 w-5 shrink-0 text-[#76c2e2]" />
                    <div>
                      <h4 className="font-bold text-[#1c2450]">Academic Progress Report</h4>
                      <p className="text-sm text-slate-500">Compiling marks sheets, ranks, and subject progress analytics for teacher-parent meetings.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle className="h-5 w-5 shrink-0 text-[#76c2e2]" />
                    <div>
                      <h4 className="font-bold text-[#1c2450]">Billing & Voucher Processing</h4>
                      <p className="text-sm text-slate-500">Generating monthly fee estimates, discounts, voucher slips, and tracking outstanding dues.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle className="h-5 w-5 shrink-0 text-[#76c2e2]" />
                    <div>
                      <h4 className="font-bold text-[#1c2450]">Security & Access Log</h4>
                      <p className="text-sm text-slate-500">Validating role clearances (Super Admin vs Branch Admin) to enforce strict database partition walls.</p>
                    </div>
                  </div>
                </div>
              </div>
            </article>

            {/* Section 4: Security and Storage */}
            <article id="security" className="scroll-mt-28 rounded-3xl border border-slate-200/60 bg-white p-8 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1c2450]/5 text-[#1c2450]">
                  <Lock className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-bold text-[#1c2450]">4. Data Security and Storage</h2>
              </div>
              <div className="mt-6 space-y-4 text-base leading-relaxed text-slate-600">
                <p>
                  We deploy best-in-class technological protocols to shield user data from unauthorised intrusion, modification, or exposure.
                </p>
                <div className="mt-6 space-y-4">
                  <div className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
                    <Server className="mt-1 h-5 w-5 text-[#1c2450]" />
                    <div>
                      <h4 className="font-bold text-[#1c2450]">Database Isolation</h4>
                      <p className="mt-1 text-sm text-slate-600">
                        Our cloud platform uses secured virtual private database networks. Student information can only be retrieved using authenticated JWT access tokens through secure HTTPS protocols.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
                    <FileText className="mt-1 h-5 w-5 text-[#1c2450]" />
                    <div>
                      <h4 className="font-bold text-[#1c2450]">Media Asset Protection</h4>
                      <p className="mt-1 text-sm text-slate-600">
                        Student profile avatars and scanned certificates are hosted on highly secure, enterprise Cloudinary structures. Each public ID generated is stored directly in Postgres JSONB format and mapped to strict CORS access policies.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
                    <UserCheck className="mt-1 h-5 w-5 text-[#1c2450]" />
                    <div>
                      <h4 className="font-bold text-[#1c2450]">Role-Based Access Control (RBAC)</h4>
                      <p className="mt-1 text-sm text-slate-600">
                        Only permitted personnel are allowed to write or delete database contents. Sub-admins are completely locked to their respective branch coordinates, ensuring that branch-level data leaks are completely minimized.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </article>

            {/* Section 5: Student Academic Records */}
            <article id="student-records" className="scroll-mt-28 rounded-3xl border border-slate-200/60 bg-white p-8 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1c2450]/5 text-[#1c2450]">
                  <UserCheck className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-bold text-[#1c2450]">5. Student Academic Records</h2>
              </div>
              <div className="mt-6 space-y-4 text-base leading-relaxed text-slate-600">
                <p>
                  As an academic institution, we maintain grades, exam answers, marks, session history, and attendance records.
                </p>
                <h4 className="font-bold text-[#1c2450] mt-4">Data Retention & Archival</h4>
                <p>
                  Student academic record metrics are retained as long as the student is actively enrolled at Adamjee Coaching Center. Upon graduation or withdrawal, academic metrics are archived for up to 3 years to support official transcript and verification requests, after which they are thoroughly purged from active clusters.
                </p>
                <div className="rounded-2xl bg-amber-50 border-l-4 border-amber-500 p-4 text-amber-900 text-sm">
                  <strong>Notice regarding Printed ID Cards:</strong> Student physical ID cards printed with roll numbers, photographs, classes, and QR codes should be handled responsibly. In case of a lost ID card, report to your branch administrator immediately so the matching QR identity values can be refreshed.
                </div>
              </div>
            </article>

            {/* Section 6: User Rights */}
            <article id="user-rights" className="scroll-mt-28 rounded-3xl border border-slate-200/60 bg-white p-8 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1c2450]/5 text-[#1c2450]">
                  <Key className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-bold text-[#1c2450]">6. Your Rights and Choices</h2>
              </div>
              <div className="mt-6 space-y-4 text-base leading-relaxed text-slate-600">
                <p>
                  We support transparent data access. Students and their respective parents/guardians possess the following capabilities regarding their records:
                </p>
                <div className="grid gap-6 md:grid-cols-2 mt-6">
                  <div className="border border-slate-100 rounded-2xl bg-slate-50/50 p-5">
                    <h5 className="font-bold text-[#1c2450]">Review & Access</h5>
                    <p className="text-sm text-slate-500 mt-1">Parents can request complete readouts of stored contact logs, marks histories, and attendance lists via their respective campus branch office.</p>
                  </div>
                  <div className="border border-slate-100 rounded-2xl bg-slate-50/50 p-5">
                    <h5 className="font-bold text-[#1c2450]">Correction & Update</h5>
                    <p className="text-sm text-slate-500 mt-1">In case of name spelling errors, modified email coordinates, or updated telephone numbers, request modifications via the branch admin console to run database updates.</p>
                  </div>
                  <div className="border border-slate-100 rounded-2xl bg-slate-50/50 p-5">
                    <h5 className="font-bold text-[#1c2450]">Deletion Requests</h5>
                    <p className="text-sm text-slate-500 mt-1">Upon full academic separation and settlement of institute obligations, parents can submit standard data erasure applications to purge non-mandatory records.</p>
                  </div>
                  <div className="border border-slate-100 rounded-2xl bg-slate-50/50 p-5">
                    <h5 className="font-bold text-[#1c2450]">Alert Toggles</h5>
                    <p className="text-sm text-slate-500 mt-1">You may choose to opt-out of non-critical system updates or optional text blasts while keeping critical attendance notification channels active.</p>
                  </div>
                </div>
              </div>
            </article>

            {/* Section 7: Cookies */}
            <article id="cookies" className="scroll-mt-28 rounded-3xl border border-slate-200/60 bg-white p-8 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1c2450]/5 text-[#1c2450]">
                  <Settings className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-bold text-[#1c2450]">7. Cookies & Local Storage</h2>
              </div>
              <div className="mt-6 space-y-4 text-base leading-relaxed text-slate-600">
                <p>
                  We utilize lightweight browser cookies and Web LocalStorage elements strictly for functionality. They are used to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-sm text-slate-600">
                  <li>Hold session authentication tokens securely so you do not have to re-enter log keys on every page shift.</li>
                  <li>Keep interface layouts intact (e.g. keeping your preferred theme view or sidebar toggle positions persistent).</li>
                  <li>Perform quick client-side student lookup queries through local search indexes.</li>
                </ul>
                <p className="mt-4">
                  We do not embed third-party tracking pixels, Facebook SDKs, Google Ads retargeting cookies, or visitor conversion trackers on our dashboard structures.
                </p>
              </div>
            </article>

            {/* Section 8: Contact Information */}
            <article id="contact" className="scroll-mt-28 rounded-3xl border border-slate-200/60 bg-white p-8 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1c2450]/5 text-[#1c2450]">
                  <Mail className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-bold text-[#1c2450]">8. Contact & Redressal Info</h2>
              </div>
              <div className="mt-6 space-y-4 text-base leading-relaxed text-slate-600">
                <p>
                  If you have concerns, feedback, or operational inquiries regarding this legal policy or how we store your student profiles, contact us directly at our central headquarters or reach out via email support.
                </p>
                <div className="mt-6 rounded-2xl bg-gradient-to-br from-[#1c2450] to-[#2a3566] p-6 text-white shadow-lg">
                  <h4 className="font-bold text-lg text-white">Adamjee Central Compliance Desk</h4>
                  <div className="mt-4 grid gap-4 md:grid-cols-2 text-sm text-slate-200">
                    <div>
                      <p className="font-semibold text-[#b5e7ff]">Corporate Headquarters</p>
                      <p className="mt-1">House R-84, Buffer Zone, Sector 15-A/4, Karachi, Pakistan</p>
                    </div>
                    <div>
                      <p className="font-semibold text-[#b5e7ff]">Direct Support Lines</p>
                      <p className="mt-1">globiumclouds@gmail.com</p>
                      <p className="mt-0.5">+92 335 2778488 || 021 37520456</p>
                    </div>
                  </div>
                </div>
              </div>
            </article>

            {/* FAQs Accordion */}
            <div className="rounded-3xl border border-slate-200/60 bg-white p-8 shadow-sm">
              <h3 className="text-2xl font-bold text-[#1c2450] flex items-center gap-2">
                <HelpCircle className="h-6 w-6 text-[#76c2e2]" /> Frequently Asked Questions
              </h3>
              <p className="text-slate-500 text-sm mt-1">Get immediate answers to common privacy queries regarding Adamjee coaching apps.</p>
              
              <div className="mt-6 space-y-4">
                <details className="group rounded-2xl bg-slate-50 border border-slate-100 p-4 transition-all [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer items-center justify-between gap-1.5 text-base font-bold text-[#1c2450]">
                    <span>Does anyone outside Adamjee see my child&apos;s marks sheets?</span>
                    <span className="shrink-0 rounded-full bg-white p-1.5 text-slate-400 group-open:rotate-180 transition-transform">
                      <ArrowRight className="h-4 w-4 rotate-90" />
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 pl-1">
                    Absolutely not. Marks sheets and assessments are encrypted and only accessible by: (a) teachers who assess the exams, (b) branch administrators generating report files, and (c) the respective parent/student logs.
                  </p>
                </details>

                <details className="group rounded-2xl bg-slate-50 border border-slate-100 p-4 transition-all [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer items-center justify-between gap-1.5 text-base font-bold text-[#1c2450]">
                    <span>What happens to my data if my child leaves the coaching?</span>
                    <span className="shrink-0 rounded-full bg-white p-1.5 text-slate-400 group-open:rotate-180 transition-transform">
                      <ArrowRight className="h-4 w-4 rotate-90" />
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 pl-1">
                    Once a student is formally deregistered, their active profile metrics are turned offline. We retain physical logs for archival/verification purposes for a maximum of 3 years, after which they are entirely purged from active memory databases.
                  </p>
                </details>

                <details className="group rounded-2xl bg-slate-50 border border-slate-100 p-4 transition-all [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer items-center justify-between gap-1.5 text-base font-bold text-[#1c2450]">
                    <span>Are online payments processed safely?</span>
                    <span className="shrink-0 rounded-full bg-white p-1.5 text-slate-400 group-open:rotate-180 transition-transform">
                      <ArrowRight className="h-4 w-4 rotate-90" />
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 pl-1">
                    Yes. All fee submissions, banking credentials, and digital receipts are fully isolated. We do not store raw card numbers on our server layers. Transaction actions use SSL/TLS level protection directly.
                  </p>
                </details>
              </div>
            </div>

          </main>
        </div>
      </section>

      <Footer />
    </div>
  );
}
