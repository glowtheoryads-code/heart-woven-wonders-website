import React, { useState } from 'react';
import { Customer } from '../types';
import { User, Mail, Lock, CheckCircle, ArrowRight, X } from 'lucide-react';

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCustomer: Customer | null;
  onCustomerChange: (customer: Customer | null) => void;
}

export const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({
  isOpen,
  onClose,
  currentCustomer,
  onCustomerChange,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (mode === 'forgot') {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        setMessage(data.message || 'Password reset link sent to your email.');
      } else if (mode === 'login') {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (data.customer) {
          onCustomerChange(data.customer);
          onClose();
        }
      } else if (mode === 'register') {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email }),
        });
        const data = await res.json();
        if (data.customer) {
          onCustomerChange(data.customer);
          onClose();
        }
      }
    } catch (err: any) {
      setMessage(err.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    onCustomerChange(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="relative bg-gradient-to-b from-[#1e0d37] via-[#140825] to-[#0d0519] border border-[#d4af37]/40 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl text-[#f5ebd7] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#fae8a4] hover:text-white p-1 rounded-full bg-white/5 hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </button>

        {currentCustomer ? (
          <div className="text-center space-y-4 py-2">
            <div className="w-14 h-14 rounded-full bg-[#d4af37]/20 border border-[#ffd700]/50 flex items-center justify-center text-[#ffd700] mx-auto">
              <User className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-cinzel text-xl font-bold text-[#ffd700]">
                {currentCustomer.name}
              </h3>
              <p className="text-xs text-[#c9b78e]">{currentCustomer.email}</p>
              <div className="mt-2 text-[11px] text-[#fae8a4] bg-[#291248] py-1 px-3 rounded-full inline-block border border-white/5">
                Member of Heartwoven Wonders Sanctuary
              </div>
            </div>

            <div className="pt-4 border-t border-[#d4af37]/20 flex flex-col gap-2">
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#ffd700] text-[#120722] font-bold text-xs uppercase tracking-wider"
              >
                Access My Digital Library
              </button>
              <button
                onClick={handleLogout}
                className="w-full py-2 rounded-xl bg-[#281146] text-[#fae8a4] hover:text-white text-xs font-semibold cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <h3 className="font-cinzel text-xl font-bold text-[#ffd700]">
                {mode === 'login' && 'Sign In to Your Library'}
                {mode === 'register' && 'Create Reader Account'}
                {mode === 'forgot' && 'Reset Forgotten Password'}
              </h3>
              <p className="text-xs text-[#c9b78e]">
                {mode === 'login' && 'Access your purchased books, audiobooks, and instant downloads.'}
                {mode === 'register' && 'Join Heartwoven Wonders to sync purchases across all devices.'}
                {mode === 'forgot' && 'Enter your email to receive recovery instructions.'}
              </p>
            </div>

            {message && (
              <div className="p-3 rounded-xl bg-[#281146] border border-[#d4af37]/30 text-xs text-[#fae8a4] text-center">
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 pt-2 text-xs">
              {mode === 'register' && (
                <div className="space-y-1">
                  <label className="text-[#fae8a4] font-semibold">Your Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g. Elena Vance"
                    className="w-full bg-[#1b0a31] border border-[#d4af37]/30 rounded-xl p-2.5 text-[#f5ebd7] focus:outline-none focus:border-[#ffd700]"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[#fae8a4] font-semibold">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your.email@domain.com"
                  className="w-full bg-[#1b0a31] border border-[#d4af37]/30 rounded-xl p-2.5 text-[#f5ebd7] focus:outline-none focus:border-[#ffd700]"
                />
              </div>

              {mode !== 'forgot' && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[#fae8a4] font-semibold">Password</label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => setMode('forgot')}
                        className="text-[11px] text-[#ffd700] hover:underline"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <input
                    type="password"
                    defaultValue="••••••••"
                    className="w-full bg-[#1b0a31] border border-[#d4af37]/30 rounded-xl p-2.5 text-[#f5ebd7] focus:outline-none focus:border-[#ffd700]"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#ffd700] to-[#d4af37] text-[#120722] font-bold text-xs uppercase tracking-widest shadow-md hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>
                  {mode === 'login' && 'Sign In to Library'}
                  {mode === 'register' && 'Create Free Account'}
                  {mode === 'forgot' && 'Send Reset Email'}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            <div className="pt-3 border-t border-[#d4af37]/15 text-center text-xs text-[#c9b78e]">
              {mode === 'login' ? (
                <span>
                  New reader?{' '}
                  <button
                    onClick={() => setMode('register')}
                    className="text-[#ffd700] font-semibold underline hover:text-white"
                  >
                    Create an account
                  </button>
                </span>
              ) : (
                <span>
                  Already registered?{' '}
                  <button
                    onClick={() => setMode('login')}
                    className="text-[#ffd700] font-semibold underline hover:text-white"
                  >
                    Sign In
                  </button>
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
