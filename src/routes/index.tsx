import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  UserPlus,
  IdCard,
  Network,
  ListChecks,
  Lock,
  MessageSquare,
  Bell,
  LineChart,
  CheckCircle2,
  Star,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ServiceDesk Pro — Manage Clients, Projects & Teams in One Platform" },
      {
        name: "description",
        content:
          "ServiceDesk Pro is the unified command center for modern service businesses. Manage clients, projects, employees and communication with enterprise-grade security.",
      },
      { property: "og:title", content: "ServiceDesk Pro" },
      {
        property: "og:description",
        content: "The unified command center for modern service businesses.",
      },
    ],
  }),
  component: Landing,
});

function Navbar() {
  const [open, setOpen] = useState(false);
  const links = ["Platform", "Solutions", "Resources", "Pricing"];
  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <a href="#" className="text-2xl font-bold text-blue-600">
          ServiceDesk Pro
        </a>
        <nav className="hidden items-center gap-10 md:flex">
          {links.map((l, i) => (
            <a
              key={l}
              href={`#${l.toLowerCase()}`}
              className={`text-base font-medium transition-colors ${
                i === 0
                  ? "border-b-2 border-blue-600 pb-1 text-blue-600"
                  : "text-slate-700 hover:text-blue-600"
              }`}
            >
              {l}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-6 md:flex">
          <a href="#" className="text-base font-medium text-slate-700 hover:text-blue-600">
            Sign In
          </a>
          <a
            href="#"
            className="rounded-full bg-blue-600 px-6 py-2.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            Get Started
          </a>
        </div>
        <button
          className="md:hidden text-slate-700"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      {open && (
        <div className="border-t border-slate-100 bg-white px-6 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {links.map((l) => (
              <a key={l} href={`#${l.toLowerCase()}`} className="py-2 text-slate-700">
                {l}
              </a>
            ))}
            <a href="#" className="py-2 text-slate-700">Sign In</a>
            <a
              href="#"
              className="mt-2 rounded-full bg-blue-600 px-6 py-2.5 text-center font-semibold text-white"
            >
              Get Started
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

function Hero() {
  return (
    <section className="bg-white">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28">
        <div>
          <h1 className="text-5xl font-bold leading-tight tracking-tight text-slate-900 sm:text-6xl lg:text-7xl">
            Manage Clients, Projects, Employees and Communication —{" "}
            <span className="text-blue-600">All From One Platform</span>
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-slate-600">
            The unified command center for modern service businesses. Scale your operations with
            frictionless workflows and enterprise-grade security.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="#"
              className="rounded-full bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              Get Started Free
            </a>
            <a
              href="#features"
              className="rounded-full border border-blue-200 bg-white px-8 py-4 text-base font-semibold text-blue-600 transition-colors hover:bg-blue-50"
            >
              Explore Features
            </a>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_30px_60px_-30px_rgba(15,23,42,0.25)]">
          <div className="flex gap-1.5 pb-4">
            <span className="h-3 w-3 rounded-full bg-red-400" />
            <span className="h-3 w-3 rounded-full bg-yellow-400" />
            <span className="h-3 w-3 rounded-full bg-green-400" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-4">
              <div className="h-6 w-32 rounded bg-blue-100" />
              <div className="grid grid-cols-5 gap-3">
                <div className="col-span-1 h-20 rounded-lg bg-blue-700" />
                <div className="col-span-1 h-20 rounded-lg bg-blue-300" />
                <div className="col-span-1 h-20 rounded-lg bg-blue-700" />
                <div className="col-span-1 h-20 rounded-lg bg-purple-500" />
                <div className="col-span-1 h-20 rounded-lg bg-blue-700" />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="mb-3 h-6 w-6 rounded bg-blue-200" />
                  <div className="h-2 w-full rounded bg-slate-200" />
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="mb-3 h-6 w-6 rounded bg-purple-200" />
                  <div className="h-2 w-full rounded bg-slate-200" />
                </div>
              </div>
            </div>
            <div className="space-y-3 pt-2">
              <div className="h-2 w-full rounded bg-slate-200" />
              <div className="h-2 w-3/4 rounded bg-slate-200" />
              <div className="h-2 w-5/6 rounded bg-slate-200" />
              <div className="h-2 w-2/3 rounded bg-slate-200" />
              <div className="pt-3">
                <div className="mb-3 h-3 w-3 rounded-full bg-slate-300" />
                <div className="mb-3 h-3 w-3 rounded-full bg-slate-300" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const features = [
  { icon: UserPlus, title: "Client Management", desc: "Centralized client profiles, history, and document storage.", tone: "blue" },
  { icon: IdCard, title: "Employee Tracking", desc: "Manage performance, attendance, and internal growth.", tone: "purple" },
  { icon: Network, title: "Project Oversight", desc: "High-level visibility across all active business initiatives.", tone: "blue" },
  { icon: ListChecks, title: "Task Workflow", desc: "Granular task assignment with automated dependencies.", tone: "blue" },
  { icon: Lock, title: "Role Based Access", desc: "Precise permission controls for every user level.", tone: "purple" },
  { icon: MessageSquare, title: "Internal Messaging", desc: "Direct and channel-based secure communication.", tone: "blue" },
  { icon: Bell, title: "Smart Alerts", desc: "Real-time triggers for critical business updates.", tone: "blue" },
  { icon: LineChart, title: "Deep Analytics", desc: "Data-driven insights to optimize your bottom line.", tone: "purple" },
];

function Features() {
  return (
    <section id="features" className="bg-slate-50/60 py-20">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => {
          const Icon = f.icon;
          const tone =
            f.tone === "purple"
              ? "bg-purple-100 text-purple-600"
              : "bg-blue-100 text-blue-600";
          return (
            <div
              key={f.title}
              className="rounded-2xl bg-white p-8 shadow-[0_4px_20px_-8px_rgba(15,23,42,0.08)] transition-shadow hover:shadow-[0_10px_30px_-10px_rgba(15,23,42,0.15)]"
            >
              <div className={`mb-8 flex h-12 w-12 items-center justify-center rounded-xl ${tone}`}>
                <Icon size={22} />
              </div>
              <h3 className="mb-3 text-xl font-bold text-slate-900">{f.title}</h3>
              <p className="text-base leading-relaxed text-slate-500">{f.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

const roles = [
  {
    tag: "ADMINISTRATOR",
    tagColor: "text-blue-600",
    title: "Command Center",
    blob: "bg-blue-100",
    items: ["Full business financial oversight", "Manage roles & permissions", "System-wide audit logs"],
    img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
  },
  {
    tag: "EMPLOYEE",
    tagColor: "text-purple-600",
    title: "Focused Execution",
    blob: "bg-purple-100",
    items: ["Personalized task queue", "Internal team collaboration", "Timesheet & PTO tracking"],
    img: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
  },
  {
    tag: "CLIENT",
    tagColor: "text-emerald-600",
    title: "Transparent Progress",
    blob: "bg-emerald-100",
    items: ["Project milestone tracking", "Secure document approvals", "Direct support access"],
    img: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80",
  },
];

function Roles() {
  return (
    <section id="solutions" className="bg-slate-50/60 py-20">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="text-center text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Tailored Experiences per Role
        </h2>
        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {roles.map((r) => (
            <div
              key={r.title}
              className="relative overflow-hidden rounded-2xl bg-white p-8 shadow-[0_4px_20px_-8px_rgba(15,23,42,0.08)]"
            >
              <div className={`absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-60 ${r.blob}`} />
              <div className="relative">
                <p className={`text-xs font-bold tracking-widest ${r.tagColor}`}>{r.tag}</p>
                <h3 className="mt-3 text-2xl font-bold text-slate-900">{r.title}</h3>
                <ul className="mt-6 space-y-3">
                  {r.items.map((it) => (
                    <li key={it} className="flex items-center gap-3 text-slate-700">
                      <CheckCircle2 size={18} className="text-purple-500" />
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8 overflow-hidden rounded-xl">
                  <img src={r.img} alt={r.title} loading="lazy" className="h-56 w-full object-cover" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const journey = [
  { n: 1, t: "Onboarding", d: "Import your current data in minutes." },
  { n: 2, t: "Structure", d: "Map your roles and client hierarchies." },
  { n: 3, t: "Engage", d: "Invite your team and active clients." },
  { n: 4, t: "Automate", d: "Set up recurring tasks and alerts." },
  { n: 5, t: "Collaborate", d: "Converse and share within context." },
  { n: 6, t: "Optimize", d: "Analyze data to scale operations." },
];

function Journey() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="text-center text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          The Journey to Mastery
        </h2>
        <div className="relative mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-6">
          {journey.map((s, i) => (
            <div key={s.n} className="relative">
              <div className="rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-[0_2px_12px_-4px_rgba(15,23,42,0.08)]">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 font-bold text-white">
                  {s.n}
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-900">{s.t}</h3>
                <p className="mt-2 text-sm text-slate-500">{s.d}</p>
              </div>
              {i < journey.length - 1 && (
                <div className="absolute right-0 top-1/2 hidden h-0.5 w-6 -translate-y-1/2 translate-x-full bg-gradient-to-r from-blue-500 to-purple-500 lg:block" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const stats = [
  { v: "150+", l: "GLOBAL CLIENTS" },
  { v: "320+", l: "ACTIVE PROJECTS" },
  { v: "12k+", l: "TASKS COMPLETED" },
  { v: "99.9%", l: "SYSTEM UPTIME" },
];

function Stats() {
  return (
    <section className="bg-slate-900 py-20">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.l} className="text-center">
            <div className="text-5xl font-bold text-white sm:text-6xl">{s.v}</div>
            <div className="mt-3 text-xs font-semibold tracking-widest text-slate-400">{s.l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

const testimonials = [
  {
    quote:
      "ServiceDesk Pro has completely transformed how we manage our client interactions. The transparency we can now offer is unmatched in our industry.",
    name: "David Chen",
    role: "CEO, Skyflow Agencies",
    img: "https://i.pravatar.cc/100?img=12",
  },
  {
    quote:
      "The granularity of the roles and permissions is exactly what we needed as we scaled past 50 employees. It's the only platform that feels truly enterprise-ready.",
    name: "Sarah Jenkins",
    role: "Director of Ops, DevLogic",
    img: "https://i.pravatar.cc/100?img=47",
  },
  {
    quote:
      "As a freelancer, I finally have a portal that makes me look like a global agency. My clients love the transparency and I love the organization.",
    name: "Marcus Thorne",
    role: "Independent Consultant",
    img: "https://i.pravatar.cc/100?img=33",
  },
];

function Testimonials() {
  return (
    <section className="bg-slate-50/60 py-20">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="text-center text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Words from our Partners
        </h2>
        <div className="mt-14 grid gap-8 lg:grid-cols-3">
          {testimonials.map((t) => (
            <div key={t.name} className="rounded-2xl bg-white p-8 shadow-[0_4px_20px_-8px_rgba(15,23,42,0.08)]">
              <div className="flex gap-1 text-yellow-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={18} fill="currentColor" />
                ))}
              </div>
              <p className="mt-5 text-base leading-relaxed text-slate-700">"{t.quote}"</p>
              <div className="mt-6 flex items-center gap-3">
                <img src={t.img} alt={t.name} className="h-10 w-10 rounded-full object-cover" />
                <div>
                  <div className="font-semibold text-slate-900">{t.name}</div>
                  <div className="text-sm text-slate-500">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const faqs = [
  { q: "What is ServiceDesk Pro?", a: "ServiceDesk Pro is an all-in-one platform for managing clients, projects, employees and communication for modern service businesses." },
  { q: "Is my data secure?", a: "Yes. We use enterprise-grade encryption at rest and in transit, with SOC 2 compliant infrastructure and role-based access controls." },
  { q: "Can I invite my clients?", a: "Absolutely. Each client gets a transparent portal to track milestones, approve documents and reach support directly." },
  { q: "Do you offer a free trial?", a: "Yes — every plan starts with a 14-day free trial, no credit card required." },
];

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="bg-slate-50/60 pb-24">
      <div className="mx-auto max-w-3xl px-6">
        <h2 className="text-center text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Frequently Asked Questions
        </h2>
        <div className="mt-12 space-y-4">
          {faqs.map((f, i) => (
            <div key={f.q} className="overflow-hidden rounded-2xl bg-white shadow-[0_2px_12px_-4px_rgba(15,23,42,0.08)]">
              <button
                className="flex w-full items-center justify-between px-6 py-5 text-left"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="font-semibold text-slate-900">{f.q}</span>
                <ChevronDown
                  size={20}
                  className={`text-slate-500 transition-transform ${open === i ? "rotate-180" : ""}`}
                />
              </button>
              {open === i && (
                <div className="px-6 pb-5 text-slate-600">{f.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const cols = [
    { h: "Product", l: ["Platform", "Solutions", "Pricing", "Integrations"] },
    { h: "Company", l: ["About", "Careers", "Press", "Contact"] },
    { h: "Resources", l: ["Documentation", "Help Center", "Community", "Status"] },
    { h: "Legal", l: ["Privacy", "Terms", "Security", "Cookies"] },
  ];
  return (
    <footer className="bg-slate-900 py-16 text-slate-400">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-5">
        <div className="lg:col-span-1">
          <div className="text-xl font-bold text-white">ServiceDesk Pro</div>
          <p className="mt-3 text-sm">The unified command center for modern service businesses.</p>
        </div>
        {cols.map((c) => (
          <div key={c.h}>
            <div className="text-sm font-semibold text-white">{c.h}</div>
            <ul className="mt-4 space-y-2 text-sm">
              {c.l.map((it) => (
                <li key={it}>
                  <a href="#" className="hover:text-white">{it}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-12 max-w-7xl border-t border-slate-800 px-6 pt-8 text-sm">
        © {new Date().getFullYear()} ServiceDesk Pro. All rights reserved.
      </div>
    </footer>
  );
}

function Landing() {
  return (
    <div className="min-h-screen scroll-smooth bg-white text-slate-900">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Roles />
        <Journey />
        <Stats />
        <Testimonials />
        <Faq />
      </main>
      <Footer />
    </div>
  );
}
