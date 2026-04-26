'use client';
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Award,
  BarChart3,
  Bell,
  BookOpen,
  Camera,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  GraduationCap,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Play,
  Quote,
  School,
  ShieldCheck,
  Sparkles,
  Star,
  LineChart,
  UserCheck,
  Users2,
} from "lucide-react";

const features = [
  {
    icon: UserCheck,
    title: "Attendance System",
    description: "Mark attendance in seconds and track presence across classes and sections.",
  },
  {
    icon: DollarSign,
    title: "Online Fees",
    description: "Collect dues, manage challans, and keep payment history organized.",
  },
  {
    icon: Calendar,
    title: "Exams System",
    description: "Plan exams, publish schedules, and manage results without manual work.",
  },
  {
    icon: Users2,
    title: "Parent Portal",
    description: "Give parents live access to attendance, results, notices, and updates.",
  },
  {
    icon: LineChart,
    title: "AI Reports",
    description: "See trends, performance patterns, and actionable insights at a glance.",
  },
  {
    icon: Clock,
    title: "Timetable System",
    description: "Build class schedules fast and keep every teacher aligned.",
  },
];

const statistics = [
  { value: "1200+", label: "Students" },
  { value: "80+", label: "Teachers" },
  { value: "40+", label: "Classes" },
  { value: "95%", label: "Results" },
];

const achievers = [
  { 
    initials: "AK", 
    name: "Ayesha Khan", 
    grade: "Grade 10", 
    achievement: "Top Science Project", 
    percentage: 98, 
    description: "Outstanding performance in science fair and consistent academic excellence.",
    photo: "/student-1.jpg" // Placeholder - add real photo to public/
  },
  { 
    initials: "HA", 
    name: "Hassan Ali", 
    grade: "Grade 8", 
    achievement: "Math Olympiad Winner", 
    percentage: 96, 
    description: "National Math Olympiad Gold Medalist with perfect attendance.",
    photo: "/student-2.jpg"
  },
  { 
    initials: "MN", 
    name: "Maryam Noor", 
    grade: "Grade 12", 
    achievement: "Highest Board Score", 
    percentage: 99, 
    description: "Top scorer in board exams across all streams this year.",
    photo: "/student-3.jpg"
  },
];

const announcements = [
  "Admission open for 2026",
  "Annual exams schedule released",
  "Sports week event announced",
];

const testimonials = [
  {
    quote: "Very easy system. Attendance and notices are now much faster for our family.",
    name: "Sara Malik",
    avatar: "S",
    rating: 5
  },
  {
    quote: "Best coaching platform we have used. Everything is clear and easy to follow.",
    name: "Omar Qureshi",
    avatar: "OQ",
    rating: 5
  },
  {
    quote: "Great experience. The parent portal keeps us informed every day.",
    name: "Nadia Khan",
    avatar: "NK",
    rating: 5
  },
  {
    quote: "Fee payments and attendance tracking are seamless. Love the real-time updates!",
    name: "Ahmed Raza",
    avatar: "AR",
    rating: 5
  },
  {
    quote: "My child's results and class schedules are always accessible. Highly recommend.",
    name: "Fatima Ahmed",
    avatar: "FA",
    rating: 5
  },
  {
    quote: "Excellent communication between coaching and parents. QR attendance is brilliant.",
    name: "Bilal Hassan",
    avatar: "BH",
    rating: 5
  },
  {
    quote: "Easy to check fees, homework, and teacher feedback all in one place.",
    name: "Aisha Noor",
    avatar: "AN",
    rating: 5
  },
  {
    quote: "The exam results portal and parent-teacher updates work perfectly.",
    name: "Usman Ali",
    avatar: "UA",
    rating: 5
  },
];

const gallery = [
  "Morning Assembly",
  "Science Lab",
  "Sports Ground",
  "Library Corner",
  "Art Workshop",
  "Classroom Activity",
  "Annual Function",
  "Award Ceremony",
];

  const blogs = [
    {
      title: "How digital attendance improves daily coaching operations",
      preview: "See how coachings save time with accurate, paperless check-ins.",
    },
    {
      title: "Why parent communication matters more than ever",
      preview: "A connected parent portal builds trust and reduces missed updates.",
    },
    {
      title: "Using analytics to raise exam performance",
      preview: "Turn results data into simple steps that help teachers and students.",
    },
  ];

  const aboutBullets = [
    "Modern education system with one dashboard for the whole coaching",
    "Digital attendance, notices, fees, and academic records in one place",
    "Smart reporting system designed for teachers, parents, and administrators",
  ];

  const admissionsSteps = [
    {
      step: "01",
      title: "Submit Inquiry",
      text: "Fill in your details and tell us which class you need.",
    },
    {
      step: "02",
      title: "Campus Review",
      text: "Meet the team, tour the campus, and discuss next steps.",
    },
    {
      step: "03",
      title: "Confirm Seat",
      text: "Complete enrollment and receive access to the coaching system.",
    },
  ];

  // 3D Tilt Card Hook
  function use3DTilt() {
    const ref = useRef(null);
    const [rotateX, setRotateX] = useState(0);
    const [rotateY, setRotateY] = useState(0);

    const handleMouseMove = (e) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateXValue = ((y - centerY) / centerY) * -8;
      const rotateYValue = ((x - centerX) / centerX) * 8;
      setRotateX(rotateXValue);
      setRotateY(rotateYValue);
    };

    const handleMouseLeave = () => {
      setRotateX(0);
      setRotateY(0);
    };

    return { ref, rotateX, rotateY, handleMouseMove, handleMouseLeave };
  }

  // Particle Background Component
  function ParticleBackground() {
    const canvasRef = useRef(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      const setCanvasSize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      };
      setCanvasSize();
      window.addEventListener("resize", setCanvasSize);

      const particles = [];
      const particleCount = 80;

      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 3 + 1,
          speedX: (Math.random() - 0.5) * 0.4,
          speedY: (Math.random() - 0.5) * 0.4,
          opacity: Math.random() * 0.5 + 0.1,
        });
      }

      let animationFrameId;
      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach((particle) => {
          particle.x += particle.speedX;
          particle.y += particle.speedY;

          if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1;
          if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1;

          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(59, 130, 246, ${particle.opacity})`;
          ctx.fill();
        });

        // Draw connections
        particles.forEach((p1, i) => {
          particles.slice(i + 1).forEach((p2) => {
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 120) {
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.strokeStyle = `rgba(59, 130, 246, ${0.08 * (1 - dist / 120)})`;
              ctx.stroke();
            }
          });
        });

        animationFrameId = requestAnimationFrame(animate);
      };
      animate();

      return () => {
        window.removeEventListener("resize", setCanvasSize);
        cancelAnimationFrame(animationFrameId);
      };
    }, []);

    return (
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0 pointer-events-none"
        style={{ opacity: 0.6 }}
      />
    );
  }

  // Scroll-triggered animation observer
  function useScrollAnimation() {
    const ref = useRef(null);
    useEffect(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("animate-in");
            }
          });
        },
        { threshold: 0.1 }
      );
      if (ref.current) observer.observe(ref.current);
      return () => observer.disconnect();
    }, []);
    return ref;
  }

function SectionHeading({ eyebrow, title, description, align = "left" }) {
  return (
    <div className={`${align === "center" ? "mx-auto text-center" : ""} max-w-3xl`}>
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-600">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{title}</h2>
      <p className="mt-4 text-base leading-7 text-slate-600">{description}</p>
    </div>
  );
}

function AnimatedCounter({ endVal, suffix, duration = 2500, isVisible = false }) {
  const [count, setCount] = useState(0);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!isVisible || animationRef.current) return;

    const startTime = performance.now();
    const target = parseInt(endVal) || 0;
    const step = (timestamp) => {
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      const currentCount = target * easeProgress;
      setCount(currentCount);
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(step);
      } else {
        setCount(target);
        animationRef.current = null;
      }
    };
    animationRef.current = requestAnimationFrame(step);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isVisible, endVal, duration]);

  return (
    <span className="text-4xl font-black text-slate-950">
      {Math.floor(count).toLocaleString()}{suffix}
    </span>
  );
}

// Circular Scroll Progress Indicator Component
function CircularScrollIndicator() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [hasAppeared, setHasAppeared] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = window.scrollY;
      const scrollPercent = scrollHeight > 0 ? (scrolled / scrollHeight) * 100 : 0;
      setScrollProgress(scrollPercent);
      
      // Show indicator after scrolling 200px
      if (scrolled > 200) {
        setIsVisible(true);
        setHasAppeared(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Smooth scroll to top
  const handleScrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Calculate SVG circle progress
  const circumference = 251.2; // 2 * PI * 40 (radius 40)
  const strokeDashoffset = circumference - (scrollProgress / 100) * circumference;

  return (
    <div
      className={`circular-scroll-container ${
        isVisible ? "circular-scroll-visible" : ""
      } ${hasAppeared ? "circular-scroll-appeared" : ""}`}
      onClick={handleScrollToTop}
      role="button"
      tabIndex={0}
      aria-label="Scroll to top"
      onKeyDown={(e) => e.key === "Enter" && handleScrollToTop()}
    >
      <svg
        className="circular-progress-svg"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="circular-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
        
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r="40"
          className="circular-progress-circle circular-progress-bg"
        />
        
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r="40"
          className="circular-progress-circle circular-progress-fill"
          style={{ strokeDashoffset }}
        />
      </svg>

      {/* Arrow icon */}
      <div className="circular-scroll-arrow">
        <ArrowRight size={20} strokeWidth={2.5} />
      </div>

      {/* Percentage label */}
      <div className="circular-scroll-label">
        <span className="circular-scroll-percent">{Math.round(scrollProgress)}%</span>
      </div>
    </div>
  );
}

function TestimonialsSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const autoplayRef = useRef(null);

  useEffect(() => {
    if (!autoplay) return;

    autoplayRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
    };
  }, [autoplay]);

  const handleDotClick = (index) => {
    setCurrentSlide(index);
    setAutoplay(false);
    setTimeout(() => setAutoplay(true), 8000);
  };

  return (
    <div className="testimonials-slider-container">
      {/* Main Carousel */}
      <div className="testimonials-carousel-wrapper">
        <div className="testimonials-carousel">
          {testimonials.map((item, index) => {
            const offset = (index - currentSlide + testimonials.length) % testimonials.length;
            const isCenter = offset === 0;
            const isPrev = offset === testimonials.length - 1;
            const isNext = offset === 1;

            return (
              <Card
                key={item.name}
                className={`testimonials-card ${
                  isCenter
                    ? "testimonials-card-center"
                    : isPrev
                    ? "testimonials-card-prev"
                    : isNext
                    ? "testimonials-card-next"
                    : "testimonials-card-hidden"
                }`}
              >
                <CardContent className="p-6">
                  <Quote className="h-8 w-8 text-sky-600" />
                  <p className="mt-4 text-base leading-7 text-slate-700">{item.quote}</p>
                  <div className="mt-6 flex items-center gap-1 text-amber-500">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star key={idx} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 text-white text-sm font-bold">
                      {item.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{item.name}</p>
                      <p className="text-xs text-slate-500">Parent</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="testimonials-controls mt-10 flex items-center justify-center">
        {/* Dots Navigation */}
        <div className="flex gap-2">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              className={`testimonials-dot ${
                index === currentSlide ? "testimonials-dot-active" : ""
              }`}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const heroTilt = use3DTilt();
  const aboutRef = useScrollAnimation();
  const featuresRef = useScrollAnimation();
  const statsRef = useScrollAnimation();
  const [statsVisible, setStatsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStatsVisible(true);
          entry.target.classList.add("animate-in");
        }
      },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);
  const achieversRef = useScrollAnimation();
  const admissionsRef = useScrollAnimation();
  const testimonialsRef = useScrollAnimation();
  const galleryRef = useScrollAnimation();
  const blogsRef = useScrollAnimation();
  const contactRef = useScrollAnimation();
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  // Testimonials Slider State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPaused) {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
      }
    }, 4000); // Auto-advance every 4 seconds

    return () => clearInterval(interval);
  }, [isPaused, testimonials.length]);

  // Pause on hover/focus
  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);
  const [formStatus, setFormStatus] = useState("");

  useEffect(() => {
    if (!formStatus) return undefined;

    const timeoutId = window.setTimeout(() => {
      setFormStatus("");
    }, 4000);

    return () => window.clearTimeout(timeoutId);
  }, [formStatus]);

  const handleContactSubmit = (event) => {
    event.preventDefault();
    setFormStatus("Thanks for reaching out. We will contact you soon.");
    setContactForm({ name: "", email: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.11)_0%,_rgba(14,165,233,0.09)_22%,_#f8fafc_48%,_#ffffff_76%)] text-slate-900">
      <Navbar />
      <CircularScrollIndicator />

      <main>
        <section id="home" className="relative overflow-hidden">
          <ParticleBackground />
          <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(15,23,42,0.08),rgba(14,165,233,0.09)_36%,rgba(248,250,252,0.7)_72%,transparent)]" />
          <div className="absolute left-10 top-24 h-40 w-40 rounded-full bg-sky-400/20 blur-3xl hero-glow" />
          <div className="absolute right-10 top-16 h-56 w-56 rounded-full bg-slate-900/15 blur-3xl hero-glow" style={{ animationDelay: "1.5s" }} />

          <div className="relative mx-auto grid max-w-7xl gap-14 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-28">
            <div className="reveal-up">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-4 py-2 text-sm font-medium text-sky-700 shadow-sm backdrop-blur">
                <School className="h-4 w-4" />
                Smart Coaching System
              </div>

              <h1 className="mt-6 max-w-xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Manage Students, Teachers & Exams Easily
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
                A modern coaching platform that keeps admissions, attendance, fee collection, parent communication, and reporting in one place.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
<Button asChild className="rounded-full bg-gradient-to-r from-sky-600 to-slate-900 px-6 py-6 text-white shadow-lg shadow-sky-500/25 hover:from-sky-700 hover:to-slate-950 transition-all duration-300 ease-in-out hover:scale-[1.05] active:scale-[0.97] focus-visible:ring-4 ring-sky-500/50 shadow-depth glow-hover hover-lift hover:shadow-xl hover:brightness-[1.05] pulse-soft">
                  <Link href="/login">
                    Get Started
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
<Button asChild variant="outline" className="rounded-full border-slate-300 bg-white px-6 py-6 text-slate-700 hover:bg-slate-50 transition-all duration-300 ease-in-out hover:scale-[1.05] active:scale-[0.97] focus-visible:ring-4 ring-sky-500/50 shadow-depth glow-hover hover-lift hover:shadow-lg hover:brightness-[1.05]">
                  <Link href="#features">
                    <Play className="h-4 w-4" />
                    Watch Demo
                  </Link>
                </Button>
              </div>

              <div className="mt-10 grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4">
                {statistics.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur">
                    <div className="text-2xl font-bold text-slate-950">{stat.value}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-500">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div
              ref={heroTilt.ref}
              onMouseMove={heroTilt.handleMouseMove}
              onMouseLeave={heroTilt.handleMouseLeave}
              className="hero-scene relative mx-auto w-full max-w-[620px] transition-transform duration-200 ease-out"
              style={{
                transform: `perspective(1400px) rotateX(${heroTilt.rotateX}deg) rotateY(${heroTilt.rotateY}deg) translateZ(0)`,
                willChange: "transform",
              }}
            >
              <div className="hero-glow absolute inset-0 rounded-[2.5rem] bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.35),_transparent_50%),radial-gradient(circle_at_bottom,_rgba(15,23,42,0.2),_transparent_38%)] blur-3xl" />

              <div className="relative overflow-hidden rounded-[2.5rem] border border-white/70 bg-white/60 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.14)] backdrop-blur-2xl">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.03)_1px,transparent_1px)] bg-[size:28px_28px] opacity-40" />
                <div className="absolute -left-6 top-10 h-28 w-28 rounded-full bg-sky-400/20 blur-3xl hero-float" />
                <div className="absolute -right-8 bottom-8 h-32 w-32 rounded-full bg-slate-900/15 blur-3xl hero-float" style={{ animationDelay: "1.4s" }} />
                <div className="hero-enter hero-enter-1 absolute left-1/2 top-3 h-40 w-40 -translate-x-1/2 rounded-full border border-sky-200/60" style={{ animation: "heroDepthIn 0.85s cubic-bezier(0.16, 1, 0.3, 1) forwards 0.1s, spin 16s linear infinite 0.95s" }} />
                <div className="hero-enter hero-enter-2 absolute left-1/2 top-3 h-32 w-32 -translate-x-1/2 rounded-full border border-slate-300/70" style={{ animation: "heroDepthIn 0.85s cubic-bezier(0.16, 1, 0.3, 1) forwards 0.22s, spin 11s linear infinite reverse 1.05s" }} />

                <div className="relative h-[420px] preserve-3d">
                  {/* <div
                    className="hero-enter-float absolute left-6 top-14 z-30 flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-200/70 bg-sky-100/80 shadow-xl"
                    style={{
                      "--hero-enter-delay": "0.30s",
                      transform: `translateZ(140px) translateX(${heroTilt.rotateY * 1.1}px) translateY(${heroTilt.rotateX * -0.9}px)`,
                    }}
                  >
                    <BookOpen className="h-7 w-7 text-sky-700" />
                  </div> */}

                  {/* <div
                    className="hero-enter-float absolute right-7 top-20 z-30 flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-200/70 bg-emerald-100/80 shadow-xl"
                    style={{
                      "--hero-enter-delay": "0.52s",
                      transform: `translateZ(115px) translateX(${heroTilt.rotateY * -0.8}px) translateY(${heroTilt.rotateX * 0.7}px)`,
                    }}
                  >
                    <Bell className="h-6 w-6 text-emerald-700 Coaching-bell-ring" />
                  </div> */}

                  {/* <div
                    className="hero-enter-float absolute left-10 bottom-24 z-30 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-200/70 bg-amber-100/80 shadow-xl"
                    style={{
                      "--hero-enter-delay": "0.64s",
                      transform: `translateZ(120px) translateX(${heroTilt.rotateY * 0.8}px) translateY(${heroTilt.rotateX * -0.65}px)`,
                    }}
                  >
                    <GraduationCap className="h-7 w-7 text-amber-700" />
                  </div> */}

                  {/* <div
                    className="hero-enter-float absolute right-12 bottom-20 z-30 flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-200/70 bg-indigo-100/80 shadow-xl"
                    style={{
                      "--hero-enter-delay": "0.74s",
                      transform: `translateZ(118px) translateX(${heroTilt.rotateY * -0.7}px) translateY(${heroTilt.rotateX * 0.8}px)`,
                    }}
                  >
                    <Calendar className="h-7 w-7 text-indigo-700" />
                  </div> */}

                  <div
                    className="hero-enter absolute left-6 top-0 z-20 w-44 rounded-2xl border border-white/80 bg-white/90 p-4 shadow-xl backdrop-blur-lg"
                    style={{
                      "--hero-enter-delay": "0.54s",
                      transform: `translateZ(102px) translateX(${heroTilt.rotateY * 0.95}px) translateY(${heroTilt.rotateX * -0.8}px)`,
                    }}
                  >
                    <p className="text-xs uppercase tracking-[0.28em] text-sky-600">Attendance</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">QR Attendence system</p>
                  </div>

                  <div
                    className="hero-enter absolute right-5 top-0 z-20 w-44 rounded-2xl border border-white/80 bg-white/90 p-4 shadow-xl backdrop-blur-lg"
                    style={{
                      "--hero-enter-delay": "0.64s",
                      transform: `translateZ(108px) translateX(${heroTilt.rotateY * -0.9}px) translateY(${heroTilt.rotateX * 0.75}px)`,
                    }}
                  >
                    <p className="text-xs uppercase tracking-[0.28em] text-indigo-600">Exams</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">Auto schedule and marks flow</p>
                  </div>

                  <div
                    className="hero-enter absolute left-8 bottom-12 z-20 w-44 rounded-2xl border border-white/80 bg-white/90 p-4 shadow-xl backdrop-blur-lg"
                    style={{
                      "--hero-enter-delay": "0.74s",
                      transform: `translateZ(100px) translateX(${heroTilt.rotateY * 0.7}px) translateY(${heroTilt.rotateX * -0.7}px)`,
                    }}
                  >
                    <p className="text-xs uppercase tracking-[0.28em] text-emerald-600">Parent Portal</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">Daily notices and fee alerts</p>
                  </div>

                  <div
                    className="hero-enter absolute right-8 bottom-10 z-20 w-44 rounded-2xl border border-white/80 bg-white/90 p-4 shadow-xl backdrop-blur-lg"
                    style={{
                      "--hero-enter-delay": "0.82s",
                      transform: `translateZ(106px) translateX(${heroTilt.rotateY * -0.8}px) translateY(${heroTilt.rotateX * 0.8}px)`,
                    }}
                  >
                    <p className="text-xs uppercase tracking-[0.28em] text-amber-600">Analytics</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">Class trends in one dashboard</p>
                  </div>

                  <div className="hero-enter coaching-route absolute bottom-3 left-10 right-10 z-30" style={{ "--hero-enter-delay": "0.96s" }}>
                    <div className="coaching-route__road" />
                    <div className="coaching-route__bus">
                      <School className="h-4 w-4 text-white" />
                    </div>
                  </div>

                  <div className="hero-enter hero-enter-2 hero-scene__building absolute inset-0 flex items-center justify-center">
                    <div className="relative h-[300px] w-[320px]">
                      <div className="absolute left-1/2 top-0 h-14 w-56 -translate-x-1/2 rounded-t-[2rem] bg-gradient-to-r from-slate-900 via-blue-800 to-cyan-600 shadow-2xl" />
                      <div className="absolute left-1/2 top-12 h-[220px] w-56 -translate-x-1/2 rounded-[2rem] border border-white/70 bg-gradient-to-b from-white via-sky-50 to-emerald-50 shadow-[0_35px_80px_rgba(14,165,233,0.22)]">
                        <div className="absolute inset-x-6 top-6 grid grid-cols-3 gap-3">
                          {Array.from({ length: 9 }).map((_, index) => (
                            <div key={index} className="h-10 rounded-xl bg-sky-200/70 shadow-inner" />
                          ))}
                        </div>
                        <div className="absolute bottom-4 left-1/2 flex h-14 w-20 -translate-x-1/2 items-center justify-center rounded-t-2xl bg-slate-900/90 text-white shadow-lg">
                          <GraduationCap className="h-8 w-8" />
                        </div>
                        <div className="absolute bottom-0 left-1/2 h-7 w-40 -translate-x-1/2 rounded-t-full bg-emerald-500/30 blur-2xl" />
                      </div>
                      <div className="absolute left-4 top-[5.5rem] h-40 w-12 rounded-[1.25rem] bg-gradient-to-b from-indigo-800 to-sky-600 shadow-xl" />
                      <div className="absolute right-4 top-20 h-[9.5rem] w-14 rounded-[1.35rem] bg-gradient-to-b from-sky-700 to-indigo-900 shadow-xl" />
                      <div className="absolute left-1/2 top-[210px] flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/80 bg-white/90 px-4 py-2 shadow-lg">
                        <Sparkles className="h-4 w-4 text-sky-600" />
                        <span className="text-sm font-medium text-slate-700">Connected coaching campus</span>
                      </div>

                      <div className="coaching-clock absolute -right-5 top-10 flex h-16 w-16 items-center justify-center rounded-full border-4 border-white/80 bg-slate-900 text-white shadow-xl">
                        <div className="coaching-clock__center" />
                        <div className="coaching-clock__hand coaching-clock__hand--hour" />
                        <div className="coaching-clock__hand coaching-clock__hand--minute" />
                      </div>
                    </div>
                  </div>

                  <div className="absolute left-1/2 top-0 h-full w-full -translate-x-1/2 rounded-full border border-dashed border-sky-200/70 opacity-70" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section ref={aboutRef} id="about" className="scroll-section py-24 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="About Us"
              title="About Our Coaching System"
              description="A focused coaching management platform built to support modern teaching, clear communication, and reliable administration."
            />

            <div className="mt-12 grid gap-8 lg:grid-cols-2">
              <Card className="border-white/70 bg-white/90 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-2xl text-slate-950">Mission and vision</CardTitle>
                  <CardDescription className="text-base text-slate-600">
                    We simplify coaching operations so educators can focus on learning outcomes instead of repetitive paperwork.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {aboutBullets.map((bullet) => (
                    <div key={bullet} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                      <CheckCircle className="mt-0.5 h-5 w-5 text-emerald-600" />
                      <p className="text-sm leading-6 text-slate-700">{bullet}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-white/70 bg-gradient-to-br from-sky-50 via-white to-indigo-50 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
                <CardHeader>
                  <CardTitle className="text-2xl text-slate-950">Modern education system</CardTitle>
                  <CardDescription className="text-base text-slate-600">
                    Designed for transparency, speed, and better communication with every stakeholder.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {[
                      { icon: ShieldCheck, label: "Digital Attendance" },
                      { icon: MessageSquare, label: "Parent Alerts" },
                      { icon: BarChart3, label: "Smart Reporting" },
                      { icon: BookOpen, label: "Academic Tracking" },
                    ].map((item) => (
                      <div key={item.label} className="rounded-2xl border border-white/70 bg-white/90 p-5 shadow-sm">
                        <item.icon className="h-6 w-6 text-sky-600" />
                        <p className="mt-3 text-sm font-semibold text-slate-900">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section ref={featuresRef} id="features" className="scroll-section border-y border-slate-100 bg-slate-50/70 py-24 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Why Choose Us"
              title="Features built for daily coaching operations"
              description="Every feature is designed to reduce manual effort and make the coaching experience simpler for staff and families."
            />

            <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {features.map((feature) => (
                <Card key={feature.title} className="group border-white/70 bg-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_26px_60px_rgba(15,23,42,0.12)]">
                  <CardHeader>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-600 to-indigo-600 text-white shadow-lg shadow-sky-500/25 transition-transform group-hover:scale-105">
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="mt-4 text-xl text-slate-950">{feature.title}</CardTitle>
                    <CardDescription className="text-base leading-7 text-slate-600">{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section ref={statsRef} className="scroll-section py-24 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Statistics"
              title="Live coaching numbers that matter"
              description="The dashboard keeps parents and administrators informed with simple numbers that are easy to scan."
              align="center"
            />

            <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {statistics.map((stat) => (
                <Card key={stat.label} className="border-white/70 bg-white/90 text-center shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
                  <CardContent className="p-8">
                    <AnimatedCounter endVal={stat.value.replace(/[\+%]/g, '')} suffix={stat.value.includes('+') ? '+' : stat.value.includes('%') ? '%' : ''} isVisible={statsVisible} />
                    <p className="mt-3 text-sm uppercase tracking-[0.24em] text-slate-500">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section ref={achieversRef} className="scroll-section py-24 lg:py-28 bg-slate-50/60 border-y border-slate-100">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Top Students"
              title="Top Students and achievers"
              description="Celebrate performance, behavior, and growth with a clean student spotlight area."
            />

            <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-3">
              {achievers.map((student) => (
                <Card key={student.name} className="border-white/70 bg-white/95 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden max-w-md mx-auto">
                  <CardContent className="p-8 text-center space-y-6">
                    {/* Circle Image */}
                    <div className="relative mx-auto">
                      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-3xl font-bold text-white shadow-2xl border-4 border-white/50 ring-4 ring-sky-100/50 mx-auto">
                        {student.initials}
                      </div>
                      {/* Photo overlay if available */}
                      {student.photo && (
                        <Image 
                          src={student.photo} 
                          alt={student.name} 
                          width={128} 
                          height={128} 
                          className="absolute inset-0 w-32 h-32 rounded-full object-cover -z-10 opacity-20"
                        />
                      )}
                    </div>
                    
                    {/* Name and Grade */}
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold text-slate-900">{student.name}</h3>
                      <p className="text-sm text-slate-500 uppercase tracking-wide">{student.grade}</p>
                    </div>
                    
                    {/* Percentage with Progress */}
                    <div className="space-y-2">
                      <div className="flex items-baseline justify-between">
                        <span className="text-3xl font-black text-emerald-600">{student.percentage}%</span>
                        <span className="text-xs uppercase tracking-wider text-slate-500">Overall</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-emerald-500 to-green-600 h-3 rounded-full shadow-md transition-all duration-1000"
                          style={{width: `${student.percentage}%`}}
                        />
                      </div>
                    </div>
                    
                    {/* Description */}
                    <p className="text-sm text-slate-600 italic leading-relaxed">{student.description}</p>
                    
                    {/* Achievement Badge */}
                    <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2 text-xs font-bold text-white shadow-lg">
                      <Award className="h-4 w-4" />
                      {student.achievement}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section ref={admissionsRef} id="admissions" className="scroll-section py-24 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Admissions"
              title="Admissions made simple"
              description="Give families a clear path from inquiry to enrollment with a short, confidence-building process."
            />

            <div className="mt-12 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
              <Card className="border-white/70 bg-gradient-to-br from-sky-600 via-blue-600 to-indigo-700 text-white shadow-[0_30px_80px_rgba(37,99,235,0.28)]">
                <CardHeader>
                  <CardTitle className="text-2xl text-white">Admissions open for 2026</CardTitle>
                  <CardDescription className="text-base text-sky-100">
                    Start the process now and secure a place in a connected coaching environment built for the future.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    {admissionsSteps.map((step) => (
                      <div key={step.step} className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
                        <p className="text-sm font-semibold tracking-[0.24em] text-sky-100">{step.step}</p>
                        <h3 className="mt-3 text-lg font-bold text-white">{step.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-sky-50">{step.text}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 flex flex-wrap gap-4">
<Button asChild className="rounded-full bg-white px-6 py-6 text-slate-900 hover:bg-slate-100 transition-all duration-300 ease-in-out hover:scale-[1.05] active:scale-[0.97] focus-visible:ring-4 ring-sky-500/50 shadow-depth glow-hover hover-lift hover:shadow-xl hover:brightness-[1.05] pulse-soft">
                      <Link href="#contact">
                        Contact Admissions
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
<Button asChild variant="ghost" className="rounded-full border-white/30 bg-transparent px-6 py-6 text-white hover:bg-white/10 transition-all duration-300 ease-in-out hover:scale-[1.05] active:scale-[0.97] focus-visible:ring-4 ring-sky-500/50 shadow-depth glow-hover hover-lift hover:shadow-lg hover:brightness-[1.05]">
                      <Link href="#about">View Coaching Details</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/70 bg-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
                <CardHeader>
                  <CardTitle className="text-2xl text-slate-950">Announcements</CardTitle>
                  <CardDescription className="text-base text-slate-600">Latest news and coaching updates</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {announcements.map((item, index) => (
                    <div key={item} className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                        <Bell className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-950">{item}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-500">Announcement {index + 1}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section ref={testimonialsRef} className="scroll-section py-24 lg:py-28 bg-slate-50/60 border-y border-slate-100">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Testimonials"
              title="What parents say"
              description="A trustworthy system is built on clear communication and a calm daily experience."
              align="center"
            />

              <TestimonialsSlider />
          </div>
        </section>

        <section ref={galleryRef} className="scroll-section py-24 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Gallery"
              title="Coaching life gallery"
              description="Use this section to showcase a vibrant campus, activity spaces, and memorable moments."
            />

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {gallery.map((item, index) => (
                <div
                  key={item}
                  className="group relative aspect-[4/3] overflow-hidden rounded-3xl border border-white/70 bg-gradient-to-br from-sky-500 via-indigo-500 to-emerald-500 shadow-[0_18px_40px_rgba(15,23,42,0.12)]"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.35),_transparent_40%)]" />
                  <div className="absolute inset-0 flex items-center justify-center text-white/90">
                    <Camera className="h-14 w-14 transition-transform group-hover:scale-110" />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/75 to-transparent p-5 text-white">
                    <p className="text-sm font-semibold">{item}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.24em] text-sky-100">Photo {index + 1}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section ref={blogsRef} className="scroll-section py-24 lg:py-28 bg-slate-50/60 border-y border-slate-100">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Blog"
              title="Latest blogs"
              description="Share short insights, updates, and educational content that keeps your audience engaged."
            />

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {blogs.map((post) => (
                <Card key={post.title} className="border-white/70 bg-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
                  <CardHeader>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-600 to-indigo-600 text-white shadow-lg shadow-sky-500/25">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <CardTitle className="mt-4 text-xl text-slate-950">{post.title}</CardTitle>
                    <CardDescription className="text-base leading-7 text-slate-600">{post.preview}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section ref={contactRef} id="contact" className="scroll-section py-24 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Contact"
              title="Contact us"
              description="Reach out with questions about admissions, coaching operations, or platform support."
            />

            <div className="mt-12 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
              <Card className="border-white/70 bg-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
                <CardHeader>
                  <CardTitle className="text-2xl text-slate-950">Send a message</CardTitle>
                  <CardDescription className="text-base text-slate-600">We usually reply within one working day.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="grid gap-4" onSubmit={handleContactSubmit}>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <input
                        type="text"
                        placeholder="Name"
                        value={contactForm.name}
                        onChange={(event) => setContactForm((current) => ({ ...current, name: event.target.value }))}
                        className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-sky-400 focus:bg-white"
                      />
                      <input
                        type="email"
                        placeholder="Email"
                        value={contactForm.email}
                        onChange={(event) => setContactForm((current) => ({ ...current, email: event.target.value }))}
                        className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-sky-400 focus:bg-white"
                      />
                    </div>
                    <textarea
                      rows="6"
                      placeholder="Message"
                      value={contactForm.message}
                      onChange={(event) => setContactForm((current) => ({ ...current, message: event.target.value }))}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:bg-white"
                    />
<Button className="w-fit rounded-full bg-gradient-to-r from-sky-600 to-indigo-600 px-6 py-6 text-white shadow-lg shadow-sky-500/25 hover:from-sky-700 hover:to-indigo-700 transition-all duration-300 ease-in-out hover:scale-[1.05] active:scale-[0.97] focus-visible:ring-4 ring-sky-500/50 shadow-depth glow-hover hover-lift hover:shadow-xl hover:brightness-[1.05] pulse-soft">
                      Send Message
                    </Button>
                    {formStatus ? (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                        {formStatus}
                      </div>
                    ) : null}
                  </form>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="border-white/70 bg-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
                  <CardHeader>
                    <CardTitle className="text-2xl text-slate-950">Address</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm text-slate-600">
                    <p className="flex items-start gap-3">
                      <MapPin className="mt-0.5 h-5 w-5 text-sky-600" />
                      <span>C-26, Block I, Behind Imam Clinic, North Nazimabad, Karachi, Pakistan</span>
                    </p>
                    <p className="flex items-start gap-3">
                      <Phone className="mt-0.5 h-5 w-5 text-sky-600" />
                      <span>0333 2564886</span>
                    </p>
                    <p className="flex items-start gap-3">
                      <Mail className="mt-0.5 h-5 w-5 text-sky-600" />
                      <span>adamjeecampus12@gmail.com</span>
                    </p>
                    <p className="flex items-start gap-3">
                      <MessageSquare className="mt-0.5 h-5 w-5 text-sky-600" />
                      <span>Call for campus visits, admissions help, or system support.</span>
                    </p>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden border-white/70 bg-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
                  <CardHeader>
                    <CardTitle className="text-2xl text-slate-950">Map</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <iframe
                      title="Coaching location map"
                      src="https://www.google.com/maps?q=C-26%2C%20Block%20I%2C%20Behind%20Imam%20Clinic%2C%20North%20Nazimabad%2C%20Karachi%2C%20Pakistan&output=embed"
                      className="h-80 w-full border-0"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}