import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  PlusCircle, 
  List, 
  LogOut, 
  Map, 
  Users, 
  BarChart3,
  Briefcase,
  Menu,
  X
} from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  user: User | null;
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, isOpen, setIsOpen, onLogout }) => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navItemClass = (path: string) => 
    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all mb-1 ${
      isActive(path) 
        ? 'bg-blue-600/20 text-blue-400 border border-blue-600/20 shadow-[0_0_10px_rgba(37,99,235,0.1)]' 
        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
    }`;

  const renderLinks = () => {
    if (!user) return null;

    if (user.role === 'citizen') {
      return (
        <>
          <Link to="/citizen/dashboard" className={navItemClass('/citizen/dashboard')}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>
          <Link to="/citizen/report" className={navItemClass('/citizen/report')}>
            <PlusCircle size={20} />
            <span>Report Issue</span>
          </Link>
          <Link to="/citizen/issues" className={navItemClass('/citizen/issues')}>
            <List size={20} />
            <span>Track Issues</span>
          </Link>
        </>
      );
    }

    if (user.role === 'staff') {
      return (
        <>
          <Link to="/staff/dashboard" className={navItemClass('/staff/dashboard')}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>
          <Link to="/staff/assigned" className={navItemClass('/staff/assigned')}>
            <List size={20} />
            <span>Assigned Issues</span>
          </Link>
          <Link to="/staff/map" className={navItemClass('/staff/map')}>
            <Map size={20} />
            <span>Issues on Map</span>
          </Link>
        </>
      );
    }

    if (user.role === 'admin') {
      return (
        <>
          <Link to="/admin/dashboard" className={navItemClass('/admin/dashboard')}>
            <BarChart3 size={20} />
            <span>Overview</span>
          </Link>
          <Link to="/admin/departments" className={navItemClass('/admin/departments')}>
            <Briefcase size={20} />
            <span>Departments</span>
          </Link>
          <Link to="/admin/users" className={navItemClass('/admin/users')}>
            <Users size={20} />
            <span>User Management</span>
          </Link>
          <Link to="/admin/map" className={navItemClass('/admin/map')}>
            <Map size={20} />
            <span>City Map View</span>
          </Link>
        </>
      );
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        />
      )}

      {/* Sidebar Content */}
      <motion.div
        className={`fixed md:static inset-y-0 left-0 w-64 bg-slate-900/95 backdrop-blur-xl border-r border-white/5 z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center font-bold text-white">C</div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-green-400">
              CivicFix
            </h1>
          </div>
          <button onClick={() => setIsOpen(false)} className="md:hidden text-slate-400">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-3">
          {renderLinks()}
        </div>

        <div className="p-4 border-t border-white/5">
          {user && (
            <div className="flex items-center gap-3 mb-4 px-2">
              <img src={user.avatar || "https://picsum.photos/100"} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-slate-700" />
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                <p className="text-xs text-slate-400 truncate">{user.role}</p>
              </div>
            </div>
          )}
          <button 
            onClick={onLogout}
            className="flex items-center gap-3 w-full px-4 py-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </motion.div>
    </>
  );
};

export default Sidebar;