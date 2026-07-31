import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import TablesPage from './pages/TablesPage.jsx';
import OrderPage from './pages/OrderPage.jsx';
import KotPage from './pages/KotPage.jsx';
import MenuPage from './pages/MenuPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import useQzTray from './hooks/useQzTray.js';
import TopToolbar from './components/TopToolbar.jsx';
import PwaUpdatePrompt from './components/PwaUpdatePrompt.jsx';
import AdminLayout from './components/AdminLayout.jsx';
import { MenuProvider } from './context/MenuContext.jsx';
import { TableProvider } from './context/TableContext.jsx';
import { KotProvider } from './context/KotContext.jsx';
import { SettingsProvider } from './context/SettingsContext.jsx';
import { UserProvider } from './context/UserContext.jsx';
import { WaiterProvider } from './context/WaiterContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { isAuthenticated, getRole, hasPosAccess } from './services/auth.js';

function RequireAuth({ children }) {
  const location = useLocation();
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

// Each role only ever sees its own realm: a POS user hitting /admin/* bounces
// to the table view, and an admin hitting the POS routes bounces to /admin —
// unless the admin has hit "POS Access" to operate the counter themselves.
function RequireRole({ role, children }) {
  const currentRole = getRole();
  if (currentRole === role) return children;
  if (role === 'pos' && currentRole === 'admin' && hasPosAccess()) return children;
  return <Navigate to={currentRole === 'admin' ? '/admin' : '/'} replace />;
}

function AppLayout() {
  const { connected, checked } = useQzTray();

  return (
    <div className="app-shell bg-paper">
      <TopToolbar printerConnected={connected} printerChecked={checked} />

      <main className="flex-1 max-w-[1600px] w-full mx-auto px-6 py-6">
        <Routes>
          <Route path="/" element={<TablesPage />} />
          <Route path="/order/:tableId" element={<OrderPage />} />
          <Route path="/kitchen" element={<KotPage />} />
          <Route path="/menu-management" element={<MenuPage />} />
          <Route path="/reports" element={<ReportsPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
      <PwaUpdatePrompt />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <RequireAuth>
              <SettingsProvider>
                <WaiterProvider>
                  <MenuProvider>
                    <TableProvider>
                      <KotProvider>
                        <Routes>
                          <Route
                            path="/admin/*"
                            element={
                              <RequireRole role="admin">
                                <UserProvider>
                                  <AdminLayout />
                                </UserProvider>
                              </RequireRole>
                            }
                          />
                          <Route
                            path="/*"
                            element={
                              <RequireRole role="pos">
                                <AppLayout />
                              </RequireRole>
                            }
                          />
                        </Routes>
                      </KotProvider>
                    </TableProvider>
                  </MenuProvider>
                </WaiterProvider>
              </SettingsProvider>
            </RequireAuth>
          }
        />
      </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}
