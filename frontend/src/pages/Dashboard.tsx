import { useQuery } from '@tanstack/react-query';
import {
  Banknote,
  Boxes,
  Network,
  Router,
  ShieldCheck,
  Users,
  Wifi,
} from 'lucide-react';
import { api } from '../api/client';

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  sub: string;
  icon: any;
}) {
  return (
    <div className="stat-card">
      <div className="stat-icon">
        <Icon size={23} />
      </div>
      <div>
        <p>{title}</p>
        <h3>{value}</h3>
        <span>{sub}</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const res = await api.get('/dashboard/summary');
      return res.data;
    },
  });

  if (isLoading) {
    return <div className="glass-panel">Loading command center...</div>;
  }

  return (
    <div className="page">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Network Overview</p>
          <h1>Operations Dashboard</h1>
          <p>
            Monitor customers, routers, billing, OLTs and ONU activity from one
            futuristic control layer.
          </p>
        </div>

        <div className="hero-signal">
          <Wifi size={44} />
          <span>LIVE</span>
        </div>
      </section>

      <section className="stats-grid">
        <StatCard
          title="Customers"
          value={data?.customers?.total ?? 0}
          sub={`${data?.customers?.active ?? 0} active`}
          icon={Users}
        />

        <StatCard
          title="Routers"
          value={data?.routers?.total ?? 0}
          sub={`${data?.routers?.active ?? 0} configured`}
          icon={Router}
        />

        <StatCard
          title="OLT Devices"
          value={data?.olt?.totalOlts ?? 0}
          sub={`${data?.olt?.activeOlts ?? 0} configured`}
          icon={Network}
        />

        <StatCard
          title="ONU Units"
          value={data?.olt?.totalOnus ?? 0}
          sub={`${data?.olt?.onlineOnus ?? 0} online`}
          icon={Boxes}
        />

        <StatCard
          title="Today Collection"
          value={`Rs. ${data?.billing?.todayCollection ?? 0}`}
          sub="cashflow today"
          icon={Banknote}
        />

        <StatCard
          title="Outstanding"
          value={`Rs. ${data?.billing?.outstanding ?? 0}`}
          sub={`${data?.billing?.overdueInvoices ?? 0} overdue`}
          icon={ShieldCheck}
        />
      </section>

      <section className="two-grid">
        <div className="glass-panel">
          <h2>Network Pulse</h2>
          <div className="pulse-lines">
            <span />
            <span />
            <span />
            <span />
          </div>
          <p className="muted">
            MikroTik, PPPoE and GPON monitoring modules are active.
          </p>
        </div>

        <div className="glass-panel">
          <h2>Billing Engine</h2>
          <p className="big-number">
            Rs. {data?.billing?.monthlyCollection ?? 0}
          </p>
          <p className="muted">Monthly collection recorded in the system.</p>
        </div>
      </section>
    </div>
  );
}