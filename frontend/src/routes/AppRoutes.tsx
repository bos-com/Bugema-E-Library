import { Navigate, Route, Routes } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import MainLayout from '../app/layouts/MainLayout';
import AuthLayout from '../app/layouts/AuthLayout';
import SimpleAuthLayout from '../app/layouts/SimpleAuthLayout';
import AdminLayout from '../app/layouts/AdminLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import LoadingOverlay from '../components/feedback/LoadingOverlay';

// Lazy load page components for better performance
const HomePage = lazy(() => import('../app/pages/HomePage'));
const CatalogPage = lazy(() => import('../app/pages/CatalogPage'));
const BookDetailPage = lazy(() => import('../app/pages/BookDetailPage'));
const ReaderPage = lazy(() => import('../app/pages/ReaderPage'));
const DashboardPage = lazy(() => import('../app/pages/DashboardPage'));
const AnalyticsPage = lazy(() => import('../app/pages/AnalyticsPage'));
const AnalyticsTimePage = lazy(() => import('../app/pages/analytics/AnalyticsTimePage'));
const AnalyticsStreakPage = lazy(() => import('../app/pages/analytics/AnalyticsStreakPage'));
const AnalyticsPagesPage = lazy(() => import('../app/pages/analytics/AnalyticsPagesPage'));
const AnalyticsCompletionPage = lazy(() => import('../app/pages/analytics/AnalyticsCompletionPage'));
const CompletedBooksPage = lazy(() => import('../app/pages/CompletedBooksPage'));
const ProfilePage = lazy(() => import('../app/pages/ProfilePage'));
const LoginPage = lazy(() => import('../app/pages/LoginPage'));
const RegisterPage = lazy(() => import('../app/pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('../app/pages/ForgotPasswordPage'));
const ResetCodePage = lazy(() => import('../app/pages/ResetCodePage'));
const NewPasswordPage = lazy(() => import('../app/pages/NewPasswordPage'));
const VisitorAccessPage = lazy(() => import('../app/pages/VisitorAccessPage'));
const VisitorRegisterPage = lazy(() => import('../app/pages/VisitorRegisterPage'));
const SubscriptionPlansPage = lazy(() => import('../app/pages/subscription/SubscriptionPlansPage'));
const SubscriptionPaymentPage = lazy(() => import('../app/pages/subscription/SubscriptionPaymentPage'));
const MobileMoneyPaymentPage = lazy(() => import('../app/pages/subscription/MobileMoneyPaymentPage'));
const CardPaymentPage = lazy(() => import('../app/pages/subscription/CardPaymentPage'));
const PayPalPaymentPage = lazy(() => import('../app/pages/subscription/PayPalPaymentPage'));
const AdminOverviewPage = lazy(() => import('../app/pages/admin/AdminOverviewPage'));
const AdminUsersPage = lazy(() => import('../app/pages/admin/AdminUsersPage'));
const AdminSubscriptionsPage = lazy(() => import('../app/pages/admin/AdminSubscriptionsPage'));
const AdminBooksPage = lazy(() => import('../app/pages/admin/AdminBooksPage'));
const AdminCategoriesPage = lazy(() => import('../app/pages/admin/AdminCategoriesPage'));
const UnauthorizedPage = lazy(() => import('../app/pages/UnauthorizedPage'));

const AppRoutes = () => (
  <Suspense fallback={<LoadingOverlay label="Loading..." />}>
    <Routes>
      {/* ... Main Layout Routes ... */}
      <Route element={<MainLayout />}>
        {/* ... */}
        <Route index element={<HomePage />} />
        {/* ... other main routes ... */}
        <Route path="catalog" element={<CatalogPage />} />
        <Route path="catalog/:bookId" element={<BookDetailPage />} />
        <Route
          path="reader/:bookId"
          element={
            <ProtectedRoute>
              <ReaderPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="analytics"
          element={
            <ProtectedRoute>
              <AnalyticsPage />
            </ProtectedRoute>
          }
        />
        {/* ... Analytics Routes ... */}
        <Route
          path="analytics/time"
          element={
            <ProtectedRoute>
              <AnalyticsTimePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="analytics/streak"
          element={
            <ProtectedRoute>
              <AnalyticsStreakPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="analytics/pages"
          element={
            <ProtectedRoute>
              <AnalyticsPagesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="analytics/completion"
          element={
            <ProtectedRoute>
              <AnalyticsCompletionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="books/completed"
          element={
            <ProtectedRoute>
              <CompletedBooksPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route element={<AuthLayout />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="visitor-access" element={<VisitorAccessPage />} />
        <Route path="visitor-register" element={<VisitorRegisterPage />} />
      </Route>

      <Route element={<SimpleAuthLayout />}>
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-code" element={<ResetCodePage />} />
        <Route path="new-password" element={<NewPasswordPage />} />

        <Route path="subscription/plans" element={
          <ProtectedRoute>
            <SubscriptionPlansPage />
          </ProtectedRoute>
        } />
        <Route path="subscription/payment/:planId" element={
          <ProtectedRoute>
            <SubscriptionPaymentPage />
          </ProtectedRoute>
        } />
        <Route path="subscription/payment/:planId/mobile-money/:provider?" element={
          <ProtectedRoute>
            <MobileMoneyPaymentPage />
          </ProtectedRoute>
        } />
        <Route path="subscription/payment/:planId/card" element={
          <ProtectedRoute>
            <CardPaymentPage />
          </ProtectedRoute>
        } />
        <Route path="subscription/payment/:planId/paypal" element={
          <ProtectedRoute>
            <PayPalPaymentPage />
          </ProtectedRoute>
        } />
      </Route>

      <Route
        path="admin"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<AdminOverviewPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="subscriptions" element={<AdminSubscriptionsPage />} />
        <Route path="books" element={<AdminBooksPage />} />
        <Route path="categories" element={<AdminCategoriesPage />} />
      </Route>

      <Route path="unauthorized" element={<UnauthorizedPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Suspense>
);

export default AppRoutes;
