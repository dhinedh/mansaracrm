// src/App.jsx
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import DealerLayout from './layouts/DealerLayout';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import DealersPage from './pages/admin/DealersPage';
import ProductsPage from './pages/admin/ProductsPage';
import InventoryPage from './pages/admin/InventoryPage';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';
import NotificationsPage from './pages/admin/NotificationsPage';

// Dealer Pages
import DealerDashboard from './pages/dealer/DealerDashboard';
import StoresPage from './pages/dealer/StoresPage';
import DealerProductsPage from './pages/dealer/DealerProductsPage';
import CartPage from './pages/dealer/CartPage';
import InvoicesHistoryPage from './pages/dealer/InvoicesHistoryPage';
import DealerAnalyticsPage from './pages/dealer/DealerAnalyticsPage';
import WarehouseTransfersPage from './pages/dealer/WarehouseTransfersPage';

// Simple Route Protection wrapper
const ProtectedRoute = ({ children, allowedRole }) => {
  const { isAuthenticated, token, user } = useAuthStore();

  if (!isAuthenticated || !token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user && user.role !== allowedRole) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin/dashboard' : '/dealer/dashboard'} replace />;
  }

  return children;
};

export default function App() {
  const { fetchCurrentUser, isAuthenticated, token } = useAuthStore();

  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    }
  }, [token]);

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Admin Dashboard Protected Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRole="ADMIN">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="dealers" element={<DealersPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>

        {/* Dealer Portal Protected Routes */}
        <Route
          path="/dealer"
          element={
            <ProtectedRoute allowedRole="DEALER">
              <DealerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DealerDashboard />} />
          <Route path="stores" element={<StoresPage />} />
          <Route path="products" element={<DealerProductsPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="invoices" element={<InvoicesHistoryPage />} />
          <Route path="transfers" element={<WarehouseTransfersPage />} />
          <Route path="analytics" element={<DealerAnalyticsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>

        {/* Wildcard Fallback redirects to Login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
