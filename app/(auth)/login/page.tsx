// ================================================================
// PAGE NAME  : Master Unified Auth Page — Kiro-Maal Real Estate
// ROUTE      : /login and /register
// PALETTE    : Deep Navy (#07111F), Luxury Gold (#C89B3C), Cream (#F7F3EA)
// DESCRIPTION: Master reference design system for authentication.
//              Ultra-compact, all elements 100% visible on any screen.
//              Never cuts off submit button or links.
//              All auth & register logic 100% preserved.
// ================================================================
"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  Sparkles,
  Home,
  BarChart3,
  Briefcase,
  ChevronRight,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

interface AuthPageProps {
  initialTab?: "login" | "register";
}

function AuthContent({ initialTab = "login" }: AuthPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Tab mode: "login" or "register"
  const [tab, setTab] = useState<"login" | "register">(initialTab);

  // Sync tab with URL query if provided
  useEffect(() => {
    const tabParam = searchParams?.get("tab");
    if (tabParam === "register") {
      setTab("register");
    } else if (tabParam === "login") {
      setTab("login");
    }
  }, [searchParams]);

  const switchTab = (newTab: "login" | "register") => {
    setTab(newTab);
    if (typeof window !== "undefined") {
      const url = newTab === "register" ? "/login?tab=register" : "/login";
      window.history.replaceState(null, "", url);
    }
  };

  // Login form state
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form state
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [registerLoading, setRegisterLoading] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }
    setLoginLoading(true);
    try {
      const result = await signIn("credentials", {
        email: loginForm.email,
        password: loginForm.password,
        redirect: false,
      });

      if (result?.error) {
        toast({
          title: "Login failed",
          description: "Invalid email or password.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Welcome back! 👋",
          description: "Logged in successfully.",
          variant: "success",
        } as any);

        const sessionRes = await fetch("/api/auth/session");
        const sessionData = await sessionRes.json();
        const userRole = sessionData?.user?.role;

        router.refresh();
        if (userRole === "ADMIN") {
          router.push("/admin");
        } else if (userRole === "CUSTOMER") {
          router.push("/customer");
        } else {
          router.push("/dashboard");
        }
      }
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Register Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerForm.name || !registerForm.email || !registerForm.password) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    if (registerForm.password.length < 8) {
      toast({
        title: "Weak password",
        description: "Password must be at least 8 characters.",
        variant: "destructive",
      });
      return;
    }
    setRegisterLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerForm),
      });
      const data = await res.json();
      if (!data.success) {
        toast({
          title: "Registration failed",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      // Automatically sign in upon registration
      await signIn("credentials", {
        email: registerForm.email,
        password: registerForm.password,
        redirect: false,
      });

      toast({
        title: "Account created! 🎉",
        description: "Welcome to Kiro-Maal Real Estate.",
        variant: "success",
      } as any);

      router.refresh();
      router.push("/customer");
    } catch {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div className="min-h-screen lg:h-screen w-full flex flex-col lg:flex-row relative bg-[#07111F] overflow-x-hidden font-sans">
      {/* ─────────────────────────────────────────────────────────────
          LEFT PANEL: Dark Luxury Twilight Villa & AI Features
          ───────────────────────────────────────────────────────────── */}
      <div className="relative w-full lg:w-[52%] min-h-[440px] lg:h-screen flex flex-col justify-between p-4 sm:p-6 lg:p-7 xl:p-8 overflow-hidden z-0">
        {/* Background Villa Image with Twilight Ambience */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/luxury_villa_twilight.jpg"
            alt="Luxury Villa at Twilight"
            fill
            priority
            className="object-cover object-center"
          />
          {/* Deep Navy Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#07111F]/95 via-[#0B1728]/85 to-[#07111F]/70" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#040E1B] via-transparent to-[#07111F]/80" />
        </div>

        {/* ─── Top: Kiro-Maal Dark Logo (Clean Blend with mix-blend-screen) ─── */}
        <div className="relative z-20 shrink-0">
          <Link href="/" className="inline-block group">
            <div className="w-40 h-14 sm:w-48 sm:h-16 relative transition-transform duration-200 group-hover:scale-105 mix-blend-screen">
              <Image
                src="/images/kiro_maal_logo_dark.png"
                alt="Kiro-Maal Real Estate"
                fill
                className="object-contain object-left mix-blend-screen"
                priority
              />
            </div>
          </Link>

          {/* Badges Stack */}
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#0B1728]/90 border border-[#C89B3C]/40 text-[#D9B45B] text-[10px] font-semibold shadow-xs backdrop-blur-md">
              <Sparkles className="w-2.5 h-2.5 text-[#C89B3C]" />
              Smart Property Search
            </div>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#0B1728]/90 border border-[#C89B3C]/40 text-[#D9B45B] text-[10px] font-semibold shadow-xs backdrop-blur-md">
              <Sparkles className="w-2.5 h-2.5 text-[#C89B3C]" />
              Next-Gen Real Estate AI
              <Sparkles className="w-2.5 h-2.5 text-[#C89B3C]" />
            </div>
          </div>
        </div>

        {/* ─── Middle: Headline, Description & 4 Feature Cards (Compacted) ─── */}
        <div className="relative z-20 my-auto py-2 max-w-xl shrink-0">
          <h1 className="text-xl sm:text-2xl xl:text-3xl font-extrabold text-white tracking-tight leading-tight">
            {tab === "login" ? (
              <>
                Smart Property Search <br />
                <span className="bg-gradient-to-r from-[#D9B45B] via-[#C89B3C] to-[#E8B849] bg-clip-text text-transparent">
                  Powered by AI
                </span>
              </>
            ) : (
              <>
                Join Somalia&apos;s #1 <br />
                <span className="bg-gradient-to-r from-[#D9B45B] via-[#C89B3C] to-[#E8B849] bg-clip-text text-transparent">
                  Luxury Property Network
                </span>
              </>
            )}
          </h1>

          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mt-1.5 mb-2.5 max-w-md font-normal">
            {tab === "login"
              ? "Get personalized recommendations, predict prices, and chat with our AI assistant to find your perfect property in Somalia."
              : "Create your free client account to access verified properties, save favorites, and receive real-time AI valuation alerts."}
          </p>

          {/* 4 Feature Cards */}
          <div className="space-y-1.5">
            {[
              {
                icon: Home,
                text: "Browse 55+ verified properties across Somalia",
              },
              {
                icon: Sparkles,
                text: "AI-powered recommendations tailored to your budget",
              },
              {
                icon: BarChart3,
                text: "ML price prediction with confidence score",
              },
              {
                icon: Briefcase,
                text: "24/7 conversational AI assistant for instant answers",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="group flex items-center justify-between gap-3 bg-[#0B1728]/80 hover:bg-[#0E1C2E]/95 backdrop-blur-md border border-[#C89B3C]/30 hover:border-[#C89B3C]/60 rounded-xl px-3 py-1.5 shadow-xs transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#C89B3C]/15 border border-[#C89B3C]/40 text-[#D9B45B] flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-[#C89B3C]/25 transition-all">
                    <item.icon className="w-3 h-3" />
                  </div>
                  <span className="text-xs font-medium text-slate-100 group-hover:text-white line-clamp-1">
                    {item.text}
                  </span>
                </div>
                <ChevronRight className="w-3 h-3 text-[#D9B45B] group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* ─── Bottom: Copyright ─── */}
        <div className="relative z-20 flex items-center gap-2 text-[10px] text-slate-400 pt-1 shrink-0">
          <div className="w-3.5 h-3.5 rounded-full border border-slate-600/80 flex items-center justify-center text-slate-400">
            <Zap className="w-2 h-2 text-[#D9B45B]" />
          </div>
          <span>© 2026 Kiro-Maal Real Estate. All rights reserved.</span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          RIGHT PANEL: Warm Cream Luxury Backdrop & Floating Card
          ───────────────────────────────────────────────────────────── */}
      <div className="relative w-full lg:w-[48%] min-h-[500px] lg:h-screen flex items-center justify-center p-3 sm:p-5 lg:p-6 z-10 bg-[#F7F3EA] overflow-y-auto scrollbar-hide">
        {/* Soft Modern Architectural Backdrop */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <Image
            src="/images/bright_luxury_cityscape.jpg"
            alt="Cityscape"
            fill
            className="object-cover object-center opacity-25 blur-[1px]"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#F7F3EA]/95 via-[#FAF6ED]/90 to-[#EFE8DC]/85" />

          {/* Curved Gold Swoosh Divider on Desktop */}
          <div className="hidden lg:block absolute -left-20 top-0 bottom-0 w-32 pointer-events-none">
            <svg
              className="h-full w-full"
              viewBox="0 0 100 1000"
              preserveAspectRatio="none"
              fill="none"
            >
              <path
                d="M 100 0 C 25 300, 15 650, 100 1000 L 100 0 Z"
                fill="#F7F3EA"
              />
              <path
                d="M 100 0 C 25 300, 15 650, 100 1000"
                stroke="#C89B3C"
                strokeWidth="3"
                className="opacity-80"
                style={{ filter: "drop-shadow(0 0 12px rgba(200,155,60,0.6))" }}
              />
            </svg>
          </div>
        </div>

        {/* ─── Centered Unified Glass Card (Ultra-Compact, Guaranteed Full Visibility) ─── */}
        <div className="relative z-20 w-full max-w-[400px] my-auto py-2">
          <div className="bg-[#FCFBF7]/95 backdrop-blur-xl rounded-[24px] border border-[#E8E1D4] p-4 sm:p-5 shadow-[0_15px_40px_-15px_rgba(200,155,60,0.18)] transition-all">
            {/* Centered Kiro-Maal Logo Header */}
            <div className="flex items-center justify-center gap-2.5 mb-2.5">
              <div className="w-9 h-9 relative shrink-0">
                <Image
                  src="/images/kiro_maal_logo.png"
                  alt="Kiro-Maal Real Estate"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div className="leading-tight text-left">
                <h2 className="font-extrabold text-lg text-[#C89B3C] font-serif leading-none">
                  Kiro-Maal
                </h2>
                <span className="text-[8px] font-bold text-slate-700 tracking-[0.16em] uppercase">
                  Real Estate
                </span>
              </div>
            </div>

            {/* ─── Interactive Segmented Pill Switcher ─── */}
            <div className="flex p-0.5 bg-[#F1ECE1] rounded-xl border border-[#E8E1D4] mb-2.5">
              <button
                type="button"
                onClick={() => switchTab("login")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${
                  tab === "login"
                    ? "bg-[#07111F] text-[#D9B45B] shadow-sm border border-[#C89B3C]/30"
                    : "text-[#6B7280] hover:text-[#07111F]"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => switchTab("register")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${
                  tab === "register"
                    ? "bg-[#07111F] text-[#D9B45B] shadow-sm border border-[#C89B3C]/30"
                    : "text-[#6B7280] hover:text-[#07111F]"
                }`}
              >
                Create Account
              </button>
            </div>

            {/* ─────────────────────────────────────────────────────────
                TAB 1: SIGN IN FORM
                ───────────────────────────────────────────────────────── */}
            {tab === "login" && (
              <div>
                <form onSubmit={handleLoginSubmit} className="space-y-2.5">
                  {/* Email field */}
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="login-email"
                      className="text-[11px] font-bold text-[#07111F]"
                    >
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#A97918]" />
                      <Input
                        id="login-email"
                        name="email"
                        type="email"
                        value={loginForm.email}
                        onChange={(e) =>
                          setLoginForm((p) => ({ ...p, email: e.target.value }))
                        }
                        placeholder="you@example.com"
                        className="pl-9 h-9 bg-white border-[#E8E1D4] text-[#07111F] placeholder:text-[#9CA3AF] focus:border-[#C89B3C] focus:ring-2 focus:ring-[#C89B3C]/20 rounded-xl text-xs transition-all"
                        required
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  {/* Password field */}
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="login-password"
                        className="text-[11px] font-bold text-[#07111F]"
                      >
                        Password
                      </Label>
                      <Link
                        href="#"
                        className="text-[10px] text-[#C89B3C] hover:text-[#A97918] font-bold transition-colors"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#A97918]" />
                      <Input
                        id="login-password"
                        name="password"
                        type={showLoginPassword ? "text" : "password"}
                        value={loginForm.password}
                        onChange={(e) =>
                          setLoginForm((p) => ({
                            ...p,
                            password: e.target.value,
                          }))
                        }
                        placeholder="Enter your password"
                        className="pl-9 pr-9 h-9 bg-white border-[#E8E1D4] text-[#07111F] placeholder:text-[#9CA3AF] focus:border-[#C89B3C] focus:ring-2 focus:ring-[#C89B3C]/20 rounded-xl text-xs transition-all"
                        required
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1"
                        onClick={() =>
                          setShowLoginPassword(!showLoginPassword)
                        }
                        aria-label={
                          showLoginPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showLoginPassword ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full h-9.5 bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] hover:opacity-95 text-[#07111F] font-bold rounded-xl text-xs gap-1.5 mt-1.5 shadow-md shadow-[#C89B3C]/20 border-0 transition-all cursor-pointer"
                    disabled={loginLoading}
                  >
                    {loginLoading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Signing in...
                      </>
                    ) : (
                      <>
                        Sign In <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </Button>
                </form>

                {/* Switch to Register link */}
                <p className="text-center text-[11px] text-[#6B7280] mt-2.5">
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => switchTab("register")}
                    className="text-[#C89B3C] font-bold hover:text-[#A97918] hover:underline cursor-pointer"
                  >
                    Create one free
                  </button>
                </p>
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────
                TAB 2: CREATE ACCOUNT FORM (Ultra-Compact & Fully Visible)
                ───────────────────────────────────────────────────────── */}
            {tab === "register" && (
              <div>
                <form onSubmit={handleRegisterSubmit} className="space-y-2">
                  {/* Full Name */}
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="register-name"
                      className="text-[11px] font-bold text-[#07111F]"
                    >
                      Full Name <span className="text-[#991B1B]">*</span>
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#A97918]" />
                      <Input
                        id="register-name"
                        name="name"
                        value={registerForm.name}
                        onChange={(e) =>
                          setRegisterForm((p) => ({ ...p, name: e.target.value }))
                        }
                        placeholder="Ahmed Hassan"
                        className="pl-9 h-8.5 bg-white border-[#E8E1D4] text-[#07111F] placeholder:text-[#9CA3AF] focus:border-[#C89B3C] focus:ring-2 focus:ring-[#C89B3C]/20 rounded-xl text-xs transition-all"
                        required
                      />
                    </div>
                  </div>

                  {/* Email & Phone in clean 2-column or stacked */}
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="register-email"
                      className="text-[11px] font-bold text-[#07111F]"
                    >
                      Email Address <span className="text-[#991B1B]">*</span>
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#A97918]" />
                      <Input
                        id="register-email"
                        name="email"
                        type="email"
                        value={registerForm.email}
                        onChange={(e) =>
                          setRegisterForm((p) => ({
                            ...p,
                            email: e.target.value,
                          }))
                        }
                        placeholder="you@example.com"
                        className="pl-9 h-8.5 bg-white border-[#E8E1D4] text-[#07111F] placeholder:text-[#9CA3AF] focus:border-[#C89B3C] focus:ring-2 focus:ring-[#C89B3C]/20 rounded-xl text-xs transition-all"
                        required
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="register-phone"
                      className="text-[11px] font-bold text-[#07111F]"
                    >
                      Phone Number <span className="text-[#6B7280] font-normal text-[10px]">(optional)</span>
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#A97918]" />
                      <Input
                        id="register-phone"
                        name="phone"
                        type="tel"
                        value={registerForm.phone}
                        onChange={(e) =>
                          setRegisterForm((p) => ({
                            ...p,
                            phone: e.target.value,
                          }))
                        }
                        placeholder="+252 61 234 5678"
                        className="pl-9 h-8.5 bg-white border-[#E8E1D4] text-[#07111F] placeholder:text-[#9CA3AF] focus:border-[#C89B3C] focus:ring-2 focus:ring-[#C89B3C]/20 rounded-xl text-xs transition-all"
                      />
                    </div>
                  </div>

                  {/* Password field */}
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="register-password"
                      className="text-[11px] font-bold text-[#07111F]"
                    >
                      Password <span className="text-[#991B1B]">*</span>{" "}
                      <span className="text-[#6B7280] font-normal text-[10px]">(Min. 8 chars)</span>
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#A97918]" />
                      <Input
                        id="register-password"
                        name="password"
                        type={showRegisterPassword ? "text" : "password"}
                        value={registerForm.password}
                        onChange={(e) =>
                          setRegisterForm((p) => ({
                            ...p,
                            password: e.target.value,
                          }))
                        }
                        placeholder="At least 8 characters"
                        className="pl-9 pr-9 h-8.5 bg-white border-[#E8E1D4] text-[#07111F] placeholder:text-[#9CA3AF] focus:border-[#C89B3C] focus:ring-2 focus:ring-[#C89B3C]/20 rounded-xl text-xs transition-all"
                        required
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1"
                        onClick={() =>
                          setShowRegisterPassword(!showRegisterPassword)
                        }
                        aria-label={
                          showRegisterPassword
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        {showRegisterPassword ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full h-9.5 bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] hover:opacity-95 text-[#07111F] font-bold rounded-xl text-xs gap-1.5 mt-1 shadow-md shadow-[#C89B3C]/20 border-0 transition-all cursor-pointer"
                    disabled={registerLoading}
                  >
                    {registerLoading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Creating account...
                      </>
                    ) : (
                      <>
                        Create Account <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </Button>
                </form>

                {/* Switch to Login link */}
                <p className="text-center text-[11px] text-[#6B7280] mt-2">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => switchTab("login")}
                    className="text-[#C89B3C] font-bold hover:text-[#A97918] hover:underline cursor-pointer"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#07111F] flex items-center justify-center text-[#D9B45B]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <AuthContent initialTab="login" />
    </Suspense>
  );
}
