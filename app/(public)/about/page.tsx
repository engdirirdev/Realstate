// ================================================================
// PAGE NAME  : About Page
// ROUTE      : /about
// DESCRIPTION: Company info, mission, team, technology stack
//              and platform statistics
// ================================================================
import Link from "next/link";
import { Building2, Users, Bot, Globe, Heart, Zap, CheckCircle2, Star } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us – AI Real Estate",
  description: "Learn about Somalia's first AI-powered real estate platform and our mission.",
};

const team = [
  { name: "Mohamed Ali Hassan", role: "CEO & Co-Founder", emoji: "👨‍💼" },
  { name: "Fadumo Warsame", role: "Chief AI Officer", emoji: "👩‍💻" },
  { name: "Abdi Noor", role: "Head of Properties", emoji: "🏠" },
  { name: "Ifrah Said", role: "Lead Designer", emoji: "🎨" },
];

const stats = [
  { value: "55+", label: "Properties Listed", icon: Building2 },
  { value: "11+", label: "Happy Users", icon: Users },
  { value: "99%", label: "Data Accuracy", icon: Star },
  { value: "24/7", label: "AI Assistant", icon: Bot },
];

const values = [
  { icon: Zap, title: "Innovation First", desc: "We leverage cutting-edge AI and ML to transform how Somalis find properties." },
  { icon: Heart, title: "Community Driven", desc: "Built by Somalis, for Somalis. We understand the local market deeply." },
  { icon: Globe, title: "Transparent Platform", desc: "No hidden fees, no fake listings. Every property is verified before listing." },
  { icon: CheckCircle2, title: "Data Integrity", desc: "Our AI only speaks from real database data — no hallucinations, ever." },
];

export default function AboutPage() {
  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="bg-[#F8FAFC] py-20 text-center">
        <div className="section-container">
          <div className="max-w-3xl mx-auto">
            <p className="text-[#10B981] font-bold text-sm mb-2">✦ Our Story</p>
            <h1 className="font-display text-4xl font-bold text-[#0F172A] mb-4">
              Transforming Real Estate in Somalia with AI
            </h1>
            <p className="text-[#64748B] text-lg leading-relaxed">
              We&apos;re on a mission to make property discovery smarter, fairer, and more accessible for every Somali — whether you&apos;re in Mogadishu or the diaspora.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-14 bg-[#FFFFFF]">
        <div className="section-container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map(({ value, label, icon: Icon }) => (
              <div key={label} className="text-center bg-[#FFFFFF] border border-[#E2E8F0] shadow-card rounded-2xl p-6">
                <div className="w-14 h-14 bg-[#ECFDF5] rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Icon className="h-7 w-7 text-[#10B981]" />
                </div>
                <div className="font-display text-3xl font-bold text-[#0F172A]">{value}</div>
                <div className="text-sm text-[#64748B] mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-14 bg-[#F8FAFC]">
        <div className="section-container max-w-3xl mx-auto text-center">
          <p className="text-[#10B981] font-bold text-sm mb-2">✦ Our Mission</p>
          <h2 className="font-display text-3xl font-bold text-[#0F172A] mb-5">Why We Built This</h2>
          <p className="text-[#64748B] leading-relaxed mb-4">
            Finding a property in Somalia has traditionally been difficult — a mix of word-of-mouth, unreliable listings, and expensive agents. We built AI Real Estate to change that.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            By combining a modern web platform with machine learning price prediction and a conversational AI assistant, we&apos;ve created the most comprehensive property discovery experience in the Horn of Africa.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="py-14 bg-[#FFFFFF]">
        <div className="section-container">
          <div className="text-center mb-10">
            <p className="text-[#10B981] font-bold text-sm mb-2">✦ What We Stand For</p>
            <h2 className="font-display text-3xl font-bold text-[#0F172A]">Our Core Values</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-6 border border-[#E2E8F0] hover:shadow-card-hover transition-all">
                <div className="w-12 h-12 bg-[#ECFDF5] rounded-xl flex items-center justify-center mb-4">
                  <Icon className="h-6 w-6 text-[#10B981]" />
                </div>
                <h3 className="font-bold text-[#0F172A] mb-2">{title}</h3>
                <p className="text-sm text-[#64748B] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-14 bg-[#F8FAFC]">
        <div className="section-container">
          <div className="text-center mb-10">
            <p className="text-[#10B981] font-bold text-sm mb-2">✦ The People</p>
            <h2 className="font-display text-3xl font-bold text-[#0F172A]">Meet Our Team</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {team.map(({ name, role, emoji }) => (
              <div key={name} className="text-center bg-white border border-[#E2E8F0] shadow-card rounded-2xl p-6">
                <div className="w-20 h-20 bg-[#F8FAFC] rounded-full flex items-center justify-center mx-auto mb-3 text-4xl border border-[#E2E8F0]">
                  {emoji}
                </div>
                <h3 className="font-bold text-[#0F172A] text-sm">{name}</h3>
                <p className="text-xs text-[#10B981] mt-0.5">{role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 bg-[#0F172A] text-center">
        <div className="section-container">
          <h2 className="font-display text-2xl font-bold text-white mb-3">Ready to Find Your Property?</h2>
          <p className="text-[#94A3B8] mb-6">Join thousands of Somalis who trust AI Real Estate.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/properties" className="bg-[#10B981] text-white hover:bg-[#059669] px-8 py-3 text-sm rounded-xl inline-block transition-colors">
              Browse Properties
            </Link>
            <Link href="/contact" className="border border-[#E2E8F0] text-white hover:bg-white/10 px-8 py-3 text-sm rounded-xl inline-block transition-colors">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
