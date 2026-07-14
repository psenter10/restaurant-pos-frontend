import React from 'react';
import { NavLink, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import {
  IconDashboard,
  IconCutlery,
  IconLayoutGrid,
  IconChartBar,
  IconLogout,
  IconHeadset,
  IconUsers,
  IconBowl,
  IconSettings,
  IconStorefront,
} from './icons.jsx';
import AdminDashboardPage from '../pages/AdminDashboardPage.jsx';
import MenuPage from '../pages/MenuPage.jsx';
import TableManagementPage from '../pages/TableManagementPage.jsx';
import ReportsPage from '../pages/ReportsPage.jsx';
import AdminUsersPage from '../pages/AdminUsersPage.jsx';
import AdminWaitersPage from '../pages/AdminWaitersPage.jsx';
import AdminSettingsPage from '../pages/AdminSettingsPage.jsx';
import { logout, grantPosAccess } from '../services/auth.js';

const NAV_LINKS = [
  { to: '/admin', end: true, icon: IconDashboard, label: 'Dashboard' },
  { to: '/admin/menu', icon: IconCutlery, label: 'Menu Management' },
  { to: '/admin/table-management', icon: IconLayoutGrid, label: 'Table & Floor' },
  { to: '/admin/users', icon: IconUsers, label: 'User Management' },
  { to: '/admin/waiters', icon: IconBowl, label: 'Waiter Management' },
  { to: '/admin/reports', icon: IconChartBar, label: 'Reports' },
  { to: '/admin/settings', icon: IconSettings, label: 'Settings' },
];

function pageTitle(pathname) {
  const match = [...NAV_LINKS].reverse().find((l) => pathname.startsWith(l.to));
  return match?.label || 'Admin Panel';
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  function handlePosAccess() {
    grantPosAccess();
    navigate('/');
  }

  return (
    <div className="min-h-screen flex bg-paper">
      <aside className="w-60 shrink-0 fixed inset-y-0 left-0 bg-navy text-white flex flex-col z-30">
        <div className="px-5 py-5 border-b border-white/10 shrink-0">
          <span className="font-display font-bold text-lg tracking-tight">
            Counter<span className="text-rust">POS</span>
          </span>
          <div className="text-[11px] text-white/50 mt-0.5 uppercase tracking-wide">Admin Panel</div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_LINKS.map(({ to, end, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive ? 'bg-white/10 text-white' : 'text-white/65 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-white/10 shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-md text-sm font-medium text-white/65 hover:bg-white/5 hover:text-white transition-colors"
          >
            <IconLogout className="w-4 h-4 shrink-0" />
            Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 ml-60">
        <header className="flex items-center justify-between gap-4 px-6 py-3.5 border-b border-line bg-white">
          <h1 className="font-display text-lg font-semibold text-ink">{pageTitle(location.pathname)}</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePosAccess}
              title="Operate the POS screens as if you were a counter user"
              className="flex items-center gap-1.5 bg-rust text-white text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-rust/90"
            >
              <IconStorefront className="w-3.5 h-3.5" />
              POS Access
            </button>
            <div className="flex items-center gap-2 bg-navy/5 text-navy rounded-full pl-2 pr-3 py-1 text-xs">
              <IconHeadset className="w-4 h-4" />
              <span className="font-semibold">Admin</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route index element={<AdminDashboardPage />} />
            <Route path="menu" element={<MenuPage />} />
            <Route path="table-management" element={<TableManagementPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="waiters" element={<AdminWaitersPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
