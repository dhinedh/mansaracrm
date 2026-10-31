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
const RawMaterialCategoryPage = lazy(() => import('./pages/admin/RawMaterialCategoryPage'));
const InventoriesPage = lazy(() => import('./pages/admin/InventoriesPage'));
const MaterialIssuePage = lazy(() => import('./pages/admin/MaterialIssuePage'));
const AdminInvoiceLedger = lazy(() => import('./pages/admin/AdminInvoiceLedger'));
const AdminInvoiceTemplatePage = lazy(() => import('./pages/admin/AdminInvoiceTemplatePage'));
const AdminAgreementTemplatesPage = lazy(() => import('./pages/admin/AdminAgreementTemplatesPage'));
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
const VendorCategoriesPage = lazy(() => import('./pages/admin/VendorCategoriesPage'));
const VendorPriceAnalysisPage = lazy(() => import('./pages/admin/VendorPriceAnalysisPage'));
const PriceSimulatorPage = lazy(() => import('./pages/admin/PriceSimulatorPage'));
const AdminSalesTeamPage = lazy(() => import('./pages/admin/AdminSalesTeamPage'));
const AdminBeatsPage = lazy(() => import('./pages/admin/AdminBeatsPage'));
const AdminApprovalsPage = lazy(() => import('./pages/admin/AdminApprovalsPage'));
const AdminDarAuditPage = lazy(() => import('./pages/admin/AdminDarAuditPage'));
const AdminCompetitorsPage = lazy(() => import('./pages/admin/AdminCompetitorsPage'));
const AdminFieldOrdersPage = lazy(() => import('./pages/admin/AdminFieldOrdersPage'));
const AdminCollectionsPage = lazy(() => import('./pages/admin/AdminCollectionsPage'));
const AdminSalesPerformancePage = lazy(() => import('./pages/admin/AdminSalesPerformancePage'));

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

// Salesperson Layout & Pages
import SalespersonLayout from './layouts/SalespersonLayout';
const SalesLoginPage = lazy(() => import('./pages/auth/SalesLoginPage'));
const SalesDashboard = lazy(() => import('./pages/sales/SalesDashboard'));
const SalesVisitsPage = lazy(() => import('./pages/sales/SalesVisitsPage'));
const SalesProductsPage = lazy(() => import('./pages/sales/SalesProductsPage'));
const SalesOrdersPage = lazy(() => import('./pages/sales/SalesOrdersPage'));
const SalesCollectionsPage = lazy(() => import('./pages/sales/SalesCollectionsPage'));
const SalesFollowUpsPage = lazy(() => import('./pages/sales/SalesFollowUpsPage'));
const SalesDarPage = lazy(() => import('./pages/sales/SalesDarPage'));
const SalesPerformancePage = lazy(() => import('./pages/sales/SalesPerformancePage'));
const SalesSyncPage = lazy(() => import('./pages/sales/SalesSyncPage'));
const SalesProfilePage = lazy(() => import('./pages/sales/SalesProfilePage'));

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
    if (user.role === 'ADMIN') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (user.role === 'SALESPERSON') {
      return <Navigate to="/sales/dashboard" replace />;
    } else {
      return <Navigate to="/dealer/dashboard" replace />;
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
          <Route path="material-issue" element={
            <ProtectedRoute allowedStaffRoles={['ADMIN', 'B2B_MANAGER']}>
              <MaterialIssuePage />
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
          <Route path="raw-material-categories" element={
            <ProtectedRoute allowedStaffRoles={['ADMIN', 'B2B_MANAGER']}>
              <RawMaterialCategoryPage />
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
          <Route path="invoice-template" element={
            <ProtectedRoute allowedStaffRoles={['ADMIN', 'FINANCE_OFFICER']}>
              <AdminInvoiceTemplatePage />
            </ProtectedRoute>
          } />
          <Route path="invoice-settings" element={
            <ProtectedRoute allowedStaffRoles={['ADMIN', 'FINANCE_OFFICER']}>
              <AdminInvoiceTemplatePage />
            </ProtectedRoute>
          } />
          <Route path="agreement-templates" element={
            <ProtectedRoute allowedStaffRoles={['ADMIN', 'B2B_MANAGER', 'FINANCE_OFFICER']}>
              <AdminAgreementTemplatesPage />
            </ProtectedRoute>
          } />
          <Route path="agreement-editor" element={
            <ProtectedRoute allowedStaffRoles={['ADMIN', 'B2B_MANAGER', 'FINANCE_OFFICER']}>
              <AdminAgreementTemplatesPage />
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
          <Route path="sales-team" element={
            <ProtectedRoute allowedStaffRoles={['ADMIN', 'B2B_MANAGER']}>
              <AdminSalesTeamPage />
            </ProtectedRoute>
          } />
          <Route path="beats" element={
            <ProtectedRoute allowedStaffRoles={['ADMIN', 'B2B_MANAGER']}>
              <AdminBeatsPage />
            </ProtectedRoute>
          } />
          <Route path="sales-approvals" element={
            <ProtectedRoute allowedStaffRoles={['ADMIN', 'B2B_MANAGER', 'FINANCE_OFFICER']}>
              <AdminApprovalsPage />
            </ProtectedRoute>
          } />
          <Route path="sales-dar" element={
            <ProtectedRoute allowedStaffRoles={['ADMIN', 'B2B_MANAGER']}>
              <AdminDarAuditPage />
            </ProtectedRoute>
          } />
          <Route path="competitor-intel" element={
            <ProtectedRoute allowedStaffRoles={['ADMIN', 'B2B_MANAGER']}>
              <AdminCompetitorsPage />
            </ProtectedRoute>
          } />
          <Route path="field-orders" element={
            <ProtectedRoute allowedStaffRoles={['ADMIN', 'B2B_MANAGER']}>
              <AdminFieldOrdersPage />
            </ProtectedRoute>
          } />
          <Route path="sales-collections" element={
            <ProtectedRoute allowedStaffRoles={['ADMIN', 'B2B_MANAGER', 'FINANCE_OFFICER']}>
              <AdminCollectionsPage />
            </ProtectedRoute>
          } />
          <Route path="sales-performance" element={
            <ProtectedRoute allowedStaffRoles={['ADMIN', 'B2B_MANAGER']}>
              <AdminSalesPerformancePage />
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
          <Route path="vendor-categories" element={
            <ProtectedRoute allowedStaffRoles={['ADMIN', 'B2B_MANAGER', 'FINANCE_OFFICER']}>
              <VendorCategoriesPage />
            </ProtectedRoute>
          } />
          <Route path="vendor-price-analysis" element={
            <ProtectedRoute allowedStaffRoles={['ADMIN', 'B2B_MANAGER', 'FINANCE_OFFICER']}>
              <VendorPriceAnalysisPage />
            </ProtectedRoute>
          } />
          <Route path="price-simulator" element={
            <ProtectedRoute allowedStaffRoles={['ADMIN', 'B2B_MANAGER', 'FINANCE_OFFICER']}>
              <PriceSimulatorPage />
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

        {/* Separate Field Salesperson Login Routes */}
        <Route path="/sales/login" element={<SalesLoginPage />} />
        <Route path="/sales-login" element={<Navigate to="/sales/login" replace />} />

        {/* Field Salesperson Portal Protected Routes */}
        <Route
          path="/sales"
          element={
            <ProtectedRoute allowedRole="SALESPERSON">
              <SalespersonLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<SalesDashboard />} />
          <Route path="visits" element={<SalesVisitsPage />} />
          <Route path="customer-360" element={<SalesVisitsPage />} />
          <Route path="competitor-intel" element={<SalesVisitsPage />} />
          <Route path="catalogue" element={<SalesProductsPage />} />
          <Route path="pricing" element={<SalesProductsPage />} />
          <Route path="margins" element={<SalesProductsPage />} />
          <Route path="schemes" element={<SalesProductsPage />} />
          <Route path="stock" element={<SalesProductsPage />} />
          <Route path="orders" element={<SalesOrdersPage />} />
          <Route path="quotations" element={<SalesOrdersPage />} />
          <Route path="tracking" element={<SalesOrdersPage />} />
          <Route path="amendments" element={<SalesOrdersPage />} />
          <Route path="collections" element={<SalesCollectionsPage />} />
          <Route path="follow-ups" element={<SalesFollowUpsPage />} />
          <Route path="dar" element={<SalesDarPage />} />
          <Route path="performance" element={<SalesPerformancePage />} />
          <Route path="sync" element={<SalesSyncPage />} />
          <Route path="profile" element={<SalesProfilePage />} />
          <Route path="help" element={<SalesProfilePage />} />
        </Route>

        {/* Wildcard Fallback redirects to Login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
