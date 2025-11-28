import React from 'react';
import AppRoutes from './routes/AppRoutes';
import { AuthProvider } from './context/AuthContext';
import { IssueProvider } from './context/IssueContext';
import Toast from './components/Toast';
import useSyncOfflineIssues from './hooks/useSyncOfflineIssues';
import useGlobalErrorToasts from './hooks/useGlobalErrorToasts';

const App: React.FC = () => {
  const { toast: offlineToast } = useSyncOfflineIssues();
  const globalToast = useGlobalErrorToasts();
  const stackedToasts = [globalToast, offlineToast ? { ...offlineToast } : null].filter(Boolean) as {
    message: string;
    variant?: 'info' | 'success' | 'warning' | 'error';
  }[];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-950 to-slate-950" />
      <div className="absolute -top-32 -right-10 w-72 h-72 md:w-[26rem] md:h-[26rem] rounded-full bg-blue-600/20 blur-[120px]" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[32rem] h-[32rem] rounded-full bg-emerald-500/10 blur-[140px]" />
      <div className="relative z-10 min-h-screen">
        <AuthProvider>
          <IssueProvider>
            <AppRoutes />
          </IssueProvider>
        </AuthProvider>
      </div>
      {stackedToasts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
          {stackedToasts.map((toastItem, index) => (
            <Toast key={`${toastItem.message}-${index}`} message={toastItem.message} variant={toastItem.variant ?? 'info'} />
          ))}
        </div>
      )}
    </div>
  );
};

export default App;