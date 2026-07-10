import { Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AppShell from './layout/AppShell';
import Routers from './pages/Routers';
import Packages from './pages/Packages';
import Customers from './pages/Customers';
import Billing from './pages/Billing';
import Olt from './pages/Olt';
import Tenants from './pages/Tenants';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('sn_token');
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="/tenants" element={<Tenants />} />
        <Route path="routers" element={<Routers />} />
        <Route path="packages" element={<Packages />} />
        <Route path="customers" element={<Customers />} />
        <Route path="billing" element={<Billing />} />
        <Route path="olt" element={<Olt />} />
      </Route>
    </Routes>
  );
}