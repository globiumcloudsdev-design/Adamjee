'use client';
import "./landing.css";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WelcomeScreen from "@/components/WelcomeScreen";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight, Award, BookOpen, Calendar, CheckCircle, Clock,
  DollarSign, GraduationCap, Mail, MapPin, Phone, Quote,
  School, Star, Trophy, UserCheck, Users2, LineChart, Sparkles,
  Target, Zap, Shield, ChevronRight, Play, Monitor,
  Pencil, PenTool, Lightbulb, Compass, Ruler, Calculator, Book
} from "lucide-react";

const STATS = [
  { value: "1200", suffix: "+", label: "Students Enrolled" },
  { value: "80", suffix: "+", label: "Expert Teachers" },
  { value: "40", suffix: "+", label: "Classes" },
  { value: "95", suffix: "%", label: "Success Rate" },
];

const FEATURES = [
  { icon: UserCheck, title: "Smart Attendance", desc: "QR-based attendance system with real-time tracking and instant parent notifications.", color: "from-blue-500 to-cyan-400" },
  { icon: DollarSign, title: "Online Fee Management", desc: "Digital fee collection, automated challans, and complete payment history at a glance.", color: "from-emerald-500 to-teal-400" },
  { icon: Calendar, title: "Exam Scheduling", desc: "Plan exams, publish timetables, and manage results with zero manual work.", color: "from-violet-500 to-purple-400" },
  { icon: Users2, title: "Parent Portal", desc: "Parents get live access to attendance, results, notices and fee status 24/7.", color: "from-orange-500 to-amber-400" },
  { icon: LineChart, title: "AI Analytics", desc: "Smart reports with trends and insights to boost student performance continuously.", color: "from-pink-500 to-rose-400" },
  { icon: Clock, title: "Timetable Builder", desc: "Build and manage class schedules efficiently to keep teachers and students aligned.", color: "from-indigo-500 to-blue-400" },
  { icon: BookOpen, title: "Assignment Tracker", desc: "Assign homework, track submissions, and give feedback all in one dashboard.", color: "from-sky-500 to-cyan-400" },
  { icon: Shield, title: "ID Card Generator", desc: "Auto-generate professional student ID cards with QR codes instantly.", color: "from-red-500 to-pink-400" },
];

const GALLERY = [
  { label: "Modern Classrooms", img: "https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=800&auto=format&fit=crop", icon: School },
  { label: "Science Labs", img: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=800&auto=format&fit=crop", icon: Zap },
  { label: "Sports Events", img: "https://images.unsplash.com/photo-1576085898323-218337e3e43c?q=80&w=800&auto=format&fit=crop", icon: Trophy },
  { label: "Campus Library", img: "https://images.unsplash.com/photo-1568667256549-094345857637?q=80&w=800&auto=format&fit=crop", icon: BookOpen },
  { label: "Art Workshops", img: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=800&auto=format&fit=crop", icon: Sparkles },
  { label: "Annual Award Ceremony", img: "https://images.unsplash.com/photo-1523580494112-071d384e236c?q=80&w=1200&auto=format&fit=crop", icon: Award },
];

const POSITION_HOLDERS = [
  { rank: 1, name: "Ayesha Khan", grade: "Class 10 — Science", score: "99%", subject: "Top in Board Exams", bg: "from-yellow-400 to-orange-500", photo: "https://i.pravatar.cc/150?u=ayesha" },
  { rank: 2, name: "Hassan Ali", grade: "Class 8 — General", score: "97%", subject: "Math Olympiad Gold", bg: "from-slate-400 to-slate-600", photo: "https://i.pravatar.cc/150?u=hassan" },
  { rank: 3, name: "Maryam Noor", grade: "Class 12 — Pre-Medical", score: "96%", subject: "Highest in Biology", bg: "from-orange-400 to-amber-600", photo: "https://i.pravatar.cc/150?u=maryam" },
  { rank: 4, name: "Usman Raza", grade: "Class 9 — Science", score: "95%", subject: "Physics Excellence", bg: "from-sky-400 to-blue-600", photo: "https://i.pravatar.cc/150?u=usman" },
  { rank: 5, name: "Fatima Zahra", grade: "Class 11 — Commerce", score: "94%", subject: "Top Commerce Student", bg: "from-violet-400 to-purple-600", photo: "https://i.pravatar.cc/150?u=fatima" },
  { rank: 6, name: "Ahmed Siddiq", grade: "Class 7 — General", score: "93%", subject: "English Distinction", bg: "from-emerald-400 to-teal-600", photo: "https://i.pravatar.cc/150?u=ahmed" },
];

const TESTIMONIALS = [
  { quote: "Best coaching centre in Karachi. My child's result improved dramatically!", name: "Sara Malik", role: "Parent of Class 10 student", avatar: "SM" },
  { quote: "The parent portal keeps us updated daily. Attendance and fees — all in one place.", name: "Omar Qureshi", role: "Parent of Class 8 student", avatar: "OQ" },
  { quote: "Teachers are highly qualified and the management system is excellent.", name: "Nadia Khan", role: "Parent of Class 12 student", avatar: "NK" },
  { quote: "QR attendance is brilliant. I get instant SMS when my child reaches campus.", name: "Ahmed Raza", role: "Parent of Class 9 student", avatar: "AR" },
];

const ADMISSION_STEPS = [
  { step: "01", title: "Submit Inquiry", text: "Fill in your details and the class you require — takes under 2 minutes.", icon: ChevronRight },
  { step: "02", title: "Campus Visit", text: "Meet our team, tour the facility, and discuss academic roadmap.", icon: ChevronRight },
  { step: "03", title: "Confirm Enrollment", text: "Complete admission and get instant access to our digital system.", icon: ChevronRight },
];

function useCounter(end, isVisible) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!isVisible) return;
    const target = parseInt(end);
    let start = 0;
    const dur = 2000;
    const startTime = performance.now();
    const tick = (now) => {
      const p = Math.min((now - startTime) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.floor(target * ease));
      if (p < 1) requestAnimationFrame(tick);
      else setVal(target);
    };
    requestAnimationFrame(tick);
  }, [isVisible, end]);
  return val;
}

function useInView() {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

function StatCard({ value, suffix, label }) {
  const [ref, inView] = useInView();
  const count = useCounter(value, inView);
  return (
    <div ref={ref} className="lp-stat-card">
      <div className="lp-stat-number">{count}{suffix}</div>
      <div className="lp-stat-label">{label}</div>
    </div>
  );
}

function ScrollSection({ children, className = "" }) {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} className={`lp-scroll-section ${inView ? "lp-scroll-visible" : ""} ${className}`}>
      {children}
    </div>
  );
}

export default function Home() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [currentAchiever, setCurrentAchiever] = useState(0);
  const [testimonialPaused, setTestimonialPaused] = useState(false);
  const [achieverPaused, setAchieverPaused] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", phone: "", message: "" });
  const [formSent, setFormSent] = useState(false);
  const [heroLoaded, setHeroLoaded] = useState(false);

  useEffect(() => {
    if (testimonialPaused) return;
    const iv = setInterval(() => setCurrentTestimonial(p => (p + 1) % TESTIMONIALS.length), 4500);
    return () => clearInterval(iv);
  }, [testimonialPaused]);

  useEffect(() => {
    if (achieverPaused) return;
    const iv = setInterval(() => setCurrentAchiever(p => (p + 1) % POSITION_HOLDERS.length), 3500);
    return () => clearInterval(iv);
  }, [achieverPaused]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormSent(true);
    setContactForm({ name: "", phone: "", message: "" });
    setTimeout(() => setFormSent(false), 5000);
  };

  return (
    <div className="lp-root">
      <WelcomeScreen onComplete={() => setHeroLoaded(true)} />
      <div className={`lp-main-layout-wrapper ${heroLoaded ? 'lp-layout-visible' : 'lp-layout-hidden'}`}>
        <div className="lp-bg-3d-elements">
        <div className="lp-3d-el lp-3d-el-1 bg-gradient-to-br from-blue-100/50 to-blue-200/50 shadow-blue-500/10"><Book className="text-blue-500 drop-shadow-sm" size={32} /></div>
        <div className="lp-3d-el lp-3d-el-2 bg-gradient-to-br from-emerald-100/50 to-emerald-200/50 shadow-emerald-500/10"><Pencil className="text-emerald-500 drop-shadow-sm" size={24} /></div>
        <div className="lp-3d-el lp-3d-el-3 bg-gradient-to-br from-amber-100/50 to-amber-200/50 shadow-amber-500/10"><GraduationCap className="text-amber-500 drop-shadow-sm" size={40} /></div>
        <div className="lp-3d-el lp-3d-el-4 bg-gradient-to-br from-purple-100/50 to-purple-200/50 shadow-purple-500/10"><Lightbulb className="text-purple-500 drop-shadow-sm" size={28} /></div>
        <div className="lp-3d-el lp-3d-el-5 bg-gradient-to-br from-cyan-100/50 to-cyan-200/50 shadow-cyan-500/10"><Compass className="text-cyan-500 drop-shadow-sm" size={36} /></div>
        <div className="lp-3d-el lp-3d-el-6 bg-gradient-to-br from-rose-100/50 to-rose-200/50 shadow-rose-500/10"><Ruler className="text-rose-500 drop-shadow-sm" size={24} /></div>
        <div className="lp-3d-el lp-3d-el-7 bg-gradient-to-br from-yellow-100/50 to-yellow-200/50 shadow-yellow-500/10"><Calculator className="text-yellow-500 drop-shadow-sm" size={36} /></div>
      </div>

      <Navbar />

      {/* ── HERO ── */}
      <section id="home" className="lp-hero">
        <div className="lp-hero-bg" />
        <div className="lp-hero-grid-overlay" />
        <div className={`lp-hero-content ${heroLoaded ? "lp-hero-loaded" : ""}`}>
          <div className="lp-hero-badge">
            <School className="h-4 w-4" />
            Adamjee Coaching Center — Campus 12
          </div>
          <h1 className="lp-hero-heading">
            Shape Your Future at<br />
            <span className="lp-gradient-text">Adamjee Coaching</span>
          </h1>
          <p className="lp-hero-sub">
            Pakistan's most advanced coaching management platform — smart attendance, digital fees, exam scheduling, and parent communication in one powerful system.
          </p>
          <div className="lp-hero-actions">
            <Link href="/login">
              <Button className="lp-btn-primary">
                Get Started <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Link href="#about">
              <Button variant="outline" className="lp-btn-outline">
                <Play className="h-4 w-4 mr-2" /> Learn More
              </Button>
            </Link>
          </div>
          <div className="lp-hero-stats">
            {STATS.map((s) => (
              <div key={s.label} className="lp-hero-stat-pill">
                <span className="lp-hero-stat-val">{s.value}{s.suffix}</span>
                <span className="lp-hero-stat-lbl">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="lp-hero-visual">
          <div className="lp-hero-card-stack">
            <div className="lp-hero-card lp-hero-card-1">
              <UserCheck className="h-6 w-6 text-blue-600" />
              <div>
                <div className="lp-hc-title">QR Attendance</div>
                <div className="lp-hc-sub">Instant parent alert</div>
              </div>
            </div>
            <div className="lp-hero-card lp-hero-card-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              <div>
                <div className="lp-hc-title">95% Pass Rate</div>
                <div className="lp-hc-sub">Board exam results 2025</div>
              </div>
            </div>
            <div className="lp-hero-card lp-hero-card-3">
              <LineChart className="h-6 w-6 text-emerald-600" />
              <div>
                <div className="lp-hc-title">AI Analytics</div>
                <div className="lp-hc-sub">Real-time insights</div>
              </div>
            </div>
            <div className="lp-hero-card lp-hero-card-4">
              <DollarSign className="h-6 w-6 text-violet-600" />
              <div>
                <div className="lp-hc-title">Online Fees</div>
                <div className="lp-hc-sub">Auto challan system</div>
              </div>
            </div>
            <div className="lp-cube-scene">
              <div className="lp-cube">
                <div className="lp-cube-face lp-cube-front">
                  <Image src="/logo.png" alt="Adamjee" width={90} height={90} className="object-contain drop-shadow-md" />
                  <span className="text-xl font-black text-blue-900 mt-2 tracking-wide uppercase">Adamjee</span>
                </div>
                <div className="lp-cube-face lp-cube-right bg-gradient-to-br from-emerald-50 to-white">
                  <Zap className="h-16 w-16 text-emerald-500 drop-shadow-sm mb-2" />
                  <span className="text-lg font-bold text-emerald-700 tracking-wider uppercase">Science</span>
                </div>
                <div className="lp-cube-face lp-cube-back bg-gradient-to-br from-violet-50 to-white">
                  <LineChart className="h-16 w-16 text-violet-500 drop-shadow-sm mb-2" />
                  <span className="text-lg font-bold text-violet-700 tracking-wider uppercase">Commerce</span>
                </div>
                <div className="lp-cube-face lp-cube-left bg-gradient-to-br from-pink-50 to-white">
                  <Sparkles className="h-16 w-16 text-pink-500 drop-shadow-sm mb-2" />
                  <span className="text-lg font-bold text-pink-700 tracking-wider uppercase">Arts</span>
                </div>
                <div className="lp-cube-face lp-cube-top bg-gradient-to-br from-blue-50 to-white">
                  <Monitor className="h-16 w-16 text-blue-500 drop-shadow-sm mb-2" />
                  <span className="text-lg font-bold text-blue-700 tracking-wider uppercase">Tech</span>
                </div>
                <div className="lp-cube-face lp-cube-bottom bg-gradient-to-br from-yellow-50 to-white">
                  <Trophy className="h-16 w-16 text-yellow-500 drop-shadow-sm mb-2" />
                  <span className="text-lg font-bold text-yellow-700 tracking-wider uppercase">Top Rank</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── NEWS TICKER ── */}
      <div className="lp-news-ticker">
        <div className="lp-ticker-label">Updates</div>
        <div className="lp-ticker-wrap">
          <div className="lp-ticker-track">
            <span className="lp-ticker-item">🌟 Admissions Open for <strong>Session 2026</strong>. Register Now!</span>
            <span className="lp-ticker-item">🚀 <strong>95% Pass Rate</strong> in Board Exams.</span>
            <span className="lp-ticker-item">💡 New <strong>AI-Driven Analytics</strong> introduced for parents.</span>
            <span className="lp-ticker-item">📢 Next Campus 12 Grand Seminar on <strong>28th May</strong>.</span>
            {/* Duplicated for seamless loop */}
            <span className="lp-ticker-item">🌟 Admissions Open for <strong>Session 2026</strong>. Register Now!</span>
            <span className="lp-ticker-item">🚀 <strong>95% Pass Rate</strong> in Board Exams.</span>
            <span className="lp-ticker-item">💡 New <strong>AI-Driven Analytics</strong> introduced for parents.</span>
            <span className="lp-ticker-item">📢 Next Campus 12 Grand Seminar on <strong>28th May</strong>.</span>
          </div>
        </div>
      </div>


      {/* ── ABOUT / DIRECTOR'S VISION ── */}
      <section id="about" className="lp-section lp-about-section">
        <ScrollSection className="lp-about-grid">
          <div className="lp-about-visual">
            <div className="lp-about-img-wrap" style={{ borderRadius: '2rem', overflow: 'hidden', border: '6px solid white', boxShadow: '0 25px 50px rgba(0,0,0,0.1)' }}>
              {/* Placeholder for Campus Owner's Picture */}
              <div style={{ width: '100%', height: '550px', background: 'linear-gradient(135deg, #e2e8f0, #cbd5e1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                <UserCheck className="h-20 w-20 text-slate-400 mb-4 drop-shadow-sm" />
                <span className="text-slate-500 font-bold uppercase tracking-widest text-sm">Campus Owner Picture</span>
              </div>
              <div className="lp-about-badge-years" style={{ bottom: '30px', right: '-20px' }}>
                <span className="lp-about-badge-num" style={{ fontSize: '1.5rem' }}>Vision</span>
                <span className="lp-about-badge-txt">For 2030 & Beyond</span>
              </div>
            </div>
          </div>
          <div className="lp-about-text">
            <p className="lp-eyebrow">Director's Message</p>
            <h2 className="lp-section-heading">Our Future Scope &<br /><span className="lp-gradient-text">Vision</span></h2>
            <p className="lp-body-text" style={{ fontStyle: 'italic', color: '#475569', fontSize: '1.1rem', borderLeft: '4px solid #3b82f6', paddingLeft: '1rem', margin: '1.5rem 0' }}>
              "At Adamjee Coaching Center Campus 12, our vision extends far beyond traditional academics. We are building a future where education is seamlessly integrated with modern technology, empowering students to become global leaders and innovators."
            </p>
            <p className="lp-body-text">
              Our future scope includes expanding our digital ecosystem with AI-driven personalized learning paths, introducing advanced tech bootcamps, and providing a state-of-the-art campus environment that fosters creativity, critical thinking, and unmatched academic excellence.
            </p>
            <div className="lp-about-bullets mt-6">
              {[
                "AI-Driven Personalized Learning Paths",
                "Advanced Tech & Robotics Integration",
                "Holistic Student Development Programs",
                "State-of-the-art Smart Classrooms",
              ].map((b) => (
                <div key={b} className="lp-about-bullet">
                  <CheckCircle className="h-5 w-5 text-blue-500 shrink-0" />
                  <span className="font-medium text-slate-700">{b}</span>
                </div>
              ))}
            </div>
          </div>
        </ScrollSection>
      </section>

      {/* ── STATS ── */}
      <section className="lp-stats-section">
        <div className="lp-stats-grid">
          {STATS.map((s) => <StatCard key={s.label} {...s} />)}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="lp-section">
        <ScrollSection>
          <div className="lp-section-header">
            <p className="lp-eyebrow">Features</p>
            <h2 className="lp-section-heading">Everything a Coaching<br /><span className="lp-gradient-text">Centre Needs</span></h2>
            <p className="lp-section-desc">One powerful platform to manage students, staff, exams, fees, and parents — with zero paperwork.</p>
          </div>
          <div className="lp-features-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="lp-feature-card">
                <div className={`lp-feature-icon bg-gradient-to-br ${f.color}`}>
                  <f.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="lp-feature-title">{f.title}</h3>
                <p className="lp-feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </ScrollSection>
      </section>

      {/* ── GALLERY ── */}
      <section id="gallery" className="lp-section lp-gallery-section">
        <ScrollSection>
          <div className="lp-section-header">
            <p className="lp-eyebrow">Campus Life</p>
            <h2 className="lp-section-heading">A Glimpse of Our<br /><span className="lp-gradient-text">Campus Gallery</span></h2>
            <p className="lp-section-desc">Experience the vibrant and enriching environment at Adamjee Coaching Campus 12.</p>
          </div>
          <div className="lp-gallery-grid">
            {GALLERY.map((item) => (
              <div key={item.label} className="lp-gallery-card">
                <img src={item.img} alt={item.label} className="lp-gallery-img" />
                <div className="lp-gallery-overlay" />
                <div className="lp-gallery-content">
                  <item.icon className="h-8 w-8 text-white mb-2" />
                  <span className="lp-gallery-label">{item.label}</span>
                </div>
              </div>
            ))}
          </div>
        </ScrollSection>
      </section>

      {/* ── POSITION HOLDERS CAROUSEL ── */}
      <section id="position-holders" className="lp-section lp-achievers-section">
        <ScrollSection>
          <div className="lp-section-header">
            <p className="lp-eyebrow">Position Holders</p>
            <h2 className="lp-section-heading">Our Star<br /><span className="lp-gradient-text">Achievers 2025</span></h2>
            <p className="lp-section-desc">Celebrating the outstanding students who made Adamjee Coaching proud this year.</p>
          </div>
          <div className="lp-ph-carousel-wrap"
            onMouseEnter={() => setAchieverPaused(true)}
            onMouseLeave={() => setAchieverPaused(false)}
          >
            <div className="lp-ph-carousel">
              {POSITION_HOLDERS.map((p, i) => {
                const total = POSITION_HOLDERS.length;
                const offset = (i - currentAchiever + total) % total;
                const isCenter = offset === 0;
                const isPrev = offset === total - 1;
                const isNext = offset === 1;
                const isFarPrev = offset === total - 2;
                const isFarNext = offset === 2;
                return (
                  <div
                    key={p.name}
                    className={`lp-ph-card ${isCenter ? "lp-ph-center" : isPrev ? "lp-ph-prev" : isNext ? "lp-ph-next" : isFarPrev ? "lp-ph-far-prev" : isFarNext ? "lp-ph-far-next" : "lp-ph-hidden"}`}
                    onClick={() => setCurrentAchiever(i)}
                  >
                    <div className={`lp-achiever-avatar bg-gradient-to-br ${p.bg}`}>
                      {p.photo ? (
                        <img src={p.photo} alt={p.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <>
                          {p.rank === 1 && <Trophy className="h-8 w-8 text-white" />}
                          {p.rank !== 1 && <span className="lp-achiever-rank">#{p.rank}</span>}
                        </>
                      )}
                    </div>
                    {p.rank === 1 && (
                      <div className="lp-achiever-crown">
                        <Trophy className="h-4 w-4 text-yellow-500" />
                        <span>Top Achiever</span>
                      </div>
                    )}
                    <h3 className="lp-achiever-name">{p.name}</h3>
                    <p className="lp-achiever-grade">{p.grade}</p>
                    <div className="lp-achiever-score">{p.score}</div>
                    <p className="lp-achiever-subject">{p.subject}</p>
                  </div>
                );
              })}
            </div>
            <div className="lp-ph-dots">
              {POSITION_HOLDERS.map((_, i) => (
                <button key={i} onClick={() => setCurrentAchiever(i)} className={`lp-dot ${i === currentAchiever ? "lp-dot-active" : ""}`} />
              ))}
            </div>
          </div>
        </ScrollSection>
      </section>

      {/* ── TESTIMONIALS 3D CAROUSEL ── */}
      <section className="lp-section lp-testimonials-section">
        <ScrollSection>
          <div className="lp-section-header">
            <p className="lp-eyebrow">Testimonials</p>
            <h2 className="lp-section-heading">What Parents<br /><span className="lp-gradient-text">Say About Us</span></h2>
          </div>
          <div className="lp-test-carousel-wrap"
            onMouseEnter={() => setTestimonialPaused(true)}
            onMouseLeave={() => setTestimonialPaused(false)}
          >
            <div className="lp-test-carousel">
              {TESTIMONIALS.map((t, i) => {
                const total = TESTIMONIALS.length;
                const offset = (i - currentTestimonial + total) % total;
                const isCenter = offset === 0;
                const isPrev = offset === total - 1;
                const isNext = offset === 1;
                return (
                  <div
                    key={isCenter ? `center-${currentTestimonial}` : t.name}
                    className={`lp-test-card ${isCenter ? "lp-test-center" : isPrev ? "lp-test-prev" : isNext ? "lp-test-next" : "lp-test-hidden"}`}
                    onClick={() => setCurrentTestimonial(i)}
                  >
                    <Quote className="h-8 w-8 text-blue-400 mb-4" />
                    <p className="lp-testimonial-quote">{t.quote}</p>
                    <div className="lp-testimonial-stars">
                      {[...Array(5)].map((_, idx) => <Star key={idx} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)}
                    </div>
                    <div className="lp-testimonial-author">
                      <div className="lp-testimonial-avatar">{t.avatar}</div>
                      <div>
                        <div className="lp-testimonial-name">{t.name}</div>
                        <div className="lp-testimonial-role">{t.role}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="lp-testimonial-dots">
              {TESTIMONIALS.map((_, i) => (
                <button key={i} onClick={() => setCurrentTestimonial(i)} className={`lp-dot ${i === currentTestimonial ? "lp-dot-active" : ""}`} />
              ))}
            </div>
          </div>
        </ScrollSection>
      </section>

      {/* ── ADMISSIONS ── */}
      <section id="admissions" className="lp-section lp-admissions-section">
        <ScrollSection>
          <div className="lp-section-header">
            <p className="lp-eyebrow">Admissions 2026</p>
            <h2 className="lp-section-heading">Join Adamjee<br /><span className="lp-gradient-text">in 3 Easy Steps</span></h2>
            <p className="lp-section-desc">Admissions are now open for the 2026 academic year. Secure your seat today!</p>
          </div>
          <div className="lp-steps-grid">
            {ADMISSION_STEPS.map((s) => (
              <div key={s.step} className="lp-step-card">
                <div className="lp-step-number">{s.step}</div>
                <h3 className="lp-step-title">{s.title}</h3>
                <p className="lp-step-text">{s.text}</p>
              </div>
            ))}
          </div>
          <div className="lp-admissions-cta">
            <Link href="/login">
              <Button className="lp-btn-primary lp-btn-lg">
                Apply Now <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>
        </ScrollSection>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" className="lp-section lp-contact-section">
        <ScrollSection>
          <div className="lp-section-header">
            <p className="lp-eyebrow">Contact Us</p>
            <h2 className="lp-section-heading">Get in Touch<br /><span className="lp-gradient-text">With Our Team</span></h2>
          </div>
          <div className="lp-contact-grid">
            <div className="lp-contact-info-container">
              <div className="lp-contact-cards-grid">
                
                <div className="lp-contact-card-premium">
                  <div className="lp-contact-icon-box bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div className="lp-contact-card-content">
                    <span className="lp-contact-card-label">Call Us</span>
                    <a href="tel:+923352778488" className="lp-contact-card-link">+92 335 2778488</a>
                    <a href="tel:02137520456" className="lp-contact-card-link">021-37520456</a>
                  </div>
                </div>

                <div className="lp-contact-card-premium">
                  <div className="lp-contact-icon-box bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div className="lp-contact-card-content">
                    <span className="lp-contact-card-label">Email Us</span>
                    <a href="mailto:globiumclouds@gmail.com" className="lp-contact-card-link">globiumclouds@gmail.com</a>
                  </div>
                </div>

                <div className="lp-contact-card-premium">
                  <div className="lp-contact-icon-box bg-gradient-to-br from-teal-500 to-emerald-500 text-white">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="lp-contact-card-content">
                    <span className="lp-contact-card-label">Visit Us</span>
                    <p className="lp-contact-card-text">House R-84, Sector 15-A/4, Buffer Zone, Karachi</p>
                  </div>
                </div>

                <div className="lp-contact-card-premium">
                  <div className="lp-contact-icon-box bg-gradient-to-br from-amber-500 to-orange-500 text-white">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div className="lp-contact-card-content">
                    <span className="lp-contact-card-label">Hours</span>
                    <p className="lp-contact-card-text">Mon–Sat: 7:00 AM – 8:00 PM</p>
                  </div>
                </div>

              </div>

              {/* Map Card */}
              <div className="lp-contact-map-card">
                <iframe
                  title="Adamjee Coaching Campus 12 Location"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3616.1436442651475!2d67.0658763!3d24.9614488!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3eb340bf1ab9b2ff%3A0x6b4beea77a94d8cb!2sAl%20Habeeb%20Restaurant!5e0!3m2!1sen!2spk!4v1716800000000!5m2!1sen!2spk"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>

            {/* Form Card */}
            <form onSubmit={handleSubmit} className="lp-contact-form-premium">
              <div className="lp-contact-form-header">
                <h3 className="lp-contact-form-title">Send a Message</h3>
                <p className="lp-contact-form-subtext">Have questions? We'll reply within 24 hours.</p>
              </div>
              {formSent && (
                <div className="lp-form-success">
                  <CheckCircle className="h-5 w-5 shrink-0" />
                  <span>Message sent! We'll contact you soon.</span>
                </div>
              )}
              <div className="lp-form-group">
                <label className="lp-form-label">Full Name</label>
                <input
                  className="lp-form-input"
                  type="text"
                  placeholder="Your Name"
                  required
                  value={contactForm.name}
                  onChange={e => setContactForm(p => ({...p, name: e.target.value}))}
                />
              </div>
              <div className="lp-form-group">
                <label className="lp-form-label">Phone Number</label>
                <input
                  className="lp-form-input"
                  type="tel"
                  placeholder="03XX-XXXXXXX"
                  value={contactForm.phone}
                  onChange={e => setContactForm(p => ({...p, phone: e.target.value}))}
                />
              </div>
              <div className="lp-form-group">
                <label className="lp-form-label">Message</label>
                <textarea
                  className="lp-form-input lp-form-textarea"
                  placeholder="How can we help you?"
                  rows={4}
                  required
                  value={contactForm.message}
                  onChange={e => setContactForm(p => ({...p, message: e.target.value}))}
                />
              </div>
              <Button type="submit" className="lp-btn-primary w-full justify-center">
                Send Message <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </form>
          </div>
        </ScrollSection>
      </section>
      <Footer />
      </div>
    </div>
  );
}
