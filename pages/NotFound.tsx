import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import PageWrapper from '../components/PageWrapper';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <PageWrapper>
      <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-slate-950 to-slate-950" />
        <Card className="relative z-10 w-full max-w-xl text-center space-y-4 py-12 bg-white/5 border-white/10">
          <p className="text-sm uppercase tracking-[0.5em] text-blue-200/70">Oops</p>
          <h1 className="text-6xl font-black text-white">404</h1>
          <h2 className="text-2xl font-semibold text-white">Page Not Found</h2>
          <p className="text-slate-400 max-w-md mx-auto">
            The page you&apos;re looking for has been moved or doesn&apos;t exist. Let&apos;s take you back to the dashboard.
          </p>
          <Button onClick={() => navigate('/')}>Back to Home</Button>
        </Card>
      </div>
    </PageWrapper>
  );
};

export default NotFound;
