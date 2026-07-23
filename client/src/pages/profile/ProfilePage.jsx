import { useAuth } from '../../hooks/useAuth';
import { User, Mail, ShieldCheck, Calendar, Key, Edit3 } from 'lucide-react';

const ProfilePage = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-surface-950 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="font-display font-bold text-3xl text-white">User Profile</h1>
          <p className="text-slate-400 text-sm mt-1">Manage your account information and preferences</p>
        </div>

        <div className="glass-card p-6 space-y-6">
          <div className="flex items-center gap-4 pb-6 border-b border-white/5">
            <div className="w-16 h-16 bg-brand-gradient rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-glow">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="font-semibold text-white text-xl">{user?.name}</h2>
              <p className="text-slate-400 text-sm">{user?.email}</p>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20 mt-2">
                <ShieldCheck size={11} /> Verified Account
              </span>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 bg-white/5 rounded-xl border border-white/5">
              <p className="text-slate-500 text-xs mb-1 flex items-center gap-1.5"><User size={13} /> Full Name</p>
              <p className="text-white font-medium text-sm">{user?.name}</p>
            </div>
            <div className="p-4 bg-white/5 rounded-xl border border-white/5">
              <p className="text-slate-500 text-xs mb-1 flex items-center gap-1.5"><Mail size={13} /> Email Address</p>
              <p className="text-white font-medium text-sm">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
