import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { X, Mail, Chrome, CheckCircle2, Loader2, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'methods' | 'email' | 'sent';

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { login, sendOtp } = useAuth();
  const [step, setStep] = useState<Step>('methods');
  const [email, setEmail] = useState('');
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

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
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

  const handleClose = () => {
    setStep('methods');
    setEmail('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Header gradient */}
            <div className="hero-gradient p-8 text-white text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="bg-white/20 p-2 rounded-xl">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <span className="text-2xl font-black tracking-tight">Halal-Bazaar</span>
              </div>
              <p className="text-white/80 text-sm">The Ethical Marketplace for Everyone</p>
            </div>

            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Content */}
            <div className="p-8">
              <AnimatePresence mode="wait">
                {step === 'methods' && (
                  <motion.div
                    key="methods"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
                      <p className="text-muted-foreground text-sm mt-1">Sign in to shop halal with confidence</p>
                    </div>

                    <Button
                      id="google-login-btn"
                      onClick={handleGoogleLogin}
                      disabled={loading}
                      className="w-full h-12 text-base gap-3 btn-primary-glow"
                      size="lg"
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Chrome className="w-5 h-5" />
                      )}
                      Continue with Google
                    </Button>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-3 text-muted-foreground font-medium">Or</span>
                      </div>
                    </div>

                    <Button
                      id="email-otp-btn"
                      variant="outline"
                      className="w-full h-12 text-base gap-3"
                      size="lg"
                      onClick={() => setStep('email')}
                    >
                      <Mail className="w-5 h-5" />
                      Sign in with Email OTP
                    </Button>

                    <p className="text-center text-xs text-muted-foreground leading-relaxed">
                      By continuing, you agree to our{' '}
                      <span className="text-primary font-medium cursor-pointer hover:underline">Terms of Service</span>{' '}
                      and{' '}
                      <span className="text-primary font-medium cursor-pointer hover:underline">Privacy Policy</span>.
                    </p>
                  </motion.div>
                )}

                {step === 'email' && (
                  <motion.div
                    key="email"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <div className="text-center mb-6">
                      <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Mail className="w-7 h-7 text-primary" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">Email Sign In</h2>
                      <p className="text-muted-foreground text-sm mt-1">
                        We'll send a secure magic link to your Gmail
                      </p>
                    </div>
                    <form onSubmit={handleSendOtp} className="space-y-4">
                      <Input
                        id="email-otp-input"
                        type="email"
                        placeholder="your@gmail.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="h-12 text-base"
                        required
                        autoFocus
                      />
                      <Button
                        id="send-otp-btn"
                        type="submit"
                        className="w-full h-12 text-base btn-primary-glow"
                        disabled={loading || !email}
                      >
                        {loading ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending…</>
                        ) : (
                          'Send Magic Link'
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full"
                        onClick={() => setStep('methods')}
                      >
                        ← Back to sign in methods
                      </Button>
                    </form>
                  </motion.div>
                )}

                {step === 'sent' && (
                  <motion.div
                    key="sent"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-4"
                  >
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                      <CheckCircle2 className="w-10 h-10 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email!</h2>
                    <p className="text-muted-foreground text-sm mb-1">
                      We sent a magic sign-in link to
                    </p>
                    <p className="font-semibold text-primary mb-6">{email}</p>
                    <p className="text-xs text-muted-foreground bg-muted p-3 rounded-xl">
                      📬 Open your Gmail, click the link, and you'll be signed in automatically.
                      The link expires in 10 minutes.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-6 w-full"
                      onClick={() => { setStep('email'); setEmail(''); }}
                    >
                      Use a different email
                    </Button>
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
