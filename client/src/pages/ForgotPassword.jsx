import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [email, setEmail]     = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);

  const validate = () => {
    if (!email)                     return 'Email is required';
    if (!/\S+@\S+\.\S+/.test(email)) return 'Enter a valid email address';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }

    setLoading(true);
    try {
      // TODO: wire up POST /api/auth/forgot-password
      await new Promise((res) => setTimeout(res, 1200)); // Simulated API call
      setSent(true);
      toast.success('Reset link sent!');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center py-4">
        <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={32} className="text-emerald-400" />
        </div>
        <h2 className="font-display font-bold text-2xl text-white mb-3">Check your inbox</h2>
        <p className="text-slate-400 text-sm mb-2">
          We've sent a password reset link to:
        </p>
        <p className="text-white font-medium mb-8">{email}</p>
        <p className="text-slate-500 text-xs mb-8">
          Didn't receive it? Check your spam folder or{' '}
          <button
            onClick={() => setSent(false)}
            className="text-brand-400 hover:text-brand-300 transition-colors"
          >
            try again
          </button>.
        </p>
        <Link to="/login" className="btn-primary justify-center">
          <ArrowLeft size={16} /> Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-brand-500/10 border border-brand-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Mail size={26} className="text-brand-400" />
        </div>
        <h1 className="font-display font-bold text-2xl text-white mb-2">Forgot password?</h1>
        <p className="text-slate-400 text-sm max-w-xs mx-auto">
          No worries — enter your email and we'll send you a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <label htmlFor="forgot-email" className="form-label">Email address</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="forgot-email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              placeholder="you@example.com"
              className={`input-field pl-10 ${error ? 'border-red-500/50 focus:ring-red-500' : ''}`}
              autoComplete="email"
            />
          </div>
          {error && <p className="field-error">{error}</p>}
        </div>

        <button
          type="submit"
          id="forgot-password-submit-btn"
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Send size={16} />
          )}
          {loading ? 'Sending…' : 'Send Reset Link'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={14} /> Back to Sign In
        </Link>
      </div>
    </div>
  );
};

export default ForgotPassword;
