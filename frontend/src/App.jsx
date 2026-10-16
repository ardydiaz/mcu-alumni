import { AuthProvider } from './context/AuthContext.jsx';
import { PortalAuthProvider } from './context/PortalAuthContext.jsx';
import AppRoutes from './routes/AppRoutes.jsx';

export default function App() {
  return (
    <AuthProvider>
      <PortalAuthProvider>
        <AppRoutes />
      </PortalAuthProvider>
    </AuthProvider>
  );
}
