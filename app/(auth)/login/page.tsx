// ================================================================
// PAGE NAME  : Login Page
// ROUTE      : /login
// DESCRIPTION: User authentication — email/password credentials,
//              JWT session creation via NextAuth
// ================================================================
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, Eye, EyeOff, Loader2, Mail, Lock, ArrowRight, Sparkles, ShieldCheck, Home, Bot, BarChart3 } from "lucide-react";
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
      toast({ title: "Missing fields", description: "Please fill in all fields.", variant: "destructive" });
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
        toast({ title: "Login failed", description: "Invalid email or password.", variant: "destructive" });
      } else {
        toast({ title: "Welcome back! 👋", description: "Logged in successfully.", variant: "success" } as any);
        
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
    <div className="min-h-screen flex bg-[#F8FAFC]">
      {/* ─── Left panel (Deep Navy Dark Branding) ─── */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0F172A] flex-col justify-between p-12 relative overflow-hidden">
        {/* Background glow accents */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#10B981]/10 blur-3xl" />
          <div className="absolute bottom-10 -left-20 w-80 h-80 rounded-full bg-[#06B6D4]/10 blur-3xl" />
        </div>

        {/* Top Logo */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#10B981] flex items-center justify-center shadow-sm">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-lg text-white tracking-tight">AI RealEstate</span>
              <span className="text-[10px] text-[#34D399] font-medium tracking-wide">Smart Property Search</span>
            </div>
          </Link>
        </div>

        {/* Middle Feature Highlights */}
        <div className="relative z-10 max-w-md my-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1E293B] border border-[#334155] text-[#34D399] text-xs font-medium mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            Next-Gen Real Estate AI
          </div>
          <h2 className="text-3xl xl:text-4xl font-bold text-white leading-tight mb-4">
            Smart Property Search Powered by AI
          </h2>
          <p className="text-[#CBD5E1] text-base leading-relaxed mb-8">
            Get personalized recommendations, predict prices, and chat with our AI assistant to find your perfect property in Somalia.
          </p>

          <div className="space-y-3.5">
            {[
              { icon: Home, text: "Browse 55+ verified properties across Somalia" },
              { icon: Sparkles, text: "AI-powered recommendations tailored to your budget" },
              { icon: BarChart3, text: "ML price prediction with confidence score" },
              { icon: Bot, text: "24/7 conversational AI assistant for instant answers" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3.5 bg-[#1E293B]/80 border border-[#334155] rounded-xl px-4 py-3 shadow-sm">
                <div className="w-8 h-8 rounded-lg bg-[#10B981]/15 text-[#10B981] flex items-center justify-center flex-shrink-0">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium text-white">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Footer Note */}
        <div className="relative z-10 text-xs text-[#94A3B8]">
          © {new Date().getFullYear()} AI RealEstate. All rights reserved.
        </div>
      </div>

      {/* ─── Right panel (Clean Light Form) ─── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-[#F8FAFC]">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-[#10B981] flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-[#0F172A]">AI RealEstate</span>
          </Link>

          <div className="bg-white rounded-2xl shadow-card border border-[#E2E8F0] p-8 sm:p-10">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-[#0F172A] mb-1 tracking-tight">Welcome back</h1>
              <p className="text-[#64748B] text-sm">Sign in to your account to access your dashboard</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-[#0F172A]">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="pl-10 h-11 bg-white border-[#E2E8F0] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#10B981] focus:ring-[#10B981]/20 rounded-xl"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-semibold text-[#0F172A]">Password</Label>
                  <Link href="#" className="text-xs text-[#10B981] hover:text-[#059669] font-medium">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className="pl-10 pr-10 h-11 bg-white border-[#E2E8F0] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#10B981] focus:ring-[#10B981]/20 rounded-xl"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F172A]"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-[#10B981] hover:bg-[#059669] text-white font-semibold rounded-xl text-sm gap-2 mt-2 shadow-sm transition-all"
                disabled={loading}
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Signing in...</>
                ) : (
                  <>Sign In <ArrowRight className="h-4 w-4" /></>
                )}
              </Button>
            </form>



            <p className="text-center text-xs text-[#64748B] mt-6">
              Don't have an account?{" "}
              <Link href="/register" className="text-[#10B981] font-semibold hover:text-[#059669]">
                Create one free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
