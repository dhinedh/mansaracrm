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
import TransfersPage from './pages/admin/TransfersPage';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';
import NotificationsPage from './pages/admin/NotificationsPage';
import RequestsPage from './pages/admin/RequestsPage';
import ReturnsPage from './pages/admin/ReturnsPage';
import TicketsPage from './pages/admin/TicketsPage';
import ReportsPage from './pages/admin/ReportsPage';
import ForecastingPage from './pages/admin/ForecastingPage';
import CategoriesPage from './pages/admin/CategoriesPage';
import ChannelIntegrationPage from './pages/admin/ChannelIntegrationPage';
import RnDPage from './pages/admin/RnDPage';
import InventoriesPage from './pages/admin/InventoriesPage';

// E-Commerce Pages
import EcomOrdersPage from './pages/admin/EcomOrdersPage';
import EcomCustomersPage from './pages/admin/EcomCustomersPage';
import EcomCombosPage from './pages/admin/EcomCombosPage';
import EcomBannersPage from './pages/admin/EcomBannersPage';
import EcomReviewsPage from './pages/admin/EcomReviewsPage';
import EcomContentPage from './pages/admin/EcomContentPage';
import EcomSettingsPage from './pages/admin/EcomSettingsPage';
import EcomProductsPage from './pages/admin/EcomProductsPage';
import EcomReportsPage from './pages/admin/EcomReportsPage';
import EcomAnalyticsPage from './pages/admin/EcomAnalyticsPage';

// Dealer Pages
import DealerDashboard from './pages/dealer/DealerDashboard';
import StoresPage from './pages/dealer/StoresPage';
import DealerProductsPage from './pages/dealer/DealerProductsPage';
import CartPage from './pages/dealer/CartPage';
import MyLedgersPage from './pages/dealer/MyLedgersPage';
import InvoicesHistoryPage from './pages/dealer/InvoicesHistoryPage';
import WarehouseTransfersPage from './pages/dealer/WarehouseTransfersPage';
import DealerAnalyticsPage from './pages/dealer/DealerAnalyticsPage';
import ProfilePage from './pages/dealer/ProfilePage';

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
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="inventories" element={<InventoriesPage />} />
          <Route path="channel-integration" element={<ChannelIntegrationPage />} />
          <Route path="rnd" element={<RnDPage />} />
          <Route path="transfers" element={<TransfersPage />} />
          <Route path="requests" element={<RequestsPage />} />
          <Route path="returns" element={<ReturnsPage />} />
          <Route path="services" element={<TicketsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="forecasting" element={<ForecastingPage />} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          
          {/* E-Commerce Routes */}
          <Route path="ecom/orders" element={<EcomOrdersPage />} />
          <Route path="ecom/customers" element={<EcomCustomersPage />} />
          <Route path="ecom/combos" element={<EcomCombosPage />} />
          <Route path="ecom/banners" element={<EcomBannersPage />} />
          <Route path="ecom/reviews" element={<EcomReviewsPage />} />
          <Route path="ecom/content" element={<EcomContentPage />} />
          <Route path="ecom/settings" element={<EcomSettingsPage />} />
          <Route path="ecom/products" element={<EcomProductsPage />} />
          <Route path="ecom/reports" element={<EcomReportsPage />} />
          <Route path="ecom/analytics" element={<EcomAnalyticsPage />} />
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
          <Route path="ledgers" element={<MyLedgersPage />} />
          <Route path="invoices" element={<InvoicesHistoryPage />} />
          <Route path="transfers" element={<WarehouseTransfersPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="requests" element={<RequestsPage />} />
          <Route path="returns" element={<ReturnsPage />} />
          <Route path="services" element={<TicketsPage />} />
          <Route path="analytics" element={<DealerAnalyticsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>

        {/* Wildcard Fallback redirects to Login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
