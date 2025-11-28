import React, { useState } from 'react';
import { FirebaseError } from 'firebase/app';
import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../components/Button';
import { Input } from '../components/Input';
import Card from '../components/Card';
import PageWrapper from '../components/PageWrapper';
import { auth } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { ensureUserProfile } from '../services/userService';
import { UserRole } from '../types';

const Login: React.FC = () => {
  const [formValues, setFormValues] = useState({ identifier: '', password: '' });
  const [status, setStatus] = useState<{ loading: boolean; error: string | null; success: string | null }>({
    loading: false,
    error: null,
    success: null,
  });
  const [oauthLoading, setOauthLoading] = useState(false);
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();

  const routeForRole = (role: UserRole) => {
    switch (role) {
      case 'staff':
        return '/staff/dashboard';
      case 'admin':
        return '/admin/dashboard';
      default:
        return '/citizen/dashboard';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValues.identifier || !formValues.password) {
      setStatus((prev) => ({ ...prev, error: 'Email and password are required.' }));
      return;
    }

    setStatus({ loading: true, error: null, success: null });

    try {
      const credential = await signInWithEmailAndPassword(auth, formValues.identifier.trim(), formValues.password);
      const firebaseUser = credential.user;
      let role: UserRole = 'citizen';

      if (firebaseUser) {
        const profile = await ensureUserProfile({
          uid: firebaseUser.uid,
          name: firebaseUser.displayName ?? '',
          email: firebaseUser.email ?? formValues.identifier.trim(),
          role: 'citizen',
          phoneNumber: firebaseUser.phoneNumber ?? undefined,
          phoneVerified: Boolean(firebaseUser.phoneNumber),
        });
        role = profile.role;
        await refreshProfile();
      }
      setStatus({ loading: false, error: null, success: 'Login successful! Redirecting...' });

      setTimeout(() => {
        navigate(routeForRole(role));
      }, 1000);
    } catch (err) {
      const message = err instanceof FirebaseError ? err.message : 'Unable to log in. Please try again.';
      setStatus({ loading: false, success: null, error: message });
    }
  };

  const handleGoogleSignIn = async () => {
    setStatus({ loading: false, error: null, success: null });
    setOauthLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const credential = await signInWithPopup(auth, provider);
      const firebaseUser = credential.user;
      if (!firebaseUser) {
        throw new Error('Missing Google account information.');
      }

      const profile = await ensureUserProfile({
        uid: firebaseUser.uid,
        name: firebaseUser.displayName ?? '',
        email: firebaseUser.email ?? '',
        role: 'citizen',
        phoneNumber: firebaseUser.phoneNumber ?? undefined,
        phoneVerified: Boolean(firebaseUser.phoneNumber),
      });

      await refreshProfile();
      setStatus({ loading: false, error: null, success: 'Signed in with Google. Redirecting...' });
      setTimeout(() => navigate(routeForRole(profile.role)), 800);
    } catch (err) {
      const message = err instanceof FirebaseError ? err.message : 'Google sign-in failed. Please try again.';
      setStatus({ loading: false, success: null, error: message });
    } finally {
      setOauthLoading(false);
    }
  };

  return (
    <PageWrapper>
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-slate-950 to-slate-950" />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative w-full max-w-md"
        >
          <Card className="bg-white/5 border-white/10 backdrop-blur-2xl shadow-[0_25px_80px_rgba(15,23,42,0.65)]">
            <div className="text-center mb-8">
              <p className="text-xs uppercase tracking-[0.3em] text-blue-200/70 mb-3">Welcome</p>
              <h2 className="text-3xl font-bold text-white mb-2">Welcome back to CivicFix</h2>
              <p className="text-slate-400">Login to track and report issues in your community.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {status.error && (
                <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200" aria-live="polite">
                  {status.error}
                </div>
              )}
              {status.success && (
                <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200" aria-live="polite">
                  {status.success}
                </div>
              )}
              <Input
                type="text"
                label="Email or Phone"
                placeholder="you@example.com"
                value={formValues.identifier}
                onChange={(e) => setFormValues((prev) => ({ ...prev, identifier: e.target.value }))}
                required
              />
              <Input
                type="password"
                label="Password"
                placeholder="••••••••"
                value={formValues.password}
                onChange={(e) => setFormValues((prev) => ({ ...prev, password: e.target.value }))}
                required
              />
              <Button type="submit" fullWidth disabled={status.loading}>
                {status.loading ? 'Logging in...' : 'Log in'}
              </Button>
            </form>

            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 text-slate-500 text-xs uppercase tracking-[0.3em]">
                <span className="flex-1 h-px bg-white/10" />
                <span>or</span>
                <span className="flex-1 h-px bg-white/10" />
              </div>
              <Button
                type="button"
                variant="secondary"
                fullWidth
                onClick={handleGoogleSignIn}
                isLoading={oauthLoading}
                disabled={status.loading || oauthLoading}
                className="bg-white text-slate-900 border-white/70 hover:bg-white/90"
              >
                Continue with Google
              </Button>
            </div>

            <div className="text-center mt-6">
              <p className="text-sm text-slate-400">
                Don&apos;t have an account?{' '}
                <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium">
                  Register
                </Link>
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    </PageWrapper>
  );
};

export default Login;