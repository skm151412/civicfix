import React, { useState, useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, LayoutDashboard, FilePlus2, ListChecks, Users, Briefcase, Map, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { badgeMap } from '../config/badges';
import VerifiedBadge from './VerifiedBadge';

const navConfig: Record<UserRole, Array<{ label: string; to: string; icon: React.ComponentType<{ size?: number }> }>> = {
  citizen: [
    { label: 'Dashboard', to: '/citizen/dashboard', icon: LayoutDashboard },
    { label: 'Report Issue', to: '/citizen/report', icon: FilePlus2 },
    { label: 'My Issues', to: '/citizen/issues', icon: ListChecks },
    { label: 'Map View', to: '/citizen/map', icon: MapPin },
    { label: 'Leaderboard', to: '/leaderboard', icon: Users },
  ],
  staff: [
    { label: 'Dashboard', to: '/staff/dashboard', icon: LayoutDashboard },
    { label: 'Assigned Issues', to: '/staff/assigned', icon: ListChecks },
    { label: 'Issues on Map', to: '/staff/map', icon: MapPin },
  ],
  admin: [
    { label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Users', to: '/admin/users', icon: Users },
    { label: 'Departments', to: '/admin/departments', icon: Briefcase },
    { label: 'City Map View', to: '/admin/map', icon: Map },
    { label: 'Heatmap View', to: '/admin/heatmap', icon: MapPin },
    { label: 'Leaderboard', to: '/leaderboard', icon: Users },
  ],
};

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile, user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const role = profile?.role;
  const items = useMemo(() => (role ? navConfig[role] : navConfig.citizen), [role]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  if (loading || !role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        Preparing your workspace...
      </div>
    );
  }

  const renderNav = () => (
    <nav className="flex flex-col gap-1">
      {items.map(({ label, to, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-2xl transition-all border border-transparent ${
            isActive
              ? 'bg-white/10 text-white border-white/10 shadow-[0_10px_30px_rgba(15,118,255,0.15)]'
              : 'text-slate-400 hover:text-white hover:bg-white/5 hover:border-white/5'
          }`}
          onClick={() => setSidebarOpen(false)}
        >
          <Icon size={18} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-10 w-72 h-72 bg-blue-600/20 blur-[140px]" />
        <div className="absolute bottom-0 right-0 w-[30rem] h-[30rem] bg-emerald-500/10 blur-[160px]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <header className="w-full px-6 py-4 flex items-center justify-between border-b border-white/5 bg-slate-900/60 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 rounded-xl bg-white/5 hover:bg-white/10"
              onClick={() => setSidebarOpen((prev) => !prev)}
              aria-label="Toggle navigation"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Civic</p>
              <h1 className="text-xl font-semibold text-white">CivicFix</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-2xl text-sm border border-white/10 text-slate-200 hover:text-rose-300 hover:border-rose-400/60 hover:scale-[1.02] transition-all duration-200"
              onClick={handleLogout}
            >
              🔓 Logout
            </button>
            <div className="text-right hidden sm:block">
              <div className="flex items-center gap-2 justify-end">
                <p className="text-sm text-white font-medium">{profile?.name || user?.displayName || user?.email || 'CivicFix User'}</p>
                {profile?.phoneVerified && <VerifiedBadge />}
              </div>
              <p className="text-xs text-slate-400">{role.charAt(0).toUpperCase() + role.slice(1)} role</p>
              <p className="text-xs text-emerald-300 font-semibold">Karma {profile?.karma ?? 0}</p>
              {profile?.badges?.length ? (
                <div className="mt-1 flex flex-wrap gap-1 justify-end">
                  {profile.badges.slice(0, 3).map((badgeId) => {
                    const badge = badgeMap[badgeId];
                    if (!badge) return null;
                    return (
                      <span
                        key={badgeId}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${badge.color}`}
                        title={badge.description}
                      >
                        {badge.icon} {badge.label}
                      </span>
                    );
                  })}
                  {profile.badges.length > 3 && (
                    <span className="text-[10px] text-slate-400">+{profile.badges.length - 3} more</span>
                  )}
                </div>
              ) : null}
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-emerald-400 flex items-center justify-center font-semibold">
              {(profile?.name || user?.displayName || user?.email || 'CF').slice(0, 2).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="flex flex-1 min-h-0 flex-col md:flex-row">
          <aside
            className="hidden md:block md:w-64 md:flex-shrink-0 border-r border-white/5 bg-slate-900/40 backdrop-blur-xl p-6"
          >
            <div className="hidden md:block mb-6">
              <p className="text-xs text-slate-500 uppercase tracking-[0.2em] mb-2">Navigation</p>
              <div className="h-1 w-12 bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full" />
            </div>
            {renderNav()}
          </aside>

          {sidebarOpen && (
            <div
              className="md:hidden px-6 pt-4 pb-2 bg-slate-900/60 backdrop-blur-xl border-b border-white/5"
            >
              {renderNav()}
            </div>
          )}

          <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
            <div className="max-w-6xl mx-auto">
              <div className="bg-slate-900/50 border border-white/5 rounded-3xl shadow-[0_20px_60px_rgba(2,6,23,0.7)] p-4 sm:p-6">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
