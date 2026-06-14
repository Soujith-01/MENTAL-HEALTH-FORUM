import { Navigate } from "react-router";
import { useAuthStore } from "../store/authStore";

function ProtectedAdminRoute({ children }) {
  const currentUser = useAuthStore((state) => state.currentUser);

  if (!currentUser || currentUser.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedAdminRoute;
