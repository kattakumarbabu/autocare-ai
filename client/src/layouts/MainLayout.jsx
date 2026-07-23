import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Breadcrumbs from '../components/common/Breadcrumbs';
import VoiceAssistantModal from '../components/common/VoiceAssistantModal';
import InstallPWABanner from '../components/common/InstallPWABanner';
import {
  Car, LogOut, LayoutDashboard, Menu, X, Bell,
  Wrench, Fuel, DollarSign, FileText, Bot, User, Settings,
  ChevronRight, Sparkles, Shield, MapPin, Cpu, Calendar, Mic, BarChart3, AlertTriangle,
} from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

const SIDEBAR_ITEMS = [
  { path: '/dashboard',       label: 'Dashboard',       icon: LayoutDashboard },
  { path: '/emergency-sos',   label: 'Emergency SOS',   icon: AlertTriangle, highlight: true },
  { path: '/analytics',       label: 'Analytics',       icon: BarChart3 },
  { path: '/vehicles',        label: 'My Vehicles',     icon: Car },
  { path: '/appointments',    label: 'Appointments',    icon: Calendar },
  { path: '/services',        label: 'Service History', icon: Wrench },
  { path: '/reminders',       label: 'Reminders',       icon: Bell },
  { path: '/fuel',            label: 'Fuel Tracker',    icon: Fuel },
  { path: '/expenses',        label: 'Expenses',        icon: DollarSign },
  { path: '/documents',       label: 'Documents',       icon: FileText },
  { path: '/service-centers', label: 'Service Locator', icon: MapPin },
  { path: '/predictive-ai',   label: 'Predictive AI',   icon: Cpu },
  { path: '/ai-assistant',    label: 'AI Assistant',    icon: Bot },
  { path: '/profile',         label: 'Profile',         icon: User },
  { path: '/settings',        label: 'Settings',        icon: Settings },
];

const MainLayout = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [mobileOpen, setMobileOpen]       = useState(false);
  const [sidebarOpen, setSidebarOpen]     = useState(true);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const isNavActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col">
      {/* ── Top Navbar ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-surface-950/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Left: Logo (Navigates to /dashboard if authenticated, else /) */}
            <div className="flex items-center gap-4">
              {isAuthenticated && (
                <button
                  onClick={() => setSidebarOpen((v) => !v)}
                  className="hidden lg:flex p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                  title="Toggle Sidebar"
                  aria-label="Toggle Sidebar"
                >
                  <Menu size={18} />
                </button>
              )}

              <Link
                to={isAuthenticated ? '/dashboard' : '/'}
                className="flex items-center gap-2.5 group"
                id="navbar-logo-link"
              >
                <div className="w-9 h-9 bg-brand-gradient rounded-xl flex items-center justify-center shadow-glow group-hover:shadow-glow-lg transition-shadow duration-300">
                  <Car size={18} className="text-white" />
                </div>
                <span className="font-display font-bold text-lg text-white">
                  AutoCare <span className="text-gradient">AI</span>
                </span>
              </Link>
            </div>

            {/* Desktop Navbar User Menu & Voice Trigger */}
            <nav className="hidden md:flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  {/* Emergency SOS Quick Button */}
                  <Link
                    to="/emergency-sos"
                    className="p-2 text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold animate-pulse"
                    id="navbar-sos-btn"
                  >
                    <AlertTriangle size={15} /> Emergency SOS
                  </Link>

                  {/* Voice Assistant Launcher */}
                  <button
                    onClick={() => setVoiceModalOpen(true)}
                    className="p-2 text-brand-400 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/20 rounded-xl transition-all flex items-center gap-1.5 text-xs font-semibold"
                    title="Voice Assistant"
                    id="navbar-voice-btn"
                  >
                    <Mic size={15} /> Voice Assistant
                  </button>

                  <div className="text-right mr-1">
                    <p className="text-white text-xs font-semibold">{user?.name}</p>
                    <p className="text-slate-500 text-[10px]">{user?.email}</p>
                  </div>
                  <Link
                    to="/profile"
                    className="w-9 h-9 bg-brand-gradient rounded-full flex items-center justify-center text-white font-bold text-sm shadow-glow"
                  >
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="btn-ghost py-2 px-3 text-xs"
                    aria-label="Logout"
                  >
                    <LogOut size={15} /> Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login"    className="btn-ghost py-2 px-4 text-sm">Sign In</Link>
                  <Link to="/register" className="btn-primary py-2 px-4 text-sm">Get Started</Link>
                </>
              )}
            </nav>

            {/* Mobile Hamburger & Quick Controls */}
            <div className="flex items-center gap-2 md:hidden">
              {isAuthenticated && (
                <>
                  <Link
                    to="/emergency-sos"
                    className="p-2 text-red-400 bg-red-500/10 rounded-xl animate-pulse"
                    title="Emergency SOS"
                  >
                    <AlertTriangle size={18} />
                  </Link>
                  <button
                    onClick={() => setVoiceModalOpen(true)}
                    className="p-2 text-brand-400 bg-brand-500/10 rounded-xl"
                    title="Voice Assistant"
                  >
                    <Mic size={18} />
                  </button>
                </>
              )}
              <button
                className="p-2 text-slate-400 hover:text-white transition-colors"
                onClick={() => setMobileOpen((v) => !v)}
                aria-label="Toggle mobile menu"
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="md:hidden bg-surface-900 border-t border-white/5 px-4 py-4 flex flex-col gap-1.5 animate-slide-up">
            {isAuthenticated ? (
              <>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-1">
                  Navigation Menu
                </p>
                {SIDEBAR_ITEMS.map(({ path, label, icon: Icon, highlight }) => (
                  <Link
                    key={path}
                    to={path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isNavActive(path)
                        ? 'bg-brand-gradient text-white shadow-glow'
                        : highlight
                        ? 'text-red-400 hover:bg-red-500/10 font-bold'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon size={16} /> {label}
                  </Link>
                ))}
                <div className="border-t border-white/5 pt-2 mt-2">
                  <button
                    onClick={() => { handleLogout(); setMobileOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login"    className="btn-ghost text-sm" onClick={() => setMobileOpen(false)}>Sign In</Link>
                <Link to="/register" className="btn-primary text-sm" onClick={() => setMobileOpen(false)}>Get Started</Link>
              </>
            )}
          </div>
        )}
      </header>

      {/* ── Breadcrumbs Bar ───────────────────────────────────────── */}
      <Breadcrumbs />

      {/* ── App Layout Body (Sidebar + Content) ────────────────────── */}
      <div className="flex-1 flex max-w-7xl mx-auto w-full">
        {/* Sidebar for Authenticated Users */}
        {isAuthenticated && (
          <aside
            className={`hidden lg:flex flex-col border-r border-white/5 bg-surface-950 py-6 transition-all duration-300 flex-shrink-0 ${
              sidebarOpen ? 'w-60 px-4' : 'w-16 px-2'
            }`}
          >
            <div className="space-y-1.5 flex-1">
              {SIDEBAR_ITEMS.map(({ path, label, icon: Icon, highlight }) => {
                const active = isNavActive(path);
                return (
                  <Link
                    key={path}
                    to={path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                      active
                        ? 'bg-brand-gradient text-white shadow-glow'
                        : highlight
                        ? 'text-red-400 hover:bg-red-500/10 font-bold border border-red-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                    title={sidebarOpen ? undefined : label}
                  >
                    <Icon size={18} className={`flex-shrink-0 ${active ? 'text-white' : highlight ? 'text-red-400' : 'text-slate-400 group-hover:text-brand-400'}`} />
                    {sidebarOpen && <span className="truncate">{label}</span>}
                  </Link>
                );
              })}
            </div>

            {/* AI Assistant Banner at bottom of Sidebar */}
            {sidebarOpen && (
              <div className="mt-6 p-3 bg-brand-500/10 border border-brand-500/20 rounded-2xl">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles size={14} className="text-brand-400" />
                  <span className="text-xs font-semibold text-white">AutoCare AI</span>
                </div>
                <p className="text-[11px] text-slate-400 mb-2">Smart diagnostic & maintenance advisor.</p>
                <button
                  onClick={() => setVoiceModalOpen(true)}
                  className="text-xs font-semibold text-brand-400 hover:underline flex items-center gap-1"
                >
                  Voice Assistant <ChevronRight size={12} />
                </button>
              </div>
            )}
          </aside>
        )}

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>

      {/* Voice Assistant Modal */}
      <VoiceAssistantModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
      />

      {/* PWA Install Banner & Offline Mode Toast */}
      <InstallPWABanner />

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-8 px-4 bg-surface-950 z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <Car size={14} className="text-brand-500" />
            <span>AutoCare AI © {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
