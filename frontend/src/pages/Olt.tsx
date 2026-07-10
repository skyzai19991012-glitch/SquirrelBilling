import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Cable,
  Network,
  Plus,
  PlugZap,
  RadioTower,
  Router,
  Wifi,
} from 'lucide-react';
import { api } from '../api/client';
import type { OltDevice, OnuDevice } from '../types';

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

export default function Olt() {
  const queryClient = useQueryClient();

  const [oltForm, setOltForm] = useState({
    name: '',
    vendor: 'HUAWEI',
    host: '',
    port: 22,
    username: '',
    password: '',
    active: true,
  });

  const [onuForm, setOnuForm] = useState({
    oltId: '',
    serialNumber: '',
    ponPort: '',
    onuId: '',
    vlan: '',
    rxPower: '',
    txPower: '',
    distance: '',
    online: true,
    customerName: '',
    customerPhone: '',
  });

  const { data: summary } = useQuery({
    queryKey: ['olt-summary'],
    queryFn: async () => {
      const res = await api.get('/olts/summary');
      return res.data;
    },
  });

  const { data: olts = [], isLoading: oltsLoading } = useQuery<OltDevice[]>({
    queryKey: ['olts'],
    queryFn: async () => {
      const res = await api.get('/olts');
      return res.data;
    },
  });

  const { data: onus = [], isLoading: onusLoading } = useQuery<OnuDevice[]>({
    queryKey: ['onus'],
    queryFn: async () => {
      const res = await api.get('/olts/onus');
      return res.data;
    },
  });

  const createOlt = useMutation({
    mutationFn: async () => {
      const body = {
        name: oltForm.name,
        vendor: oltForm.vendor,
        host: oltForm.host,
        port: Number(oltForm.port),
        username: oltForm.username,
        password: oltForm.password,
        active: oltForm.active,
      };

      const res = await api.post('/olts', body);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['olts'] });
      queryClient.invalidateQueries({ queryKey: ['olt-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });

      setOltForm({
        name: '',
        vendor: 'HUAWEI',
        host: '',
        port: 22,
        username: '',
        password: '',
        active: true,
      });
    },
  });

  const createOnu = useMutation({
    mutationFn: async () => {
      const body = {
        oltId: onuForm.oltId,
        serialNumber: onuForm.serialNumber,
        ponPort: onuForm.ponPort,
        onuId: onuForm.onuId || undefined,
        vlan: onuForm.vlan ? Number(onuForm.vlan) : undefined,
        rxPower: onuForm.rxPower ? Number(onuForm.rxPower) : undefined,
        txPower: onuForm.txPower ? Number(onuForm.txPower) : undefined,
        distance: onuForm.distance ? Number(onuForm.distance) : undefined,
        online: onuForm.online,
        customerName: onuForm.customerName || undefined,
        customerPhone: onuForm.customerPhone || undefined,
      };

      const res = await api.post('/olts/onus', body);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onus'] });
      queryClient.invalidateQueries({ queryKey: ['olt-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });

      setOnuForm({
        oltId: '',
        serialNumber: '',
        ponPort: '',
        onuId: '',
        vlan: '',
        rxPower: '',
        txPower: '',
        distance: '',
        online: true,
        customerName: '',
        customerPhone: '',
      });
    },
  });

  const testOlt = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/olts/${id}/test`);
      return res.data;
    },
    onSuccess: (data) => {
      alert(data.message || 'OLT connection test completed');
      queryClient.invalidateQueries({ queryKey: ['olts'] });
    },
  });

  const submitOlt = (event: FormEvent) => {
    event.preventDefault();
    createOlt.mutate();
  };

  const submitOnu = (event: FormEvent) => {
    event.preventDefault();
    createOnu.mutate();
  };

  return (
    <div className="page">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">GPON Layer</p>
          <h1>OLT / ONU Management</h1>
          <p>
            Manage OLT devices, register ONU units, monitor fiber ports, signal levels and customer mapping.
          </p>
        </div>

        <div className="hero-signal">
          <Network size={44} />
          <span>GPON</span>
        </div>
      </section>

      <section className="stats-grid">
        <StatCard
          title="OLT Devices"
          value={summary?.totalOlts ?? 0}
          sub={`${summary?.activeOlts ?? 0} active`}
          icon={Router}
        />

        <StatCard
          title="ONU Units"
          value={summary?.totalOnus ?? 0}
          sub={`${summary?.onlineOnus ?? 0} online`}
          icon={Wifi}
        />

        <StatCard
          title="Offline ONU"
          value={summary?.offlineOnus ?? 0}
          sub="needs attention"
          icon={Cable}
        />
      </section>

      <section className="two-grid">
        <form className="glass-panel form-panel" onSubmit={submitOlt}>
          <h2>Add OLT</h2>

          <div className="form-grid">
            <label>
              OLT Name
              <input
                value={oltForm.name}
                onChange={(e) => setOltForm({ ...oltForm, name: e.target.value })}
                placeholder="Main Huawei OLT"
                required
              />
            </label>

            <label>
              Vendor
              <select
                value={oltForm.vendor}
                onChange={(e) => setOltForm({ ...oltForm, vendor: e.target.value })}
                required
              >
                <option value="HUAWEI">Huawei</option>
                <option value="ZTE">ZTE</option>
                <option value="VSOL">VSOL</option>
                <option value="CDATA">C-Data</option>
                <option value="BDCOM">BDCOM</option>
                <option value="OTHER">Other</option>
              </select>
            </label>

            <label>
              Host / IP
              <input
                value={oltForm.host}
                onChange={(e) => setOltForm({ ...oltForm, host: e.target.value })}
                placeholder="192.168.1.10"
                required
              />
            </label>

            <label>
              SSH / Telnet Port
              <input
                type="number"
                value={oltForm.port}
                onChange={(e) =>
                  setOltForm({ ...oltForm, port: Number(e.target.value) })
                }
                required
              />
            </label>

            <label>
              Username
              <input
                value={oltForm.username}
                onChange={(e) =>
                  setOltForm({ ...oltForm, username: e.target.value })
                }
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={oltForm.password}
                onChange={(e) =>
                  setOltForm({ ...oltForm, password: e.target.value })
                }
                required
              />
            </label>

            <label className="check-row">
              <input
                type="checkbox"
                checked={oltForm.active}
                onChange={(e) =>
                  setOltForm({ ...oltForm, active: e.target.checked })
                }
              />
              Active
            </label>
          </div>

          <button className="primary-btn small-btn" disabled={createOlt.isPending}>
            <Plus size={18} />
            {createOlt.isPending ? 'Saving...' : 'Add OLT'}
          </button>
        </form>

        <form className="glass-panel form-panel" onSubmit={submitOnu}>
          <h2>Add ONU</h2>

          <div className="form-grid">
            <label>
              OLT
              <select
                value={onuForm.oltId}
                onChange={(e) =>
                  setOnuForm({ ...onuForm, oltId: e.target.value })
                }
                required
              >
                <option value="">Select OLT</option>
                {olts.map((olt) => (
                  <option key={olt.id} value={olt.id}>
                    {olt.name} ({olt.host})
                  </option>
                ))}
              </select>
            </label>

            <label>
              Serial Number
              <input
                value={onuForm.serialNumber}
                onChange={(e) =>
                  setOnuForm({ ...onuForm, serialNumber: e.target.value })
                }
                placeholder="HWTC12345678"
                required
              />
            </label>

            <label>
              PON Port
              <input
                value={onuForm.ponPort}
                onChange={(e) =>
                  setOnuForm({ ...onuForm, ponPort: e.target.value })
                }
                placeholder="0/1/1"
                required
              />
            </label>

            <label>
              ONU ID
              <input
                value={onuForm.onuId}
                onChange={(e) =>
                  setOnuForm({ ...onuForm, onuId: e.target.value })
                }
                placeholder="1"
              />
            </label>

            <label>
              VLAN
              <input
                type="number"
                value={onuForm.vlan}
                onChange={(e) =>
                  setOnuForm({ ...onuForm, vlan: e.target.value })
                }
                placeholder="100"
              />
            </label>

            <label>
              RX Power
              <input
                type="number"
                step="0.01"
                value={onuForm.rxPower}
                onChange={(e) =>
                  setOnuForm({ ...onuForm, rxPower: e.target.value })
                }
                placeholder="-22.5"
              />
            </label>

            <label>
              TX Power
              <input
                type="number"
                step="0.01"
                value={onuForm.txPower}
                onChange={(e) =>
                  setOnuForm({ ...onuForm, txPower: e.target.value })
                }
                placeholder="2.1"
              />
            </label>

            <label>
              Distance
              <input
                type="number"
                step="0.01"
                value={onuForm.distance}
                onChange={(e) =>
                  setOnuForm({ ...onuForm, distance: e.target.value })
                }
                placeholder="1200"
              />
            </label>

            <label>
              Customer Name
              <input
                value={onuForm.customerName}
                onChange={(e) =>
                  setOnuForm({ ...onuForm, customerName: e.target.value })
                }
                placeholder="Customer name"
              />
            </label>

            <label>
              Customer Phone
              <input
                value={onuForm.customerPhone}
                onChange={(e) =>
                  setOnuForm({ ...onuForm, customerPhone: e.target.value })
                }
                placeholder="03000000000"
              />
            </label>

            <label className="check-row">
              <input
                type="checkbox"
                checked={onuForm.online}
                onChange={(e) =>
                  setOnuForm({ ...onuForm, online: e.target.checked })
                }
              />
              Online
            </label>
          </div>

          <button className="primary-btn small-btn" disabled={createOnu.isPending}>
            <RadioTower size={18} />
            {createOnu.isPending ? 'Saving...' : 'Add ONU'}
          </button>
        </form>
      </section>

      <section className="glass-panel">
        <h2>OLT Devices</h2>

        {oltsLoading ? (
          <p className="muted">Loading OLTs...</p>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Vendor</th>
                  <th>Host</th>
                  <th>Port</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {olts.map((olt) => (
                  <tr key={olt.id}>
                    <td>{olt.name}</td>
                    <td>{olt.vendor}</td>
                    <td>{olt.host}</td>
                    <td>{olt.port}</td>
                    <td>
                      <span className={olt.active ? 'badge green' : 'badge red'}>
                        {olt.active ? 'Configured' : 'Disabled'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="ghost-btn"
                        onClick={() => testOlt.mutate(olt.id)}
                      >
                        <PlugZap size={16} />
                        Test
                      </button>
                    </td>
                  </tr>
                ))}

                {olts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="empty-cell">
                      No OLT devices added yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="glass-panel">
        <h2>ONU Units</h2>

        {onusLoading ? (
          <p className="muted">Loading ONUs...</p>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Serial</th>
                  <th>OLT</th>
                  <th>PON</th>
                  <th>ONU ID</th>
                  <th>VLAN</th>
                  <th>RX</th>
                  <th>TX</th>
                  <th>Distance</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {onus.map((onu) => (
                  <tr key={onu.id}>
                    <td>{onu.serialNumber}</td>
                    <td>{onu.olt?.name || '-'}</td>
                    <td>{onu.ponPort}</td>
                    <td>{onu.onuId || '-'}</td>
                    <td>{onu.vlan || '-'}</td>
                    <td>{onu.rxPower ?? '-'}</td>
                    <td>{onu.txPower ?? '-'}</td>
                    <td>{onu.distance ?? '-'}</td>
                    <td>{onu.customerName || '-'}</td>
                    <td>{onu.customerPhone || '-'}</td>
                    <td>
                      <span className={onu.online ? 'badge green' : 'badge red'}>
                        {onu.online ? 'Online' : 'Offline'}
                      </span>
                    </td>
                  </tr>
                ))}

                {onus.length === 0 && (
                  <tr>
                    <td colSpan={11} className="empty-cell">
                      No ONU units added yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}