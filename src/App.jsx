import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import TablesPage from './pages/TablesPage.jsx';
import OrderPage from './pages/OrderPage.jsx';
import KotPage from './pages/KotPage.jsx';
import MenuPage from './pages/MenuPage.jsx';
import TableManagementPage from './pages/TableManagementPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import useQzTray from './hooks/useQzTray.js';
import TopToolbar from './components/TopToolbar.jsx';
import { MenuProvider } from './context/MenuContext.jsx';
import { TableProvider } from './context/TableContext.jsx';

function isAuthenticated() {
  return Boolean(localStorage.getItem('pos_token') || sessionStorage.getItem('pos_token'));
}

function RequireAuth({ children }) {
  const location = useLocation();
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
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
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/table-management" element={<TableManagementPage />} />
          <Route path="/reports" element={<ReportsPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <RequireAuth>
              <MenuProvider>
                <TableProvider>
                  <AppLayout />
                </TableProvider>
              </MenuProvider>
            </RequireAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
