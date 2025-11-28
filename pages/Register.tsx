import React, { useState } from 'react';
import { FirebaseError } from 'firebase/app';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../components/Button';
import { Input, Select } from '../components/Input';
import Card from '../components/Card';
import PageWrapper from '../components/PageWrapper';
import { auth } from '../services/firebase';
import { createUserProfile } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

const roleOptions = [
  { label: 'Citizen', value: 'citizen' },
  { label: 'Staff', value: 'staff' },
];

const Register: React.FC = () => {
  const [formValues, setFormValues] = useState({
    name: '',
    identifier: '',
    password: '',
    confirmPassword: '',
    role: 'citizen',
  });
  const { refreshProfile } = useAuth();

  const handleChange = (key: keyof typeof formValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormValues((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const [status, setStatus] = useState<{ loading: boolean; error: string | null; success: string | null }>({
    loading: false,
    error: null,
    success: null,
  });
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formValues.password !== formValues.confirmPassword) {
      setStatus({ loading: false, error: 'Passwords do not match.', success: null });
      return;
    }

    setStatus({ loading: true, error: null, success: null });

    try {
      const credential = await createUserWithEmailAndPassword(auth, formValues.identifier.trim(), formValues.password);

      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: formValues.name,
        });
      }

      const selectedRole: UserRole = formValues.role === 'staff' ? 'staff' : 'citizen';

      if (credential.user) {
        await createUserProfile({
          uid: credential.user.uid,
          name: formValues.name,
          email: credential.user.email ?? formValues.identifier.trim(),
          role: selectedRole,
          departmentId: null,
          createdAt: new Date().toISOString(),
          karma: 0,
          reportsCount: 0,
          upvoteImpact: 0,
          badges: [],
          phoneVerified: false,
        });
        await refreshProfile();
      }

      setStatus({ loading: false, error: null, success: 'Registration complete! Redirecting to dashboard...' });
      setTimeout(() => navigate(selectedRole === 'staff' ? '/staff/dashboard' : '/citizen/dashboard'), 1200);
    } catch (err) {
      const message = err instanceof FirebaseError ? err.message : 'Unable to register. Please try again.';
      setStatus({ loading: false, success: null, error: message });
    }
  };

  return (
    <PageWrapper>
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-slate-950 to-slate-950" />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative w-full max-w-lg"
        >
          <Card className="bg-white/5 border-white/10 backdrop-blur-2xl shadow-[0_25px_80px_rgba(2,6,23,0.65)]">
            <div className="text-center mb-8">
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/80 mb-3">Join CivicFix</p>
              <h2 className="text-3xl font-bold text-white mb-2">Create your account</h2>
              <p className="text-slate-400">Report issues, track progress, and improve your city.</p>
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
                label="Full Name"
                placeholder="Alex Rivera"
                value={formValues.name}
                onChange={handleChange('name')}
                required
              />
              <Input
                type="text"
                label="Email or Phone"
                placeholder="you@example.com"
                value={formValues.identifier}
                onChange={handleChange('identifier')}
                required
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="password"
                  label="Password"
                  placeholder="••••••••"
                  value={formValues.password}
                  onChange={handleChange('password')}
                  required
                />
                <Input
                  type="password"
                  label="Confirm Password"
                  placeholder="••••••••"
                  value={formValues.confirmPassword}
                  onChange={handleChange('confirmPassword')}
                  required
                />
              </div>
              <Select
                label="Role"
                options={roleOptions}
                value={formValues.role}
                onChange={handleChange('role')}
              />
              <Button type="submit" fullWidth variant="secondary" className="mt-2" disabled={status.loading}>
                {status.loading ? 'Creating account...' : 'Register'}
              </Button>
            </form>

            <div className="text-center mt-6">
              <p className="text-sm text-slate-400">
                Already have an account?{' '}
                <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-medium">
                  Log in
                </Link>
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    </PageWrapper>
  );
};

export default Register;