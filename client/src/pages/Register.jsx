import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Eye, EyeOff, UserPlus, Mail, Lock, User } from 'lucide-react';
import toast from 'react-hot-toast';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim())           e.name    = 'Name is required';
    else if (form.name.length < 2)   e.name    = 'Name must be at least 2 characters';
    if (!form.email)                  e.email   = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password)               e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    return e;
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      await register(form.name.trim(), form.email, form.password);
      toast.success('Account created! Welcome to AutoCare AI 🎉');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  /* Password strength indicator */
  const getStrength = (pw) => {
    if (!pw) return { level: 0, label: '', color: '' };
    let score = 0;
    if (pw.length >= 8)          score++;
    if (/[A-Z]/.test(pw))        score++;
    if (/[0-9]/.test(pw))        score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    const map = [
      { level: 0, label: '',         color: '' },
      { level: 1, label: 'Weak',     color: 'bg-red-500'    },
      { level: 2, label: 'Fair',     color: 'bg-yellow-500' },
      { level: 3, label: 'Good',     color: 'bg-brand-500'  },
      { level: 4, label: 'Strong',   color: 'bg-emerald-500'},
    ];
    return map[score] || map[0];
  };

  const strength = getStrength(form.password);

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="font-display font-bold text-2xl text-white mb-2">Create your account</h1>
        <p className="text-slate-400 text-sm">Start your free 14-day trial — no card required</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Name */}
        <div>
          <label htmlFor="name" className="form-label">Full name</label>
          <div className="relative">
            <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="name"
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Alex Johnson"
              className={`input-field pl-10 ${errors.name ? 'border-red-500/50 focus:ring-red-500' : ''}`}
              autoComplete="name"
            />
          </div>
          {errors.name && <p className="field-error">{errors.name}</p>}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="reg-email" className="form-label">Email address</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="reg-email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className={`input-field pl-10 ${errors.email ? 'border-red-500/50 focus:ring-red-500' : ''}`}
              autoComplete="email"
            />
          </div>
          {errors.email && <p className="field-error">{errors.email}</p>}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="reg-password" className="form-label">Password</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="reg-password"
              type={showPw ? 'text' : 'password'}
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Min. 8 characters"
              className={`input-field pl-10 pr-10 ${errors.password ? 'border-red-500/50 focus:ring-red-500' : ''}`}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {/* Strength bar */}
          {form.password && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                      i <= strength.level ? strength.color : 'bg-white/10'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-slate-400">{strength.label}</span>
            </div>
          )}
          {errors.password && <p className="field-error">{errors.password}</p>}
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirm-password" className="form-label">Confirm password</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="confirm-password"
              type={showPw ? 'text' : 'password'}
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter your password"
              className={`input-field pl-10 ${errors.confirmPassword ? 'border-red-500/50 focus:ring-red-500' : ''}`}
              autoComplete="new-password"
            />
          </div>
          {errors.confirmPassword && <p className="field-error">{errors.confirmPassword}</p>}
        </div>

        {/* Terms */}
        <p className="text-xs text-slate-500 text-center pt-1">
          By registering, you agree to our{' '}
          <a href="#" className="text-brand-400 hover:underline">Terms of Service</a>{' '}
          and{' '}
          <a href="#" className="text-brand-400 hover:underline">Privacy Policy</a>.
        </p>

        {/* Submit */}
        <button
          type="submit"
          id="register-submit-btn"
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <UserPlus size={16} />
          )}
          {loading ? 'Creating account…' : 'Create Account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        Already have an account?{' '}
        <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
};

export default Register;
