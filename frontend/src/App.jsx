// src/App.jsx
import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import DealerLayout from './layouts/DealerLayout';

// Auth Pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const AccessDeniedPage = lazy(() => import('./pages/auth/AccessDeniedPage'));

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const DealersPage = lazy(() => import('./pages/admin/DealersPage'));
const ProductsPage = lazy(() => import('./pages/admin/ProductsPage'));
const InventoryPage = lazy(() => import('./pages/admin/InventoryPage'));
const TransfersPage = lazy(() => import('./pages/admin/TransfersPage'));
const AdminAnalyticsPage = lazy(() => import('./pages/admin/AdminAnalyticsPage'));
const NotificationsPage = lazy(() => import('./pages/admin/NotificationsPage'));
const RequestsPage = lazy(() => import('./pages/admin/RequestsPage'));
const ReturnsPage = lazy(() => import('./pages/admin/ReturnsPage'));
const TicketsPage = lazy(() => import('./pages/admin/TicketsPage'));
const ReportsPage = lazy(() => import('./pages/admin/ReportsPage'));
const ForecastingPage = lazy(() => import('./pages/admin/ForecastingPage'));
const CategoriesPage = lazy(() => import('./pages/admin/CategoriesPage'));
const ChannelIntegrationPage = lazy(() => import('./pages/admin/ChannelIntegrationPage'));
const RnDPage = lazy(() => import('./pages/admin/RnDPage'));
const InventoriesPage = lazy(() => import('./pages/admin/InventoriesPage'));
const AdminInvoiceLedger = lazy(() => import('./pages/admin/AdminInvoiceLedger'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const ZoneMapPage = lazy(() => import('./pages/admin/ZoneMapPage'));
const StallsPage = lazy(() => import('./pages/admin/StallsPage'));
const StallBillingPage = lazy(() => import('./pages/admin/StallBillingPage'));
const ExpensesPage = lazy(() => import('./pages/admin/ExpensesPage'));
const OffersPage = lazy(() => import('./pages/admin/OffersPage'));
const StoreVisitsPage = lazy(() => import('./pages/admin/StoreVisitsPage'));
const RetailStoresPage = lazy(() => import('./pages/admin/RetailStoresPage'));
const B2CStorePage = lazy(() => import('./pages/admin/B2CStorePage'));
const VendorsPage = lazy(() => import('./pages/admin/VendorsPage'));
const ProcurementPage = lazy(() => import('./pages/admin/ProcurementPage'));

// E-Commerce Pages
const EcomOrdersPage = lazy(() => import('./pages/admin/EcomOrdersPage'));
const EcomCustomersPage = lazy(() => import('./pages/admin/EcomCustomersPage'));
const EcomCombosPage = lazy(() => import('./pages/admin/EcomCombosPage'));
const EcomBannersPage = lazy(() => import('./pages/admin/EcomBannersPage'));
const EcomReviewsPage = lazy(() => import('./pages/admin/EcomReviewsPage'));
const EcomContentPage = lazy(() => import('./pages/admin/EcomContentPage'));
const EcomSettingsPage = lazy(() => import('./pages/admin/EcomSettingsPage'));
const EcomProductsPage = lazy(() => import('./pages/admin/EcomProductsPage'));
const EcomReportsPage = lazy(() => import('./pages/admin/EcomReportsPage'));
const EcomAnalyticsPage = lazy(() => import('./pages/admin/EcomAnalyticsPage'));

// Dealer Pages
const DealerDashboard = lazy(() => import('./pages/dealer/DealerDashboard'));
const StoresPage = lazy(() => import('./pages/dealer/StoresPage'));
const DealerProductsPage = lazy(() => import('./pages/dealer/DealerProductsPage'));
const CartPage = lazy(() => import('./pages/dealer/CartPage'));
const MyLedgersPage = lazy(() => import('./pages/dealer/MyLedgersPage'));
const DealerAnalyticsPage = lazy(() => import('./pages/dealer/DealerAnalyticsPage'));
const ProfilePage = lazy(() => import('./pages/dealer/ProfilePage'));

// Loading spinner fallback component
const PageSpinner = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

// Simple Route Protection wrapper
const ProtectedRoute = ({ children, allowedRole }) => {
  const { isAuthenticated, token, user } = useAuthStore();

  if (!isAuthenticated || !token) {
    return <Navigate to="/login" replace />;
  }

  // Primary Role Check
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
      <Suspense fallback={null}>
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
          <Route path="retail-stores" element={
            <ProtectedRoute allowedStaffRoles={['ADMIN', 'B2B_MANAGER']}>
              <RetailStoresPage />
            </ProtectedRoute>
          } />
          <Route path="vendors" element={
            <ProtectedRoute allowedStaffRoles={['ADMIN', 'B2B_MANAGER', 'FINANCE_OFFICER']}>
              <VendorsPage />
            </ProtectedRoute>
          } />
          <Route path="procurement" element={
            <ProtectedRoute allowedStaffRoles={['ADMIN', 'B2B_MANAGER', 'FINANCE_OFFICER']}>
              <ProcurementPage />
            </ProtectedRoute>
          } />
          <Route path="b2c-stores" element={
            <ProtectedRoute allowedStaffRoles={['ADMIN', 'B2B_MANAGER']}>
              <B2CStorePage />
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
      </Suspense>
    </BrowserRouter>
  );
}
