import { Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from '../app/layouts/MainLayout';
import AuthLayout from '../app/layouts/AuthLayout';
import SimpleAuthLayout from '../app/layouts/SimpleAuthLayout';
import AdminLayout from '../app/layouts/AdminLayout';
import HomePage from '../app/pages/HomePage';
import CatalogPage from '../app/pages/CatalogPage';
import BookDetailPage from '../app/pages/BookDetailPage';
import ReaderPage from '../app/pages/ReaderPage';
import DashboardPage from '../app/pages/DashboardPage';
import AnalyticsPage from '../app/pages/AnalyticsPage';
import AnalyticsTimePage from '../app/pages/analytics/AnalyticsTimePage';
import AnalyticsStreakPage from '../app/pages/analytics/AnalyticsStreakPage';
import AnalyticsCompletionPage from '../app/pages/analytics/AnalyticsCompletionPage';
import CompletedBooksPage from '../app/pages/CompletedBooksPage';
import ProfilePage from '../app/pages/ProfilePage';
import LoginPage from '../app/pages/LoginPage';
import RegisterPage from '../app/pages/RegisterPage';
import ForgotPasswordPage from '../app/pages/ForgotPasswordPage';
import ResetCodePage from '../app/pages/ResetCodePage';
import NewPasswordPage from '../app/pages/NewPasswordPage';
import AdminOverviewPage from '../app/pages/admin/AdminOverviewPage';
import AdminUsersPage from '../app/pages/admin/AdminUsersPage';
import AdminBooksPage from '../app/pages/admin/AdminBooksPage';
import AdminCategoriesPage from '../app/pages/admin/AdminCategoriesPage';
import UnauthorizedPage from '../app/pages/UnauthorizedPage';
import ProtectedRoute from '../components/ProtectedRoute';

const AppRoutes = () => (
  <Routes>
    <Route element={<MainLayout />}>
      <Route index element={<HomePage />} />
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
    </Route>

    <Route element={<SimpleAuthLayout />}>
      <Route path="forgot-password" element={<ForgotPasswordPage />} />
      <Route path="reset-code" element={<ResetCodePage />} />
      <Route path="new-password" element={<NewPasswordPage />} />
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
      <Route path="books" element={<AdminBooksPage />} />
      <Route path="categories" element={<AdminCategoriesPage />} />
    </Route>

    <Route path="unauthorized" element={<UnauthorizedPage />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default AppRoutes;
