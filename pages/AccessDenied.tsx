import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Card from '../components/Card';
import PageWrapper from '../components/PageWrapper';
import { UserRole } from '../types';

interface AccessDeniedState {
  from?: string;
  requiredRoles?: UserRole[];
}

const AccessDenied: React.FC = () => {
  const location = useLocation();
  const state = (location.state as AccessDeniedState) || {};
  const requiredRoles = state.requiredRoles ?? [];
  const roleLabel = requiredRoles.length ? requiredRoles.join(' or ') : 'an authorized role';

  return (
    <PageWrapper>
      <div className="relative min-h-screen flex items-center justify-center bg-slate-950 px-4 py-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-black opacity-70" />
        <Card className="relative z-10 max-w-xl w-full space-y-6 bg-white/5 border-white/10 text-center p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Access restricted</p>
          <h1 className="text-3xl font-semibold text-white">Access denied</h1>
          <p className="text-slate-300">
            You tried to open <span className="font-mono text-white/90">{state.from || 'this page'}</span> but your account is missing the
            required permissions. This area is limited to {roleLabel}.
          </p>
          <div className="space-y-3">
            <a
              href="mailto:support@civicfix.city?subject=Access%20Request"
              className="block rounded-2xl border border-white/20 px-4 py-3 text-white/90 hover:bg-white/10"
            >
              Request access from CivicFix support
            </a>
            <Link
              to="/"
              className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white hover:bg-white/15"
            >
              Return home
            </Link>
          </div>
        </Card>
      </div>
    </PageWrapper>
  );
};

export default AccessDenied;
