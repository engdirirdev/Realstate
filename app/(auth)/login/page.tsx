// ================================================================
// PAGE NAME  : Login Page
// ROUTE      : /login
// DESCRIPTION: User authentication — email/password credentials,
//              NextAuth v5 session, matching exact AI RealEstate design
// ================================================================
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Building2,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Lock,
  ArrowRight,
  Sparkles,
  Home,
  BarChart3,
  Briefcase,
  ChevronRight,
  Zap,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
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

        // Fetch session to determine role-based destination
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
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row relative bg-[#041724] overflow-x-hidden font-sans">
      {/* ─────────────────────────────────────────────────────────────
          LEFT PANEL: Dark Luxury Twilight Villa & AI Features
          ───────────────────────────────────────────────────────────── */}
      <div className="relative w-full lg:w-[54%] min-h-screen flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 overflow-hidden z-0">
        {/* Background Villa Image with Twilight Ambience */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/luxury_villa_twilight.jpg"
            alt="Luxury Villa at Twilight"
            fill
            priority
            className="object-cover object-center"
          />
          {/* Deep Navy/Teal Gradient Overlay to blend with design */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#031422]/95 via-[#041c2c]/85 to-[#041b2a]/70" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#020e17] via-transparent to-[#031522]/80" />
        </div>

        {/* High-Tech Glowing Orbits and Pin Marker */}
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
          {/* Cyan Glow Orbits */}
          <svg
            className="absolute top-1/4 right-[5%] w-[420px] h-[320px] opacity-60"
            viewBox="0 0 400 300"
            fill="none"
          >
            <path
              d="M 50 250 C 150 150, 280 80, 360 40"
              stroke="#22d3ee"
              strokeWidth="1.5"
              strokeDasharray="4 6"
              className="animate-pulse"
            />
            <path
              d="M 120 280 C 220 180, 310 110, 380 70"
              stroke="#2dd4bf"
              strokeWidth="1"
              opacity="0.4"
            />
          </svg>

          {/* Floating Glowing Geo Pin over Villa roof */}
          <div className="absolute top-[18%] right-[16%] hidden xl:flex flex-col items-center">
            <div className="relative flex items-center justify-center">
              <div className="absolute w-14 h-14 rounded-full bg-cyan-400/25 blur-md animate-ping" />
              <div className="w-12 h-12 rounded-full bg-[#03252d]/90 border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_25px_rgba(34,211,238,0.7)] backdrop-blur-sm">
                <Home className="w-5 h-5 text-cyan-200 fill-cyan-400/30" />
              </div>
              <div className="absolute -bottom-1.5 w-3 h-3 bg-cyan-400 rotate-45 transform" />
            </div>
            {/* Ripple halo on surface */}
            <div className="w-20 h-2 bg-cyan-400/20 blur-sm rounded-full mt-3" />
          </div>
        </div>

        {/* ─── Top: Logo & Badge ─── */}
        <div className="relative z-20">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00c98d] to-[#009b6b] flex items-center justify-center shadow-lg shadow-emerald-900/40 group-hover:scale-105 transition-transform duration-200">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl text-white tracking-tight leading-snug">
                AI RealEstate
              </span>
              <span className="text-[11px] text-[#2dd4bf] font-semibold tracking-wide">
                Smart Property Search
              </span>
            </div>
          </Link>

          {/* Tag Pill */}
          <div className="mt-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#03292e]/80 border border-teal-500/40 text-teal-300 text-xs font-medium shadow-[0_0_15px_rgba(20,184,166,0.15)] backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              Next-Gen Real Estate AI
            </div>
          </div>
        </div>

        {/* ─── Middle: Headline, Description & 4 Interactive Cards ─── */}
        <div className="relative z-20 my-auto py-8 max-w-xl">
          <h1 className="text-3xl sm:text-4xl xl:text-5xl font-extrabold text-white tracking-tight leading-[1.12]">
            Smart Property Search <br />
            <span className="bg-gradient-to-r from-[#38bdf8] via-[#2dd4bf] to-[#34d399] bg-clip-text text-transparent">
              Powered by AI
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mt-4 mb-7 max-w-lg font-normal">
            Get personalized recommendations, predict prices, and chat with our AI
            assistant to find your perfect property in Somalia.
          </p>

          {/* 4 Feature Items */}
          <div className="space-y-3">
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
                className="group flex items-center justify-between gap-4 bg-[#081e2e]/70 hover:bg-[#0b283d]/90 backdrop-blur-md border border-slate-700/60 hover:border-teal-500/50 rounded-2xl px-4 py-3 shadow-sm transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-950/70 border border-teal-500/30 text-teal-400 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:border-teal-400/60 transition-all">
                    <item.icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-slate-100 group-hover:text-white">
                    {item.text}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-teal-400/80 group-hover:text-teal-300 group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* ─── Bottom: Copyright Footer ─── */}
        <div className="relative z-20 flex items-center gap-2.5 text-xs text-slate-400 pt-4">
          <div className="w-5 h-5 rounded-full border border-slate-600/80 flex items-center justify-center text-slate-400">
            <Zap className="w-3 h-3" />
          </div>
          <span>© 2026 AI RealEstate. All rights reserved.</span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          RIGHT PANEL: High-Tech Bright Ambience & Curved Divider
          ───────────────────────────────────────────────────────────── */}
      <div className="relative w-full lg:w-[46%] min-h-screen flex items-center justify-center p-6 sm:p-10 lg:p-12 z-10 bg-[#f4f9f8]">
        {/* Soft high-key modern architectural background */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <Image
            src="/images/bright_luxury_cityscape.jpg"
            alt="Bright Luxury Cityscape"
            fill
            className="object-cover object-center opacity-30 blur-[2px]"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-[#f0f8f7]/90 to-[#e4f3f0]/85" />

          {/* Curved swoosh divider on desktop */}
          <div className="hidden lg:block absolute -left-20 top-0 bottom-0 w-32 pointer-events-none">
            <svg
              className="h-full w-full"
              viewBox="0 0 100 1000"
              preserveAspectRatio="none"
              fill="none"
            >
              <path
                d="M 100 0 C 30 300, 20 650, 100 1000 L 100 0 Z"
                fill="#f4f9f8"
              />
              <path
                d="M 100 0 C 30 300, 20 650, 100 1000"
                stroke="#2dd4bf"
                strokeWidth="2.5"
                className="opacity-75"
                style={{ filter: "drop-shadow(0 0 10px rgba(45,212,191,0.8))" }}
              />
            </svg>
          </div>
        </div>

        {/* ─── Centered Login Glass Card ─── */}
        <div className="relative z-20 w-full max-w-[430px]">
          <div className="bg-white/95 backdrop-blur-xl rounded-[28px] border border-cyan-300/40 p-8 sm:p-10 shadow-[0_20px_60px_-15px_rgba(16,185,129,0.18),0_0_0_1px_rgba(45,212,191,0.2)] transition-all">
            {/* Form Header */}
            <div className="mb-7">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
                Welcome back
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                Sign in to your account to access your dashboard
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email field */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="email"
                  className="text-xs font-semibold text-slate-800"
                >
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="pl-10 h-11 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 rounded-xl transition-all"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="password"
                    className="text-xs font-semibold text-slate-800"
                  >
                    Password
                  </Label>
                  <Link
                    href="#"
                    className="text-xs text-emerald-500 hover:text-emerald-600 font-medium transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className="pl-10 pr-10 h-11 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 rounded-xl transition-all"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Sign In Button */}
              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-[#00b87c] via-[#00c586] to-[#00b87c] hover:from-[#00a870] hover:to-[#00a870] text-white font-semibold rounded-xl text-sm gap-2 mt-4 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/35 transition-all duration-200 active:scale-[0.99]"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Signing in...
                  </>
                ) : (
                  <>
                    Sign In <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            {/* Registration link */}
            <p className="text-center text-xs text-slate-500 mt-6">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="text-emerald-500 font-semibold hover:text-emerald-600 hover:underline"
              >
                Create one free
              </Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
