import { Outlet, Link } from 'react-router-dom';
import { Car } from 'lucide-react';

const AuthLayout = () => (
  <div className="min-h-screen bg-hero-gradient flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
    {/* Decorative glow orbs */}
    <div className="glow-orb w-96 h-96 bg-brand-600 -top-32 -left-32" />
    <div className="glow-orb w-80 h-80 bg-blue-500  -bottom-24 -right-24" />
    <div className="glow-orb w-64 h-64 bg-indigo-600 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

    {/* Logo */}
    <Link to="/" className="flex items-center gap-2.5 mb-8 group animate-fade-in">
      <div className="w-10 h-10 bg-brand-gradient rounded-xl flex items-center justify-center shadow-glow group-hover:shadow-glow-lg transition-shadow duration-300">
        <Car size={20} className="text-white" />
      </div>
      <span className="font-display font-bold text-xl text-white">
        AutoCare <span className="text-gradient">AI</span>
      </span>
    </Link>

    {/* Card */}
    <div className="w-full max-w-md glass-card p-8 animate-slide-up relative z-10">
      <Outlet />
    </div>

    {/* Bottom links */}
    <p className="mt-6 text-sm text-slate-500 animate-fade-in">
      © {new Date().getFullYear()} AutoCare AI — All rights reserved
    </p>
  </div>
);

export default AuthLayout;
