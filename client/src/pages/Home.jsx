import { Link } from 'react-router-dom';
import {
  Car, Zap, Shield, BarChart3, Wrench, Clock,
  CheckCircle, ArrowRight, Star, ChevronRight,
} from 'lucide-react';

/* ── Data ──────────────────────────────────────────────────────────────────── */
const features = [
  {
    icon: Zap,
    title: 'AI Diagnostics',
    desc: 'Instant vehicle health analysis powered by machine learning — catch issues before they become costly.',
    color: 'from-yellow-500 to-orange-500',
  },
  {
    icon: Shield,
    title: 'Predictive Maintenance',
    desc: 'Stay ahead of breakdowns with intelligent scheduling based on your driving patterns and vehicle data.',
    color: 'from-brand-500 to-blue-400',
  },
  {
    icon: BarChart3,
    title: 'Cost Analytics',
    desc: 'Track every dollar spent on your vehicle with detailed reports and savings recommendations.',
    color: 'from-emerald-500 to-teal-400',
  },
  {
    icon: Wrench,
    title: 'Service Hub',
    desc: 'Connect with certified mechanics near you with transparent pricing and verified reviews.',
    color: 'from-purple-500 to-indigo-500',
  },
  {
    icon: Clock,
    title: 'Service History',
    desc: 'A complete digital log of every service, repair, and part replacement at your fingertips.',
    color: 'from-rose-500 to-pink-500',
  },
  {
    icon: Car,
    title: 'Multi-Vehicle',
    desc: 'Manage your entire fleet — personal, family, or business vehicles — from a single dashboard.',
    color: 'from-cyan-500 to-brand-500',
  },
];

const stats = [
  { value: '50K+', label: 'Happy Drivers' },
  { value: '98%',  label: 'Uptime Guarantee' },
  { value: '$840',  label: 'Avg. Annual Savings' },
  { value: '4.9★', label: 'App Rating' },
];

const testimonials = [
  {
    name: 'Sarah Mitchell',
    role: 'Fleet Manager',
    avatar: 'SM',
    text: 'AutoCare AI cut our fleet maintenance costs by 30% in the first quarter. The predictive alerts alone saved us from two major breakdowns.',
    rating: 5,
  },
  {
    name: 'David Chen',
    role: 'Car Enthusiast',
    avatar: 'DC',
    text: 'Finally an app that speaks my language. The AI diagnostics are eerily accurate — it flagged my brake pads before my mechanic did.',
    rating: 5,
  },
  {
    name: 'Maria Rodriguez',
    role: 'Uber Driver',
    avatar: 'MR',
    text: 'Running my car 10+ hours a day meant constant worry. AutoCare AI gives me peace of mind with real-time health monitoring.',
    rating: 5,
  },
];

/* ── Component ─────────────────────────────────────────────────────────────── */
const Home = () => {
  return (
    <div className="overflow-x-hidden">

      {/* ════ HERO ════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center bg-hero-gradient overflow-hidden">
        {/* Glow orbs */}
        <div className="glow-orb w-[600px] h-[600px] bg-brand-700 -top-48 -left-48" />
        <div className="glow-orb w-[500px] h-[500px] bg-blue-600 -bottom-32 -right-32" />
        <div className="glow-orb w-72 h-72 bg-indigo-500 top-1/3 right-1/4 animate-pulse-slow" />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 rounded-full px-4 py-1.5 text-brand-300 text-sm font-medium mb-8 animate-fade-in">
            <Zap size={14} className="text-brand-400" />
            AI-Powered Vehicle Intelligence
          </div>

          {/* Headline */}
          <h1 className="font-display font-extrabold text-5xl sm:text-6xl lg:text-7xl text-white leading-tight mb-6 animate-slide-up">
            Your Car's{' '}
            <span className="text-gradient">Smartest</span>
            <br />
            Companion
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
            AutoCare AI monitors, diagnoses, and predicts maintenance needs for your vehicle —
            saving you money and keeping you safe on every drive.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Link to="/register" className="btn-primary text-base px-8 py-4 shadow-glow-lg w-full sm:w-auto">
              Start for Free <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn-ghost text-base px-8 py-4 w-full sm:w-auto">
              Sign In
            </Link>
          </div>

          {/* Trust signals */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-12 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            {['No credit card required', 'Free 14-day trial', 'Cancel anytime'].map((item) => (
              <div key={item} className="flex items-center gap-2 text-slate-400 text-sm">
                <CheckCircle size={14} className="text-brand-400" />
                {item}
              </div>
            ))}
          </div>

          {/* Floating car illustration */}
          <div className="mt-20 animate-float">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-brand-500/20 blur-3xl rounded-full scale-75" />
              <div className="relative glass-card p-8 rounded-3xl max-w-md mx-auto">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Vehicle Health</p>
                    <p className="text-2xl font-bold text-white mt-0.5">Excellent</p>
                  </div>
                  <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center">
                    <Shield size={24} className="text-emerald-400" />
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Engine',      pct: 95, color: 'bg-emerald-500' },
                    { label: 'Brakes',      pct: 78, color: 'bg-brand-500'  },
                    { label: 'Tires',       pct: 62, color: 'bg-yellow-500' },
                  ].map(({ label, pct, color }) => (
                    <div key={label}>
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>{label}</span><span>{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════ STATS ═══════════════════════════════════════════════════════════ */}
      <section className="py-16 bg-surface-900 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="font-display font-extrabold text-4xl text-white mb-1">{value}</p>
                <p className="text-slate-400 text-sm">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════ FEATURES ════════════════════════════════════════════════════════ */}
      <section className="py-24 bg-surface-950 relative overflow-hidden">
        <div className="glow-orb w-96 h-96 bg-brand-800 top-0 left-0" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-brand-400 font-semibold text-sm uppercase tracking-wider mb-3">Everything You Need</p>
            <h2 className="font-display font-bold text-4xl sm:text-5xl text-white mb-4">
              Built for modern<br />
              <span className="text-gradient">vehicle owners</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              From AI-powered diagnostics to certified mechanic connections — AutoCare AI is your all-in-one vehicle companion.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="glass-card p-6 group hover:border-brand-500/30 transition-all duration-300 hover:-translate-y-1">
                <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <Icon size={22} className="text-white" />
                </div>
                <h3 className="font-semibold text-white text-lg mb-2">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════ TESTIMONIALS ════════════════════════════════════════════════════ */}
      <section className="py-24 bg-surface-900 relative overflow-hidden">
        <div className="glow-orb w-96 h-96 bg-indigo-900 bottom-0 right-0" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-brand-400 font-semibold text-sm uppercase tracking-wider mb-3">Testimonials</p>
            <h2 className="font-display font-bold text-4xl sm:text-5xl text-white">
              Trusted by <span className="text-gradient">50,000+</span> drivers
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map(({ name, role, avatar, text, rating }) => (
              <div key={name} className="glass-card p-6">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: rating }).map((_, i) => (
                    <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed mb-6">"{text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-gradient rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {avatar}
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{name}</p>
                    <p className="text-slate-500 text-xs">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════ CTA BANNER ══════════════════════════════════════════════════════ */}
      <section className="py-24 bg-brand-gradient relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display font-extrabold text-4xl sm:text-5xl text-white mb-6">
            Ready to take control of your vehicle?
          </h2>
          <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto">
            Join thousands of smart drivers who use AutoCare AI to save money, avoid breakdowns, and extend vehicle life.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold px-8 py-4 rounded-xl hover:bg-blue-50 active:scale-95 transition-all duration-200 shadow-xl text-base"
          >
            Get Started Free <ChevronRight size={18} />
          </Link>
        </div>
      </section>

    </div>
  );
};

export default Home;
