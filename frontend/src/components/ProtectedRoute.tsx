import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen"><div className="animate-spin w-8 h-8 border-4 border-brand-200 border-t-brand-500 rounded-full"></div></div>;
  }

  if (!user) {
    return <Navigate to="/staff-login" replace />;
  }

  return <>{children}</>;
}
