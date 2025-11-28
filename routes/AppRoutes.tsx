import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from '../pages/LandingPage';
import Login from '../pages/Login';
import Register from '../pages/Register';
import CitizenDashboard from '../pages/CitizenDashboard';
import ReportIssue from '../pages/ReportIssue';
import TrackIssues from '../pages/TrackIssues';
import StaffDashboard from '../pages/StaffDashboard';
import AdminDashboard from '../pages/AdminDashboard';
import MapView from '../pages/MapView';
import IssueDetail from '../pages/IssueDetail';
import CitizenMapView from '../pages/CitizenMapView';
import AdminHeatmap from '../pages/AdminHeatmap';
import Leaderboard from '../pages/Leaderboard';
import NotFound from '../pages/NotFound';
import RoleProtectedRoute from '../components/RoleProtectedRoute';
import StaffAssigned from '../pages/StaffAssigned';
import AdminUsers from '../pages/AdminUsers';
import AdminDepartments from '../pages/AdminDepartments';
import AccessDenied from '../pages/AccessDenied';
import Contact from '../pages/Contact';
import CommunityPartner from '../pages/CommunityPartner';
import OTPPage from '../pages/OTPPage';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/otp" element={<OTPPage />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/partner" element={<CommunityPartner />} />
      <Route path="/access-denied" element={<AccessDenied />} />
      <Route
        path="/citizen/dashboard"
        element={
          <RoleProtectedRoute allowedRoles={['citizen']}>
            <CitizenDashboard />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/citizen/report"
        element={
          <RoleProtectedRoute allowedRoles={['citizen']}>
            <ReportIssue />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/citizen/issues"
        element={
          <RoleProtectedRoute allowedRoles={['citizen']}>
            <TrackIssues />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/citizen/map"
        element={
          <RoleProtectedRoute allowedRoles={['citizen']}>
            <CitizenMapView />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/issues/:issueId"
        element={
          <RoleProtectedRoute allowedRoles={['citizen', 'staff', 'admin']}>
            <IssueDetail />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/staff/dashboard"
        element={
          <RoleProtectedRoute allowedRoles={['staff']}>
            <StaffDashboard />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/staff/assigned"
        element={
          <RoleProtectedRoute allowedRoles={['staff']}>
            <StaffAssigned />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/staff/map"
        element={
          <RoleProtectedRoute allowedRoles={['staff']}>
            <MapView mode="staff" />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <RoleProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <RoleProtectedRoute allowedRoles={['admin']}>
            <AdminUsers />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/admin/departments"
        element={
          <RoleProtectedRoute allowedRoles={['admin']}>
            <AdminDepartments />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/admin/map"
        element={
          <RoleProtectedRoute allowedRoles={['admin']}>
            <MapView mode="admin" />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/admin/heatmap"
        element={
          <RoleProtectedRoute allowedRoles={['admin']}>
            <AdminHeatmap />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/leaderboard"
        element={
          <RoleProtectedRoute allowedRoles={['citizen', 'staff', 'admin']}>
            <Leaderboard />
          </RoleProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
