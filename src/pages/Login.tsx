import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  Shield, 
  Lock, 
  Mail, 
  ArrowRight, 
  AlertTriangle,
  Loader2,
  Stethoscope
} from 'lucide-react';
import { cn } from '../lib/utils';

export const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showResend, setShowResend] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const startCooldown = () => {
    setCooldown(60);
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendLink = async () => {
    if (cooldown > 0) return;
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });
      if (error) {
        if (error.message.includes('rate limit')) {
          setError('Email rate limit exceeded. Supabase security has locked email sending for this address. Please wait 5 MINUTES without clicking anything to let the system reset, then try again.');
          return;
        }
        throw error;
      }
      setMessage('Verification code re-sent! Check your inbox.');
      startCooldown();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'signup',
      });
      if (error) throw error;
      setMessage('Clearance established! Redirecting...');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    setShowResend(false);

    try {
      if (isResetMode) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/settings`,
        });
        if (error) throw error;
        setMessage('Password reset link sent! Check your inbox.');
      } else if (isSignUp) {
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        
        if (data.user && data.session) {
          setMessage('Account created! Redirecting...');
        } else {
          setMessage('Account initiated. Please enter the 8-digit code dispatched to your email.');
          setShowOtp(true);
          setShowResend(true);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          if (error.message.includes('Email not confirmed')) {
            setShowOtp(true);
            setShowResend(true);
            
            // Automatically trigger resend so user doesn't have to wait or search for button
            // Only if not in cooldown to avoid hitting rate limits instantly
            if (cooldown === 0) {
              try {
                const { error: resendErr } = await supabase.auth.resend({
                  type: 'signup',
                  email: email,
                });
                if (resendErr) {
                  if (resendErr.message.includes('rate limit')) {
                    setMessage('Security Lock: Multiple email attempts detected. Please wait 5 minutes before your next request to allow the system to reset.');
                  } else {
                    throw resendErr;
                  }
                } else {
                  setMessage('Access pending. A new 8-digit verification code has been dispatched to your email.');
                  startCooldown();
                }
              } catch (resendErr) {
                console.warn("Auto-resend failed", resendErr);
                setMessage('Access pending. Please enter the verification code sent to your email.');
              }
            } else {
              setMessage(`Access pending. Please enter the code sent to your email. (Resend available in ${cooldown}s)`);
            }
            return; // Don't throw error if we are switching to OTP mode
          }
          throw error;
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.1, 0.15, 0.1] 
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-500/20 rounded-full blur-[120px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1.2, 1, 1.2],
            rotate: [0, -90, 0],
            opacity: [0.1, 0.15, 0.1] 
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-rose-500/20 rounded-full blur-[120px]" 
        />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_85%)]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div 
            whileHover={{ rotate: 360 }}
            transition={{ duration: 1 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-cyan-500/10 border border-white/10 mb-6 backdrop-blur-xl group"
          >
            <Stethoscope className="w-10 h-10 text-cyan-400 group-hover:scale-110 transition-transform" />
          </motion.div>
          <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-2">
            MedLink <span className="text-cyan-500">Portal</span>
          </h1>
          <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">
            Emergency Healthcare Network
          </p>
        </div>

        <motion.div 
          layout
          className="glass-card bg-[#0d1414]/90 border border-white/10 backdrop-blur-3xl p-8 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] relative overflow-hidden"
        >
          {/* Animated Accent Line */}
          <motion.div 
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" 
          />
          
          <h2 className="text-2xl font-black text-white uppercase italic tracking-tight mb-8 ml-1">
            {showOtp ? 'Verify Identity' : isResetMode ? 'Reset Password' : isSignUp ? 'Sign Up' : 'Sign In'}
          </h2>

          {!showOtp ? (
            <form onSubmit={handleAuth} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-cyan-400 transition-colors" />
                  <input 
                    type="email" 
                    required
                    placeholder="admin@medlink.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder:text-white/10 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-all font-bold"
                  />
                </div>
              </div>

              {!isResetMode && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Secret Password</label>
                    {!isSignUp && (
                      <button 
                        type="button"
                        onClick={() => setIsResetMode(true)}
                        className="text-[9px] font-black text-cyan-400/40 uppercase hover:text-cyan-400 transition-colors"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-rose-400 transition-colors" />
                    <input 
                      type="password" 
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder:text-white/10 focus:outline-none focus:border-rose-500/40 focus:ring-1 focus:ring-rose-500/20 transition-all font-bold"
                    />
                  </div>
                </div>
              )}

              <AnimatePresence mode="wait">
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex gap-3 items-center"
                  >
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                    <p className="text-[10px] text-rose-200 font-bold uppercase tracking-wider">{error}</p>
                  </motion.div>
                )}
                {message && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex gap-3 items-center"
                  >
                    <Activity className="w-4 h-4 text-emerald-500 shrink-0" />
                    <p className="text-[10px] text-emerald-200 font-bold uppercase tracking-wider">{message}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <button 
                type="submit"
                disabled={loading}
                className="group relative w-full py-4 rounded-2xl bg-cyan-500 overflow-hidden shadow-lg hover:shadow-cyan-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <div className="flex items-center justify-center gap-2 relative z-10 font-black text-white uppercase tracking-[0.2em] text-xs">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                    isResetMode ? 'Send Reset Link' : isSignUp ? 'Sign Up' : 'Sign In'}
                </div>
              </button>
            </form>
          ) : (
            <form onSubmit={verifyOtp} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Authentication Code</label>
                <div className="relative group">
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-emerald-400 transition-colors" />
                  <input 
                    type="text" 
                    required
                    maxLength={8}
                    placeholder="00000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-2xl tracking-[0.3em] text-center text-white placeholder:text-white/10 focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition-all font-black"
                  />
                </div>
              </div>

              <AnimatePresence mode="wait">
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex gap-3 items-center"
                  >
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                    <p className="text-[10px] text-rose-200 font-bold uppercase tracking-wider">{error}</p>
                  </motion.div>
                )}
                {message && (
                  <div className="space-y-4">
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex gap-3 items-center">
                      <Activity className="w-4 h-4 text-emerald-500 shrink-0" />
                      <p className="text-[10px] text-emerald-200 font-bold uppercase tracking-wider">{message}</p>
                    </div>
                  </div>
                )}
              </AnimatePresence>

              <div className="flex flex-col gap-3">
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-emerald-500 text-xs font-black text-white uppercase tracking-widest shadow-lg hover:shadow-emerald-500/20 transition-all"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Establish Clearance'}
                </button>
                <button 
                  type="button"
                  onClick={handleResendLink}
                  disabled={loading || cooldown > 0}
                  className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-[9px] font-black text-white/40 uppercase tracking-widest hover:text-emerald-400 transition-all disabled:opacity-30"
                >
                  {cooldown > 0 ? `Resend available in ${cooldown}s` : 'Resend Verification Code'}
                </button>
                <button 
                  type="button"
                  onClick={() => setShowOtp(false)}
                  className="text-[9px] font-black text-white/20 uppercase tracking-widest hover:text-white transition-all text-center mt-2"
                >
                  Incorrect email? Back to Sign Up
                </button>
              </div>
            </form>
          )}

          {!showOtp && (
            <div className="mt-8 pt-6 border-t border-white/5 flex flex-col gap-3 items-center">
              {isResetMode ? (
                <button 
                  onClick={() => setIsResetMode(false)}
                  className="text-[10px] font-black text-white/40 uppercase tracking-widest hover:text-cyan-400 transition-colors"
                >
                  Back to Sign In
                </button>
              ) : (
                <button 
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError(null);
                    setMessage(null);
                  }}
                  className="text-[10px] font-black text-white/40 uppercase tracking-widest hover:text-cyan-400 transition-colors"
                >
                  {isSignUp ? 'Already have an account? Sign In' : 'New operator? Request Sign Up'}
                </button>
              )}
            </div>
          )}
        </motion.div>

        <div className="mt-10 flex items-center justify-center gap-4 opacity-20 hover:opacity-100 transition-opacity">
          <Shield className="w-3 h-3 text-white" />
          <div className="w-px h-3 bg-white" />
          <span className="text-[8px] font-black text-white uppercase tracking-[0.3em]">Secure Data Access Protocol</span>
        </div>
      </motion.div>
    </div>
  );
};
