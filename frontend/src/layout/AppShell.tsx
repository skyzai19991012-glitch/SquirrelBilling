import {
  Activity,
  Banknote,
  Boxes,
  Gauge,
  LogOut,
  Network,
  Package,
  Router,
  Users,
} from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import SquirrelLogo from '../components/SquirrelLogo';

const links = [
  { to: '/', label: 'Command Center', icon: Gauge },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/packages', label: 'Packages', icon: Package },
  { to: '/routers', label: 'MikroTik', icon: Router },
  { to: '/olt', label: 'OLT / ONU', icon: Network },
  { to: '/billing', label: 'Billing', icon: Banknote },
];

export default function AppShell() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem('sn_token');
    localStorage.removeItem('sn_user');
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark logo-brand-mark">
           <SquirrelLogo size={48} compact />
          </div>
          <div>
            <h1>Squirrel</h1>
            <p>Networks ISP Suite</p>
          </div>
        </div>

        <nav className="nav">
          {links.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  isActive ? 'nav-link active' : 'nav-link'
                }
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-card">
          <div className="pulse-dot" />
          <div>
            <strong>System Online</strong>
            <p>Router/OLT test required</p>
          </div>
        </div>

        <button className="logout" onClick={logout}>
          <LogOut size={18} />
          Logout
        </button>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">Live ISP Operations</p>
            <h2>Squirrel Networks Control Center</h2>
          </div>

          <div className="status-pill">
            <Activity size={17} />
            Realtime Ready
          </div>
        </header>

        <Outlet />
      </main>

      <div className="glow glow-one" />
      <div className="glow glow-two" />
      <div className="grid-bg" />
    </div>
  );
}