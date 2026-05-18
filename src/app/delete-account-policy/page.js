'use client';
import React, { useState, useEffect } from 'react';
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { 
  UserX, 
  ShieldAlert, 
  Trash2, 
  Mail, 
  ArrowRight, 
  AlertTriangle,
  History,
  FileText,
  CheckCircle,
  HelpCircle,
  Clock,
  Database
} from "lucide-react";

export default function DeleteAccountPolicy() {
  const [activeSection, setActiveSection] = useState('overview');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const handleScroll = () => {
      const sections = ['overview', 'eligibility', 'process', 'retention', 'effects', 'recovery', 'faqs'];
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
    { id: 'overview', label: '1. Policy Overview', icon: UserX },
    { id: 'eligibility', label: '2. Eligibility Criteria', icon: ShieldAlert },
    { id: 'process', label: '3. Deletion Process', icon: Trash2 },
    { id: 'retention', label: '4. Data Retention Laws', icon: Database },
    { id: 'effects', label: '5. Immediate Effects', icon: AlertTriangle },
    { id: 'recovery', label: '6. Grace Period & Recovery', icon: History },
    { id: 'faqs', label: '7. Deletion FAQs', icon: HelpCircle },
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
              <UserX className="h-3.5 w-3.5" /> Account Lifecycle
            </span>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Account Deletion Policy
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-300">
              Understanding the process, conditions, and legal parameters regarding the deletion of student, parent, or staff accounts at Adamjee Coaching Center.
            </p>
            <div className="mt-8 text-sm text-slate-400">
              <span>Last Updated: May 18, 2026</span>
              <span className="mx-2">•</span>
              <span>Version 1.0</span>
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
              <p className="px-3 text-xs font-bold uppercase tracking-wider text-slate-400">Policy Sections</p>
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
                <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 text-xs text-amber-900">
                  <p className="font-bold flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Critical Notice
                  </p>
                  <p className="mt-1 leading-relaxed text-amber-800">
                    Deletion is permanent. Once purged, historical credentials cannot be recovered without a physical campus visit.
                  </p>
                </div>
              </div>
            </div>
          </aside>

          {/* ── Right Content Area ── */}
          <main className="space-y-16 lg:col-span-3">
            
            {/* Section 1: Policy Overview */}
            <article id="overview" className="scroll-mt-28 rounded-3xl border border-slate-200/60 bg-white p-8 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1c2450]/5 text-[#1c2450]">
                  <UserX className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-bold text-[#1c2450]">1. Policy Overview</h2>
              </div>
              <div className="mt-6 space-y-4 text-base leading-relaxed text-slate-600">
                <p>
                  At <strong>Adamjee Coaching Center</strong>, we value the autonomy of our students, parents, and employees over their digital identities. This Account Deletion Policy outlines your rights regarding account termination and defines the protocols we execute when you choose to close your portal account.
                </p>
                <p>
                  Our goal is to ensure a transparent, safe, and legally-compliant deletion mechanism while preserving essential academic archives, financial ledgers, and institutional regulatory data in accordance with local education board compliance requirements.
                </p>
              </div>
            </article>

            {/* Section 2: Eligibility Criteria */}
            <article id="eligibility" className="scroll-mt-28 rounded-3xl border border-slate-200/60 bg-white p-8 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1c2450]/5 text-[#1c2450]">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-bold text-[#1c2450]">2. Eligibility & Requirements</h2>
              </div>
              <div className="mt-6 space-y-4 text-base leading-relaxed text-slate-600">
                <p>
                  Before an account deletion request can be successfully processed, certain administrative conditions must be fulfilled to prevent system discrepancies:
                </p>

                <div className="grid gap-6 md:grid-cols-2 mt-6">
                  <div className="flex gap-3 items-start p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                    <CheckCircle className="h-5 w-5 shrink-0 text-[#76c2e2] mt-0.5" />
                    <div>
                      <h4 className="font-bold text-[#1c2450]">Zero Financial Dues</h4>
                      <p className="text-sm text-slate-500 mt-1">All outstanding monthly coaching fee vouchers, admission fees, and library fines must be fully paid and settled in our system.</p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                    <CheckCircle className="h-5 w-5 shrink-0 text-[#76c2e2] mt-0.5" />
                    <div>
                      <h4 className="font-bold text-[#1c2450]">Parental Approval (Under 18)</h4>
                      <p className="text-sm text-slate-500 mt-1">If the student profile belongs to a minor under 18 years of age, the deletion request must be raised or approved by the registered guardian profile.</p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                    <CheckCircle className="h-5 w-5 shrink-0 text-[#76c2e2] mt-0.5" />
                    <div>
                      <h4 className="font-bold text-[#1c2450]">Staff/Faculty Clearance</h4>
                      <p className="text-sm text-slate-500 mt-1">Teachers and branch staff members must acquire an official No Objection Certificate (NOC) and submit grade rosters before deleting their accounts.</p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                    <CheckCircle className="h-5 w-5 shrink-0 text-[#76c2e2] mt-0.5" />
                    <div>
                      <h4 className="font-bold text-[#1c2450]">No Active Enrollments</h4>
                      <p className="text-sm text-slate-500 mt-1">The student must be officially registered as "Withdrawn", "Graduated", or "Inactive" in their primary academic records.</p>
                    </div>
                  </div>
                </div>
              </div>
            </article>

            {/* Section 3: Deletion Process */}
            <article id="process" className="scroll-mt-28 rounded-3xl border border-slate-200/60 bg-white p-8 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1c2450]/5 text-[#1c2450]">
                  <Trash2 className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-bold text-[#1c2450]">3. How to Request Deletion</h2>
              </div>
              <div className="mt-6 space-y-6 text-base leading-relaxed text-slate-600">
                <p>
                  To protect crucial academic marks rosters, historical attendance histories, and payment receipts from accidental loss or malicious deletion, <strong>there is no self-service "Delete Account" button inside the student or parent portal</strong>.
                </p>
                <p>
                  All account deletions must be processed directly through the administrative levels. Please follow the authorized request pathways below:
                </p>

                <div className="space-y-6">
                  <div className="relative border-l-2 border-[#1c2450] pl-6 pb-2">
                    <span className="absolute -left-[9px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#1c2450] text-[8px] text-white">1</span>
                    <h4 className="font-bold text-[#1c2450] text-lg">Pathway A: Direct Campus Admin Request (In-Person)</h4>
                    <p className="text-sm text-slate-600 mt-1">
                      Parents or students can visit their respective <strong>Adamjee campus branch office</strong> in person and submit a formal account deletion application. The campus administrator will verify the applicant's identity, ensure all financial dues are fully cleared, and submit the deletion request to the core IT division.
                    </p>
                  </div>

                  <div className="relative border-l-2 border-[#1c2450] pl-6 pb-2">
                    <span className="absolute -left-[9px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#1c2450] text-[8px] text-white">2</span>
                    <h4 className="font-bold text-[#1c2450] text-lg">Pathway B: Email Verification (Remote Request)</h4>
                    <p className="text-sm text-slate-600 mt-1">
                      Send an official email to <strong>globiumclouds@gmail.com</strong> using your registered parent or teacher email address. The email must include the Student Name, Class, and GR Number, along with a reason for deletion. Our IT helpdesk will cross-verify coordinates before executing system removal.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 border border-slate-200/60 p-5">
                  <h4 className="font-bold text-[#1c2450] flex items-center gap-2">
                    <Clock className="h-5 w-5 text-[#76c2e2]" /> Verification Timelines
                  </h4>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                    Once submitted, our IT security desk takes up to <strong>7 business days</strong> to run exhaustive compliance checks (verifying outstanding fee balances, teacher clearance approvals, and administrative records) before confirming the final schedule for digital deletion.
                  </p>
                </div>
              </div>
            </article>

            {/* Section 4: Data Retention Laws */}
            <article id="retention" className="scroll-mt-28 rounded-3xl border border-slate-200/60 bg-white p-8 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1c2450]/5 text-[#1c2450]">
                  <Database className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-bold text-[#1c2450]">4. Data Retention Limits</h2>
              </div>
              <div className="mt-6 space-y-4 text-base leading-relaxed text-slate-600">
                <p>
                  Please note that <strong>Account Deletion is not completely synonymous with instant data purging</strong>. In compliance with Sindh Board of Education regulatory requirements and auditing policies, Adamjee retains specific files:
                </p>
                <div className="mt-6 grid gap-6 sm:grid-cols-2">
                  <div className="border border-slate-100 rounded-2xl bg-slate-50/50 p-5">
                    <h4 className="font-bold text-[#1c2450]">Permanent Archival Data</h4>
                    <ul className="mt-3 space-y-2 text-sm text-slate-500 list-disc pl-5">
                      <li>Student Admission Register (GR Book details)</li>
                      <li>Academic session marks rosters and final grade transcripts</li>
                      <li>Historical audit ledgers for financial voucher payments</li>
                    </ul>
                  </div>
                  <div className="border border-slate-100 rounded-2xl bg-slate-50/50 p-5">
                    <h4 className="font-bold text-amber-800">Completely Purged Data (90 Days)</h4>
                    <ul className="mt-3 space-y-2 text-sm text-slate-500 list-disc pl-5">
                      <li>Active Login Credentials (password hashes and JWT states)</li>
                      <li>Profile Avatars and scanned digital documents</li>
                      <li>Daily attendance check-in scan files</li>
                      <li>App notification histories and custom chat channels</li>
                    </ul>
                  </div>
                </div>
              </div>
            </article>

            {/* Section 5: Immediate Effects */}
            <article id="effects" className="scroll-mt-28 rounded-3xl border border-slate-200/60 bg-white p-8 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/5 text-amber-500">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-bold text-[#1c2450]">5. Immediate Effects of Deletion</h2>
              </div>
              <div className="mt-6 space-y-4 text-base leading-relaxed text-slate-600">
                <p>
                  Once your request passes validation and the deletion process is finalized, the following system events occur immediately:
                </p>
                <div className="mt-6 space-y-4">
                  <div className="flex gap-4 items-start">
                    <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-500 font-bold text-xs">!</div>
                    <div>
                      <h4 className="font-bold text-[#1c2450]">Portal Blockade</h4>
                      <p className="text-sm text-slate-500">Instant suspension of access to student portfolios, fee billing ledgers, and academic results pages.</p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start">
                    <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-500 font-bold text-xs">!</div>
                    <div>
                      <h4 className="font-bold text-[#1c2450]">QR Code Termination</h4>
                      <p className="text-sm text-slate-500">The student identity QR code printed on physical ID cards will be immediately deactivated on our database layer. Subsequent hand-scanner check-ins will return system failures.</p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start">
                    <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-500 font-bold text-xs">!</div>
                    <div>
                      <h4 className="font-bold text-[#1c2450]">Opt-Out from Alerts</h4>
                      <p className="text-sm text-slate-500">Automatic termination of all daily SMS text broadcasts, automatic notifications to parent accounts, and administrative mail dispatches.</p>
                    </div>
                  </div>
                </div>
              </div>
            </article>

            {/* Section 6: Grace Period */}
            <article id="recovery" className="scroll-mt-28 rounded-3xl border border-slate-200/60 bg-white p-8 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1c2450]/5 text-[#1c2450]">
                  <History className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-bold text-[#1c2450]">6. Grace Period & Recovery</h2>
              </div>
              <div className="mt-6 space-y-4 text-base leading-relaxed text-slate-600">
                <p>
                  To protect our students and parents from accidental termination or malicious access requests:
                </p>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 mt-6">
                  <h4 className="font-bold text-[#1c2450] flex items-center gap-2">
                    <Clock className="h-5 w-5 text-[#76c2e2]" /> 30-Day Recovery Buffer
                  </h4>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                    All processed deletions are initially held in a **"Soft Deleted"** quarantine state for exactly **30 days**. During this period, all active database accesses are blocked, but the records are fully intact. 
                  </p>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                    If you realize the deletion was requested in error, you can reactivate your account by sending a recovery request to **globiumclouds@gmail.com** from your registered parent email address, or visiting the campus branch desk. After 30 days, the profile information enters final physical eradication queues.
                  </p>
                </div>
              </div>
            </article>

            {/* Section 7: FAQs */}
            <article id="faqs" className="scroll-mt-28 rounded-3xl border border-slate-200/60 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1c2450]/5 text-[#1c2450]">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-bold text-[#1c2450]">7. Frequently Asked Questions</h2>
              </div>
              
              <div className="mt-8 space-y-4">
                <details className="group rounded-2xl bg-slate-50 border border-slate-100 p-4 transition-all [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer items-center justify-between gap-1.5 text-base font-bold text-[#1c2450]">
                    <span>Can I reuse my GR Number to register a new account later?</span>
                    <span className="shrink-0 rounded-full bg-white p-1.5 text-slate-400 group-open:rotate-180 transition-transform">
                      <ArrowRight className="h-4 w-4 rotate-90" />
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 pl-1">
                    GR Numbers (General Register numbers) are unique, static identifiers associated with your physical enrollment log. While you cannot create a fresh self-register account with the same GR, you can re-link physical logs to a fresh app credential with campus branch approval.
                  </p>
                </details>

                <details className="group rounded-2xl bg-slate-50 border border-slate-100 p-4 transition-all [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer items-center justify-between gap-1.5 text-base font-bold text-[#1c2450]">
                    <span>What happens to my payment records after deletion?</span>
                    <span className="shrink-0 rounded-full bg-white p-1.5 text-slate-400 group-open:rotate-180 transition-transform">
                      <ArrowRight className="h-4 w-4 rotate-90" />
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 pl-1">
                    For tax auditing, institutional financial tracking, and regulatory requirements, your fee receipts, payment timestamps, and voucher histories are kept permanently in our offline financial records database, anonymous to portal queries.
                  </p>
                </details>

                <details className="group rounded-2xl bg-slate-50 border border-slate-100 p-4 transition-all [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer items-center justify-between gap-1.5 text-base font-bold text-[#1c2450]">
                    <span>I am changing branches, do I need to delete my account?</span>
                    <span className="shrink-0 rounded-full bg-white p-1.5 text-slate-400 group-open:rotate-180 transition-transform">
                      <ArrowRight className="h-4 w-4 rotate-90" />
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 pl-1">
                    No! If you are moving between Adamjee coaching branches, please do not delete your account. Contact the destination branch registrar to issue an official branch transfer ticket. Your history and GR records will migrate automatically.
                  </p>
                </details>
              </div>
            </article>

          </main>
        </div>
      </section>

      <Footer />
    </div>
  );
}
