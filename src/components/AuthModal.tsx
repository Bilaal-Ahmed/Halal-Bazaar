import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { X, Mail, Chrome, Loader2, ShoppingBag, UserPlus, LockKeyhole } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'methods' | 'email' | 'signup' | 'sent';

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { login, register, loginWithEmailPassword, sendOtp, resetPassword } = useAuth();
  const [step, setStep] = useState<Step>('methods');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await login();
      toast.success('Welcome back!');
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      await loginWithEmailPassword(email, password);
      toast.success('Signed in successfully');
      handleClose();
    } catch (err: any) {
      toast.error(err?.message || 'Could not sign in with email');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || password.length < 6) {
      toast.error('Please provide a valid email and password (6+ chars)');
      return;
    }
    setLoading(true);
    try {
      await register(email, password, displayName || email.split('@')[0]);
      toast.success('Account created — please check your inbox for verification');
      handleClose();
    } catch (err: any) {
      toast.error(err?.message || 'Could not create account');
    } finally {
      setLoading(false);
    }
  };

  const sendMagicLink = async () => {
    if (!email) return;
    setLoading(true);
    try {
      await sendOtp(email);
      setStep('sent');
      toast.success('Magic link sent to your email!');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send email. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMagicLink();
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error('Enter your email to reset the password');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email);
      toast.success('Password reset link sent to your email');
    } catch (err: any) {
      toast.error(err?.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('methods');
    setEmail('');
    setPassword('');
    setDisplayName('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
          <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 20 }} transition={{ type: 'spring', damping: 25, stiffness: 400 }} className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="hero-gradient p-8 text-white text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="bg-white/20 p-2 rounded-xl"><ShoppingBag className="w-7 h-7" /></div>
                <span className="text-2xl font-black tracking-tight">Halal-Bazaar</span>
              </div>
              <p className="text-white/80 text-sm">The Ethical Marketplace for Everyone</p>
            </div>
            <button onClick={handleClose} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            <div className="p-8">
              <AnimatePresence mode="wait">
                {step === 'methods' && (
                  <motion.div key="methods" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
                      <p className="text-muted-foreground text-sm mt-1">Sign in to shop halal with confidence</p>
                    </div>
                    <Button id="google-login-btn" onClick={handleGoogleLogin} disabled={loading} className="w-full h-12 text-base gap-3 btn-primary-glow" size="lg">
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Chrome className="w-5 h-5" />}Continue with Google
                    </Button>
                    <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-3 text-muted-foreground font-medium">Or</span></div></div>
                    <Button id="email-login-btn" variant="outline" className="w-full h-12 text-base gap-3" size="lg" onClick={() => setStep('email')}> <Mail className="w-5 h-5" />Sign in with Email</Button>
                    <Button variant="outline" className="w-full h-12 text-base gap-3" size="lg" onClick={() => setStep('signup')}> <UserPlus className="w-5 h-5" />Create account</Button>
                    <Button variant="ghost" className="w-full h-10 text-base gap-3" size="lg" onClick={() => setStep('email')}> <LockKeyhole className="w-4 h-4" />Use magic link</Button>
                    <p className="text-center text-xs text-muted-foreground leading-relaxed">By continuing, you agree to our <span className="text-primary font-medium cursor-pointer hover:underline">Terms of Service</span> and <span className="text-primary font-medium cursor-pointer hover:underline">Privacy Policy</span>.</p>
                  </motion.div>
                )}

                {step === 'email' && (
                  <motion.div key="email" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                    <div className="text-center mb-6">
                      <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4"><Mail className="w-7 h-7 text-primary" /></div>
                      <h2 className="text-2xl font-bold text-gray-900">Email Sign In</h2>
                      <p className="text-muted-foreground text-sm mt-1">Use your email and password, or send a magic link.</p>
                    </div>
                    <form onSubmit={handleEmailLogin} className="space-y-4">
                      <Input id="email-login-input" type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} className="h-12 text-base" required autoFocus />
                      <Input id="password-login-input" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="h-12 text-base" required />
                      <Button id="sign-in-btn" type="submit" className="w-full h-12 text-base btn-primary-glow" disabled={loading || !email || !password}>{loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing in…</> : 'Sign in'}</Button>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" className="flex-1" onClick={handleForgotPassword}>Forgot password</Button>
                        <Button type="button" variant="ghost" className="flex-1" onClick={() => void sendMagicLink()} disabled={loading || !email}>Magic link</Button>
                      </div>
                      <Button type="button" variant="ghost" className="w-full" onClick={() => setStep('methods')}>← Back</Button>
                    </form>
                  </motion.div>
                )}

                {step === 'signup' && (
                  <motion.div key="signup" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                    <div className="text-center mb-6">
                      <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4"><UserPlus className="w-7 h-7 text-primary" /></div>
                      <h2 className="text-2xl font-bold text-gray-900">Create account</h2>
                      <p className="text-muted-foreground text-sm mt-1">Start buying with a secure account.</p>
                    </div>
                    <form onSubmit={handleSignup} className="space-y-4">
                      <Input id="signup-name-input" type="text" placeholder="Full name" value={displayName} onChange={e => setDisplayName(e.target.value)} className="h-12 text-base" />
                      <Input id="signup-email-input" type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} className="h-12 text-base" required autoFocus />
                      <Input id="signup-password-input" type="password" placeholder="Choose a password" value={password} onChange={e => setPassword(e.target.value)} className="h-12 text-base" required />
                      <Button id="signup-btn" type="submit" className="w-full h-12 text-base btn-primary-glow" disabled={loading || !email || !password}> {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating…</> : 'Create account'} </Button>
                      <Button type="button" variant="ghost" className="w-full" onClick={() => setStep('methods')}>← Back</Button>
                    </form>
                  </motion.div>
                )}

                {step === 'sent' && (
                  <motion.div key="sent" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center py-4">
                    <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><Mail className="w-7 h-7 text-green-600" /></div>
                    <h2 className="text-2xl font-bold text-gray-900">Magic link sent</h2>
                    <p className="text-muted-foreground mt-2">Check your inbox and click the link to finish signing in.</p>
                    <Button className="mt-6" onClick={handleClose}>Done</Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
