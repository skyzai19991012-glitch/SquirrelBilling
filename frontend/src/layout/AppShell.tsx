import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Activity,
  Building2,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Network,
  Package,
  Router,
  Users,
} from 'lucide-react';
import SquirrelLogo from '../components/SquirrelLogo';

export default function AppShell() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('sn_user') || '{}');

  const logout = () => {
    localStorage.removeItem('sn_token');
    localStorage.removeItem('sn_user');
    navigate('/login');
  };

  const navClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'nav-link active' : 'nav-link';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <div className="brand">
            <div className="logo-brand-mark">
              <SquirrelLogo size={54} compact />
            </div>

            <div>
              <h2>Squirrel</h2>
              <p>Networks ISP Suite</p>
            </div>
          </div>

          <nav className="side-nav">
            <NavLink to="/" end className={navClass}>
              <LayoutDashboard size={18} />
              Command Center
            </NavLink>

            {user?.role === 'SUPER_ADMIN' && (
              <NavLink to="/tenants" className={navClass}>
                <Building2 size={18} />
                Tenants
              </NavLink>
            )}

            {user?.role !== 'SUPER_ADMIN' && (
              <>
                <NavLink to="/customers" className={navClass}>
                  <Users size={18} />
                  Customers
                </NavLink>

                <NavLink to="/packages" className={navClass}>
                  <Package size={18} />
                  Packages
                </NavLink>

                <NavLink to="/routers" className={navClass}>
                  <Router size={18} />
                  MikroTik
                </NavLink>

                <NavLink to="/olt" className={navClass}>
                  <Network size={18} />
                  OLT / ONU
                </NavLink>

                <NavLink to="/billing" className={navClass}>
                  <CreditCard size={18} />
                  Billing
                </NavLink>
              </>
            )}
          </nav>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-status">
            <div className="pulse-dot" />
            <div>
              <strong>Backend Online</strong>
              <p>Router/OLT test required</p>
            </div>
          </div>

          <button className="logout-btn" onClick={logout}>
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div>
            <p className="eyebrow">
              {user?.role === 'SUPER_ADMIN'
                ? 'SAAS SUPER ADMIN'
                : 'LIVE ISP OPERATIONS'}
            </p>

            <h1>
              {user?.role === 'SUPER_ADMIN'
                ? 'Squirrel SaaS Control'
                : 'Squirrel Networks Control Center'}
            </h1>
          </div>

          <div className="topbar-pill">
            <Activity size={18} />
            <span>
              {user?.role === 'SUPER_ADMIN'
                ? 'Super Admin'
                : user?.tenant?.companyName || user?.tenant?.name || 'Realtime Ready'}
            </span>
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
}