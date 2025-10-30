import { Routes, Route } from "react-router-dom";
import { useAuthStore } from "@/lib/store/auth";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";

// Layouts
import MainLayout from "@/app/layouts/MainLayout";
import AuthLayout from "@/app/layouts/AuthLayout";
import AdminLayout from "@/app/layouts/AdminLayout";

// Pages
import HomePage from "@/app/pages/HomePage";
import CatalogPage from "@/app/pages/CatalogPage";
import BookDetailPage from "@/app/pages/BookDetailPage";
import BookReaderPage from "@/app/pages/BookReaderPage";
import DashboardPage from "@/app/pages/DashboardPage";
import LoginPage from "@/app/pages/LoginPage";
import RegisterPage from "@/app/pages/RegisterPage";
import AdminBooksPage from "@/app/pages/admin/AdminBooksPage";
import AdminCategoriesPage from "@/app/pages/admin/AdminCategoriesPage";
import AdminAnalyticsPage from "@/app/pages/admin/AdminAnalyticsPage";

// Components
import ProtectedRoute from "@/app/components/ProtectedRoute";
import LoadingSpinner from "@/app/components/LoadingSpinner";

function App() {
	const { user, isLoading, checkAuth } = useAuthStore();

	useEffect(() => {
		checkAuth();
	}, [checkAuth]);

	if (isLoading) {
		return <LoadingSpinner />;
	}

	return (
		<div className="min-h-screen bg-background">
			<Routes>
				{/* Public routes */}
				<Route path="/" element={<MainLayout />}>
					<Route index element={<HomePage />} />
					<Route path="catalog" element={<CatalogPage />} />
					<Route path="book/:id" element={<BookDetailPage />} />
					<Route path="book/:id/read" element={<BookReaderPage />} />
				</Route>

				{/* Auth routes */}
				<Route path="/auth" element={<AuthLayout />}>
					<Route path="login" element={<LoginPage />} />
					<Route path="register" element={<RegisterPage />} />
				</Route>

				{/* Protected user routes */}
				<Route
					path="/dashboard"
					element={
						<ProtectedRoute>
							<MainLayout />
						</ProtectedRoute>
					}
				>
					<Route index element={<DashboardPage />} />
				</Route>

				{/* Admin routes */}
				<Route
					path="/admin"
					element={
						<ProtectedRoute requireAdmin>
							<AdminLayout />
						</ProtectedRoute>
					}
				>
					<Route index element={<AdminBooksPage />} />
					<Route path="books" element={<AdminBooksPage />} />
					<Route
						path="categories"
						element={<AdminCategoriesPage />}
					/>
					<Route path="analytics" element={<AdminAnalyticsPage />} />
				</Route>
			</Routes>
		</div>
	);
}

export default App;
