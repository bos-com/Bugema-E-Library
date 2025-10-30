import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/lib/store/auth";
import LoadingSpinner from "./LoadingSpinner";

interface ProtectedRouteProps {
	children: ReactNode;
	requireAdmin?: boolean;
}

export default function ProtectedRoute({
	children,
	requireAdmin = false,
}: ProtectedRouteProps) {
	const { user, isAuthenticated, isLoading } = useAuthStore();
	const location = useLocation();

	if (isLoading) {
		return <LoadingSpinner size="lg" />;
	}

	if (!isAuthenticated || !user) {
		return <Navigate to="/auth/login" state={{ from: location }} replace />;
	}

	if (requireAdmin && user.role !== "ADMIN") {
		return <Navigate to="/dashboard" replace />;
	}

	return <>{children}</>;
}
