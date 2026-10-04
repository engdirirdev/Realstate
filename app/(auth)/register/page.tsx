// ================================================================
// PAGE NAME  : Register Page
// ROUTE      : /register
// DESCRIPTION: New user registration — name, email, password,
//              phone — creates USER role account in the database
// ================================================================
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import {
  Building2, Eye, EyeOff, Loader2, Mail, Lock,
  User, Phone, ArrowRight, CheckCircle2, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

const requirements = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One number", test: (p: string) => /\d/.test(p) },
];

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast({ title: "Missing fields", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }
    if (form.password.length < 8) {
      toast({ title: "Weak password", description: "Password must be at least 8 characters.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) {
        toast({ title: "Registration failed", description: data.error, variant: "destructive" });
        return;
      }
      await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      toast({ title: "Account created! 🎉", description: "Welcome! Setting up your profile...", variant: "success" } as any);
      router.push("/dashboard");
    } catch {
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F8FAFC]">
      {/* ─── Left panel (Deep Navy Dark Branding) ─── */}
      <div className="hidden lg:flex lg:w-5/12 bg-[#0F172A] flex-col justify-between p-12 relative overflow-hidden">
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

        {/* Middle Content */}
        <div className="relative z-10 max-w-sm my-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1E293B] border border-[#334155] text-[#34D399] text-xs font-medium mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            Join Free Today
          </div>
          <h2 className="text-3xl font-bold text-white leading-tight mb-3">
            Join Somalia&apos;s #1 AI Property Platform
          </h2>
          <p className="text-[#CBD5E1] text-sm leading-relaxed mb-8">
            Create your free account and unlock personalized property recommendations powered by artificial intelligence.
          </p>
          <div className="space-y-3.5">
            {[
              "Free forever — no hidden costs",
              "Instant AI property recommendations",
              "Price prediction before you buy",
              "Save & organize favorite properties",
              "24/7 AI assistant for property questions",
            ].map((benefit) => (
              <div key={benefit} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#10B981]/20 text-[#34D399] flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </div>
                <span className="text-sm font-medium text-white">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Footer Note */}
        <div className="relative z-10 text-xs text-[#94A3B8]">
          © {new Date().getFullYear()} AI RealEstate. All rights reserved.
        </div>
      </div>

      {/* ─── Right panel (Form Container) ─── */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-6 sm:p-12 bg-[#F8FAFC] overflow-y-auto">
        <div className="w-full max-w-md py-6">
          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-2.5 mb-6 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-[#10B981] flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-[#0F172A]">AI RealEstate</span>
          </Link>

          <div className="bg-white rounded-2xl shadow-card border border-[#E2E8F0] p-8 sm:p-10">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-[#0F172A] mb-1 tracking-tight">Create your account</h1>
              <p className="text-[#64748B] text-sm">Start finding your perfect property today</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-semibold text-[#0F172A]">Full Name <span className="text-[#EF4444]">*</span></Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                  <Input
                    id="name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Ahmed Hassan"
                    className="pl-10 h-11 bg-white border-[#E2E8F0] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#10B981] focus:ring-[#10B981]/20 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-[#0F172A]">Email Address <span className="text-[#EF4444]">*</span></Label>
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
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-semibold text-[#0F172A]">Phone Number <span className="text-[#94A3B8] font-normal">(optional)</span></Label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+252 61 234 5678"
                    className="pl-10 h-11 bg-white border-[#E2E8F0] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#10B981] focus:ring-[#10B981]/20 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold text-[#0F172A]">Password <span className="text-[#EF4444]">*</span></Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Min. 8 characters"
                    className="pl-10 pr-10 h-11 bg-white border-[#E2E8F0] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#10B981] focus:ring-[#10B981]/20 rounded-xl"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F172A]"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Password strength indicators */}
                {form.password && (
                  <div className="space-y-1.5 mt-2 bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0]">
                    {requirements.map(({ label, test }) => (
                      <div key={label} className="flex items-center gap-2 text-xs">
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${test(form.password) ? "bg-[#10B981]" : "bg-[#CBD5E1]"}`}>
                          {test(form.password) && (
                            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <span className={test(form.password) ? "text-[#059669] font-medium" : "text-[#94A3B8]"}>{label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <p className="text-xs text-[#94A3B8] leading-relaxed">
                By creating an account, you agree to our{" "}
                <Link href="#" className="text-[#10B981] hover:underline">Terms of Service</Link> and{" "}
                <Link href="#" className="text-[#10B981] hover:underline">Privacy Policy</Link>.
              </p>

              <Button
                type="submit"
                className="w-full h-11 bg-[#10B981] hover:bg-[#059669] text-white font-semibold rounded-xl text-sm gap-2 mt-1 shadow-sm transition-all"
                disabled={loading}
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Creating account...</>
                ) : (
                  <>Create Free Account <ArrowRight className="h-4 w-4" /></>
                )}
              </Button>
            </form>

            <p className="text-center text-xs text-[#64748B] mt-6">
              Already have an account?{" "}
              <Link href="/login" className="text-[#10B981] font-semibold hover:text-[#059669]">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
