import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { IconMenu, IconChevronDown, IconHeadset, IconLogout, IconDashboard } from './icons.jsx';
import { getRole, hasPosAccess, revokePosAccess, logout } from '../services/auth.js';
import logo from '../assets/logo.png';

const NAV_LINKS = [
  ['/', 'Tables'],
  ['/kitchen', 'Kitchen'],
  ['/menu-management', 'Menu Management'],
  ['/reports', 'Report'],
];

export default function TopToolbar({ printerConnected, printerChecked }) {
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);
  const isAdminPreview = getRole() === 'admin' && hasPosAccess();

  function handleLogout() {
    logout();
    setNavOpen(false);
    navigate('/login');
  }

  function handleBackToAdmin() {
    revokePosAccess();
    navigate('/admin');
  }

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white">
      <div className="max-w-[1600px] w-full mx-auto flex items-center gap-4 px-4 py-2">
        <img src={logo} alt="Lavanya Plaza" className="h-7 w-auto shrink-0" />

        <div className="relative">
          <button
            onClick={() => setNavOpen((v) => !v)}
            aria-label="Menu"
            title="Menu"
            className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-ink hover:bg-line/40 whitespace-nowrap"
          >
            <IconMenu className="w-4 h-4" />
            <IconChevronDown className={`w-3.5 h-3.5 transition-transform ${navOpen ? 'rotate-180' : ''}`} />
          </button>
          {navOpen && (
            <div className="absolute left-0 top-full mt-1 w-48 bg-white border border-line rounded-md shadow-md z-20 py-1">
              {NAV_LINKS.map(([to, label]) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setNavOpen(false)}
                  className={({ isActive }) =>
                    `block px-3 py-1.5 text-sm ${isActive ? 'bg-navy text-white' : 'hover:bg-line/40'}`
                  }
                >
                  {label}
                </NavLink>
              ))}
              <button
                onClick={handleLogout}
                className="block w-full text-left px-3 py-1.5 text-sm text-rust border-t border-line mt-1 pt-2 hover:bg-line/40"
              >
                Logout
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 bg-rust text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-rust/90 whitespace-nowrap"
        >
          Table View
        </button>

        <div className="flex items-center gap-4 ml-auto pl-4">
          {isAdminPreview && (
            <button
              onClick={handleBackToAdmin}
              className="flex items-center gap-1.5 bg-amber text-white text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-amber/90 whitespace-nowrap"
            >
              <IconDashboard className="w-3.5 h-3.5" />
              Back to Admin Panel
            </button>
          )}
          <div className="flex items-center gap-1.5 text-xs font-mono whitespace-nowrap">
            <span
              className={`status-dot ${
                !printerChecked ? 'bg-line' : printerConnected ? 'bg-sage' : 'bg-rust'
              }`}
            />
            <span className="text-ink-soft hidden xl:inline">
              {!printerChecked ? 'Checking printer…' : printerConnected ? 'Printer ready' : 'Printer offline'}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-navy text-white rounded-full pl-2 pr-3 py-1 text-xs whitespace-nowrap">
            <IconHeadset className="w-4 h-4" />
            <div className="leading-tight text-left">
              <div className="text-[10px] opacity-80">Call for Support</div>
              <div className="font-semibold">24 X 7 Days</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 border border-line rounded-md px-3 py-1.5 text-xs font-medium text-rust hover:bg-rust/5 whitespace-nowrap"
          >
            <IconLogout className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
