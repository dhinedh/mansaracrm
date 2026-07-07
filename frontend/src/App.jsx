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
import AccessDeniedPage from './pages/auth/AccessDeniedPage';

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
import AdminInvoiceLedger from './pages/admin/AdminInvoiceLedger';
import UserManagement from './pages/admin/UserManagement';
import ZoneMapPage from './pages/admin/ZoneMapPage';
import StallsPage from './pages/admin/StallsPage';
import StallBillingPage from './pages/admin/StallBillingPage';
import ExpensesPage from './pages/admin/ExpensesPage';
import OffersPage from './pages/admin/OffersPage';
import StoreVisitsPage from './pages/admin/StoreVisitsPage';

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
import DealerAnalyticsPage from './pages/dealer/DealerAnalyticsPage';
import ProfilePage from './pages/dealer/ProfilePage';

// Simple Route Protection wrapper
const ProtectedRoute = ({ children, allowedRole, allowedStaffRoles }) => {
  const { isAuthenticated, token, user, loading } = useAuthStore();

  if (!isAuthenticated || !token) {
    return <Navigate to="/login" replace />;
  }

  // If loading user profile, show a loading indicator to prevent flash/wrong redirects
  if (loading && !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Primary Role Check
  if (allowedRole && user && user.role !== allowedRole) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin/dashboard' : '/dealer/dashboard'} replace />;
  }

  // Staff Role Check (Only relevant for users with ADMIN primary role)
  if (allowedStaffRoles && user && user.role === 'ADMIN') {
    // ADMIN staffRole is a super admin and bypasses all checks
    if (user.staffRole !== 'ADMIN' && !allowedStaffRoles.includes(user.staffRole)) {
      return <Navigate to="/admin/access-denied" replace />;
    }
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
        <Route path="/admin/access-denied" element={<AccessDeniedPage />} />

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
          <Route path="dealers" element={
            <ProtectedRoute allowedStaffRoles={['ADMIN', 'B2B_MANAGER']}>
              <DealersPage />
            </ProtectedRoute>
          } />
          <Route path="products" element={
            <ProtectedRoute allowedStaffRoles={['ADMIN', 'B2B_MANAGER']}>
              <ProductsPage />
            </ProtectedRoute>
          } />
          <Route path="categories" element={
            <ProtectedRoute allowedStaffRoles={['ADMIN', 'B2B_MANAGER']}>
              <CategoriesPage />
            </ProtectedRoute>
          } />
          <Route path="inventory" element={
            <ProtectedRoute allowedStaffRoles={['ADMIN', 'B2B_MANAGER']}>
              <InventoryPage />
            </ProtectedRoute>
          } />
          <Route path="inventories" element={
            <ProtectedRoute allowedStaffRoles={['ADMIN', 'B2B_MANAGER']}>
              <InventoriesPage />
            </ProtectedRoute>
          } />
          <Route path="channel-integration" element={
            <ProtectedRoute allowedStaffRoles={['ADMIN', 'B2B_MANAGER']}>
              <ChannelIntegrationPage />
            </ProtectedRoute>
          } />
          <Route path="rnd" element={
            <ProtectedRoute allowedStaffRoles={['ADMIN', 'B2B_MANAGER']}>
              <RnDPage />
            </ProtectedRoute>
          } />
          <Route path="transfers" element={
            <ProtectedRoute allowedStaffRoles={['ADMIN', 'B2B_MANAGER']}>
              <TransfersPage />
            </ProtectedRoute>
          } />
          <Route path="requests" element={
            <ProtectedRoute allowedStaffRoles={['ADMIN', 'B2B_MANAGER']}>
              <RequestsPage />
            </ProtectedRoute>
          } />
          <Route path="invoice-ledger" element={
            <ProtectedRoute allowedStaffRoles={['ADMIN', 'FINANCE_OFFICER', 'B2B_MANAGER']}>
              <AdminInvoiceLedger />
            </ProtectedRoute>
          } />
          <Route path="returns" element={
            <ProtectedRoute allowedStaffRoles={['ADMIN', 'SUPPORT_AGENT', 'B2B_MANAGER']}>
              <ReturnsPage />
            </ProtectedRoute>
          } />
          <Route path="services" element={
            <ProtectedRoute allowedStaffRoles={['ADMIN', 'SUPPORT_AGENT']}>
              <TicketsPage />
            </ProtectedRoute>
          } />
          <Route path="reports" element={
            <ProtectedRoute allowedStaffRoles={['ADMIN', 'FINANCE_OFFICER']}>
              <ReportsPage />
            </ProtectedRoute>
          } />
          <Route path="forecasting" element={
            <ProtectedRoute allowedStaffRoles={['ADMIN', 'FINANCE_OFFICER']}>
              <ForecastingPage />
            </ProtectedRoute>
          } />
          <Route path="analytics" element={
            <ProtectedRoute allowedStaffRoles={['ADMIN', 'FINANCE_OFFICER']}>
              <AdminAnalyticsPage />
            </ProtectedRoute>
          } />
          <Route path="users" element={
            <ProtectedRoute allowedStaffRoles={['ADMIN']}>
              <UserManagement />
            </ProtectedRoute>
          } />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="zone-map" element={
            <ProtectedRoute allowedStaffRoles={['ADMIN', 'B2B_MANAGER']}>
              <ZoneMapPage />
            </ProtectedRoute>
          } />
          <Route path="stalls" element={
            <ProtectedRoute allowedStaffRoles={['ADMIN', 'B2B_MANAGER']}>
              <StallsPage />
            </ProtectedRoute>
          } />
          <Route path="expenses" element={
            <ProtectedRoute allowedStaffRoles={['ADMIN', 'FINANCE_OFFICER', 'B2B_MANAGER']}>
              <ExpensesPage />
            </ProtectedRoute>
          } />
          <Route path="offers" element={
            <ProtectedRoute allowedStaffRoles={['ADMIN', 'FINANCE_OFFICER', 'B2B_MANAGER']}>
              <OffersPage />
            </ProtectedRoute>
          } />
          <Route path="stall-billing" element={
            <ProtectedRoute allowedStaffRoles={['ADMIN', 'B2B_MANAGER']}>
              <StallBillingPage />
            </ProtectedRoute>
          } />
          <Route path="store-visits" element={
            <ProtectedRoute allowedStaffRoles={['ADMIN', 'B2B_MANAGER']}>
              <StoreVisitsPage />
            </ProtectedRoute>
          } />
          
          {/* E-Commerce Routes */}
          <Route path="ecom/orders" element={
            <ProtectedRoute allowedStaffRoles={['ADMIN', 'ECOM_MANAGER']}>
              <EcomOrdersPage />
            </ProtectedRoute>
          } />
          <Route path="ecom/customers" element={
            <ProtectedRoute allowedStaffRoles={['ADMIN', 'ECOM_MANAGER']}>
              <EcomCustomersPage />
            </ProtectedRoute>
          } />
          <Route path="ecom/combos" element={
            <ProtectedRoute allowedStaffRoles={['ADMIN', 'ECOM_MANAGER']}>
              <EcomCombosPage />
            </ProtectedRoute>
          } />
          <Route path="ecom/banners" element={
            <ProtectedRoute allowedStaffRoles={['ADMIN', 'ECOM_MANAGER']}>
              <EcomBannersPage />
            </ProtectedRoute>
          } />
          <Route path="ecom/reviews" element={
            <ProtectedRoute allowedStaffRoles={['ADMIN', 'ECOM_MANAGER']}>
              <EcomReviewsPage />
            </ProtectedRoute>
          } />
          <Route path="ecom/content" element={
            <ProtectedRoute allowedStaffRoles={['ADMIN', 'ECOM_MANAGER']}>
              <EcomContentPage />
            </ProtectedRoute>
          } />
          <Route path="ecom/settings" element={
            <ProtectedRoute allowedStaffRoles={['ADMIN', 'ECOM_MANAGER']}>
              <EcomSettingsPage />
            </ProtectedRoute>
          } />
          <Route path="ecom/products" element={
            <ProtectedRoute allowedStaffRoles={['ADMIN', 'ECOM_MANAGER']}>
              <EcomProductsPage />
            </ProtectedRoute>
          } />
          <Route path="ecom/reports" element={
            <ProtectedRoute allowedStaffRoles={['ADMIN', 'ECOM_MANAGER']}>
              <EcomReportsPage />
            </ProtectedRoute>
          } />
          <Route path="ecom/analytics" element={
            <ProtectedRoute allowedStaffRoles={['ADMIN', 'ECOM_MANAGER']}>
              <EcomAnalyticsPage />
            </ProtectedRoute>
          } />
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
          <Route path="invoices" element={<Navigate to="/dealer/ledgers" state={{ activeTab: 'invoices' }} replace />} />
          <Route path="transfers" element={<Navigate to="/dealer/ledgers" state={{ activeTab: 'transfers' }} replace />} />
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
