import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../lib/store/auth';
import LoadingOverlay from './feedback/LoadingOverlay';

interface ProtectedRouteProps {
  roles?: Array<'USER' | 'ADMIN'>;
  children: ReactNode;
}

const ProtectedRoute = ({ roles, children }: ProtectedRouteProps) => {
  const location = useLocation();
  const { user, isHydrated } = useAuthStore();

  if (!isHydrated) {
    return <LoadingOverlay label="Preparing your library experience" />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
