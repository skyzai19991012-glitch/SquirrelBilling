import { useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Edit3,
  Network,
  Plus,
  Save,
  Server,
  Trash2,
  Wifi,
  X,
  Zap,
} from 'lucide-react';
import { api } from '../api/client';

type OltItem = {
  id: string;
  name: string;
  vendor: 'HUAWEI' | 'VSOL' | 'ZTE' | 'CDATA' | 'BDCOM' | 'FIBERHOME' | 'OTHER';
  host: string;
  port: number;
  username: string;
  active: boolean;
  connectionStatus?: 'NOT_TESTED' | 'CONNECTED' | 'FAILED';
  lastTestedAt?: string | null;
  lastError?: string | null;
  _count?: {
    onus?: number;
  };
};

type OnuItem = {
  id: string;
  oltId: string;
  serialNumber: string;
  ponPort: string;
  onuId?: string | null;
  vlan?: number | null;
  rxPower?: number | null;
  txPower?: number | null;
  distance?: number | null;
  online: boolean;
  customerName?: string | null;
  customerPhone?: string | null;
  olt?: OltItem;
};

type OltSummary = {
  totalOlts?: number;
  activeOlts?: number;
  totalOnus?: number;
  onlineOnus?: number;
  offlineOnus?: number;
};

const emptyOltForm = {
  name: '',
  vendor: 'VSOL',
  host: '',
  port: 22,
  username: '',
  password: '',
  active: true,
};

const emptyOnuForm = {
  oltId: '',
  serialNumber: '',
  ponPort: '',
  onuId: '',
  vlan: '',
  rxPower: '',
  txPower: '',
  distance: '',
  online: false,
  customerName: '',
  customerPhone: '',
};

export default function Olt() {
  const queryClient = useQueryClient();

  const [oltEditingId, setOltEditingId] = useState<string | null>(null);
  const [onuEditingId, setOnuEditingId] = useState<string | null>(null);

  const [oltForm, setOltForm] = useState(emptyOltForm);
  const [onuForm, setOnuForm] = useState(emptyOnuForm);

  const { data: summary } = useQuery<OltSummary>({
    queryKey: ['olt-summary'],
    queryFn: async () => {
      const res = await api.get('/olt/summary');
      return res.data;
    },
  });

  const { data: olts = [], isLoading: oltsLoading } = useQuery<OltItem[]>({
    queryKey: ['olts'],
    queryFn: async () => {
      const res = await api.get('/olt/devices');
      return res.data;
    },
  });

  const { data: onus = [], isLoading: onusLoading } = useQuery<OnuItem[]>({
    queryKey: ['onus'],
    queryFn: async () => {
      const res = await api.get('/olt/onus');
      return res.data;
    },
  });

  const saveOlt = useMutation({
    mutationFn: async () => {
      const body = {
        ...oltForm,
        port: Number(oltForm.port || 22),
      };

      if (oltEditingId) {
        const res = await api.patch(`/olt/devices/${oltEditingId}`, body);
        return res.data;
      }

      const res = await api.post('/olt/devices', body);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['olts'] });
      queryClient.invalidateQueries({ queryKey: ['olt-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setOltEditingId(null);
      setOltForm(emptyOltForm);
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'OLT save failed');
    },
  });

  const deleteOlt = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/olt/devices/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['olts'] });
      queryClient.invalidateQueries({ queryKey: ['onus'] });
      queryClient.invalidateQueries({ queryKey: ['olt-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'OLT delete failed');
    },
  });

  const testOlt = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/olt/devices/${id}/test`);
      return res.data;
    },
    onSuccess: (data) => {
      alert(data?.message || 'OLT test completed');
      queryClient.invalidateQueries({ queryKey: ['olts'] });
      queryClient.invalidateQueries({ queryKey: ['olt-summary'] });
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'OLT test failed');
    },
  });

  const saveOnu = useMutation({
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

      if (onuEditingId) {
        const res = await api.patch(`/olt/onus/${onuEditingId}`, body);
        return res.data;
      }

      const res = await api.post('/olt/onus', body);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onus'] });
      queryClient.invalidateQueries({ queryKey: ['olts'] });
      queryClient.invalidateQueries({ queryKey: ['olt-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setOnuEditingId(null);
      setOnuForm(emptyOnuForm);
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'ONU save failed');
    },
  });

  const deleteOnu = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/olt/onus/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onus'] });
      queryClient.invalidateQueries({ queryKey: ['olts'] });
      queryClient.invalidateQueries({ queryKey: ['olt-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'ONU delete failed');
    },
  });

  const startOltEdit = (olt: OltItem) => {
    setOltEditingId(olt.id);
    setOltForm({
      name: olt.name || '',
      vendor: olt.vendor || 'VSOL',
      host: olt.host || '',
      port: Number(olt.port || 22),
      username: olt.username || '',
      password: '',
      active: olt.active ?? true,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startOnuEdit = (onu: OnuItem) => {
    setOnuEditingId(onu.id);
    setOnuForm({
      oltId: onu.oltId || '',
      serialNumber: onu.serialNumber || '',
      ponPort: onu.ponPort || '',
      onuId: onu.onuId || '',
      vlan: onu.vlan !== null && onu.vlan !== undefined ? String(onu.vlan) : '',
      rxPower:
        onu.rxPower !== null && onu.rxPower !== undefined ? String(onu.rxPower) : '',
      txPower:
        onu.txPower !== null && onu.txPower !== undefined ? String(onu.txPower) : '',
      distance:
        onu.distance !== null && onu.distance !== undefined
          ? String(onu.distance)
          : '',
      online: onu.online ?? false,
      customerName: onu.customerName || '',
      customerPhone: onu.customerPhone || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelOltEdit = () => {
    setOltEditingId(null);
    setOltForm(emptyOltForm);
  };

  const cancelOnuEdit = () => {
    setOnuEditingId(null);
    setOnuForm(emptyOnuForm);
  };

  const submitOlt = (event: FormEvent) => {
    event.preventDefault();
    saveOlt.mutate();
  };

  const submitOnu = (event: FormEvent) => {
    event.preventDefault();
    saveOnu.mutate();
  };

  return (
    <div className="page">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Fiber Layer</p>
          <h1>OLT / ONU Management</h1>
          <p>
            Add OLT devices, test SSH/Telnet port reachability and manage ONU records.
          </p>
        </div>

        <div className="hero-signal">
          <Network size={44} />
          <span>FTTH</span>
        </div>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Server size={23} />
          </div>
          <div>
            <p>Total OLTs</p>
            <h3>{summary?.totalOlts || olts.length}</h3>
            <span>{summary?.activeOlts || 0} active</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Wifi size={23} />
          </div>
          <div>
            <p>Total ONUs</p>
            <h3>{summary?.totalOnus || onus.length}</h3>
            <span>registered devices</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Zap size={23} />
          </div>
          <div>
            <p>Online ONUs</p>
            <h3>{summary?.onlineOnus || onus.filter((item) => item.online).length}</h3>
            <span>live fiber clients</span>
          </div>
        </div>
      </section>

      <section className="two-grid">
        <div className="glass-panel form-panel">
          <div className="panel-header">
            <div>
              <h2>{oltEditingId ? 'Edit OLT' : 'Add OLT'}</h2>
              <p className="muted">
                Add OLT login and management IP.
              </p>
            </div>

            {oltEditingId && (
              <button className="ghost-btn danger-btn" onClick={cancelOltEdit}>
                <X size={16} />
                Cancel
              </button>
            )}
          </div>

          <form onSubmit={submitOlt}>
            <div className="form-grid">
              <label>
                OLT Name
                <input
                  value={oltForm.name}
                  onChange={(e) => setOltForm({ ...oltForm, name: e.target.value })}
                  placeholder="Main VSOL OLT"
                  required
                />
              </label>

              <label>
                Vendor
                <select
                  value={oltForm.vendor}
                  onChange={(e) => setOltForm({ ...oltForm, vendor: e.target.value })}
                >
                  <option value="VSOL">VSOL</option>
                  <option value="HUAWEI">Huawei</option>
                  <option value="ZTE">ZTE</option>
                  <option value="CDATA">CDATA</option>
                  <option value="BDCOM">BDCOM</option>
                  <option value="FIBERHOME">FiberHome</option>
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
                Port
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
                  placeholder={oltEditingId ? 'Leave blank only if backend keeps old' : 'OLT password'}
                  required={!oltEditingId}
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

            <button className="primary-btn small-btn" disabled={saveOlt.isPending}>
              {oltEditingId ? <Save size={18} /> : <Plus size={18} />}
              {saveOlt.isPending
                ? 'Saving...'
                : oltEditingId
                  ? 'Update OLT'
                  : 'Add OLT'}
            </button>
          </form>
        </div>

        <div className="glass-panel form-panel">
          <div className="panel-header">
            <div>
              <h2>{onuEditingId ? 'Edit ONU' : 'Add ONU'}</h2>
              <p className="muted">
                Register ONU serial, PON port, signal and customer info.
              </p>
            </div>

            {onuEditingId && (
              <button className="ghost-btn danger-btn" onClick={cancelOnuEdit}>
                <X size={16} />
                Cancel
              </button>
            )}
          </div>

          <form onSubmit={submitOnu}>
            <div className="form-grid">
              <label>
                OLT
                <select
                  value={onuForm.oltId}
                  onChange={(e) => setOnuForm({ ...onuForm, oltId: e.target.value })}
                  required
                >
                  <option value="">Select OLT</option>
                  {olts.map((olt) => (
                    <option key={olt.id} value={olt.id}>
                      {olt.name} - {olt.host}
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
                  placeholder="VSOL12345678"
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
                  placeholder="0/1"
                  required
                />
              </label>

              <label>
                ONU ID
                <input
                  value={onuForm.onuId}
                  onChange={(e) => setOnuForm({ ...onuForm, onuId: e.target.value })}
                  placeholder="1"
                />
              </label>

              <label>
                VLAN
                <input
                  type="number"
                  value={onuForm.vlan}
                  onChange={(e) => setOnuForm({ ...onuForm, vlan: e.target.value })}
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
                  placeholder="-21.5"
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
                  placeholder="2.5"
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
                  placeholder="1.2"
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

            <button className="primary-btn small-btn" disabled={saveOnu.isPending}>
              {onuEditingId ? <Save size={18} /> : <Plus size={18} />}
              {saveOnu.isPending
                ? 'Saving...'
                : onuEditingId
                  ? 'Update ONU'
                  : 'Add ONU'}
            </button>
          </form>
        </div>
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
                  <th>ONUs</th>
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
                      <span
                        className={
                          olt.connectionStatus === 'CONNECTED'
                            ? 'badge green'
                            : olt.connectionStatus === 'FAILED'
                              ? 'badge red'
                              : 'badge orange'
                        }
                      >
                        {olt.connectionStatus || 'NOT_TESTED'}
                      </span>

                      {olt.lastTestedAt && (
                        <small className="table-sub">
                          {new Date(olt.lastTestedAt).toLocaleString()}
                        </small>
                      )}

                      {olt.lastError && (
                        <small className="table-error">{olt.lastError}</small>
                      )}
                    </td>
                    <td>{olt._count?.onus || 0}</td>
                    <td>
                      <div className="action-row">
                        <button className="ghost-btn" onClick={() => testOlt.mutate(olt.id)}>
                          <Zap size={15} />
                          Test
                        </button>

                        <button className="ghost-btn" onClick={() => startOltEdit(olt)}>
                          <Edit3 size={15} />
                          Edit
                        </button>

                        <button
                          className="ghost-btn danger-btn"
                          onClick={() => {
                            if (confirm('Delete this OLT? It must have no ONUs.')) {
                              deleteOlt.mutate(olt.id);
                            }
                          }}
                        >
                          <Trash2 size={15} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {olts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="empty-cell">
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
        <h2>ONU Devices</h2>

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
                  <th>VLAN</th>
                  <th>Signal</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {onus.map((onu) => (
                  <tr key={onu.id}>
                    <td>
                      <strong>{onu.serialNumber}</strong>
                      <small className="table-sub">ONU ID: {onu.onuId || '-'}</small>
                    </td>
                    <td>{onu.olt?.name || '-'}</td>
                    <td>{onu.ponPort}</td>
                    <td>{onu.vlan || '-'}</td>
                    <td>
                      RX: {onu.rxPower ?? '-'} / TX: {onu.txPower ?? '-'}
                      <small className="table-sub">
                        Distance: {onu.distance ?? '-'}
                      </small>
                    </td>
                    <td>
                      {onu.customerName || '-'}
                      <small className="table-sub">{onu.customerPhone || '-'}</small>
                    </td>
                    <td>
                      <span className={onu.online ? 'badge green' : 'badge red'}>
                        {onu.online ? 'ONLINE' : 'OFFLINE'}
                      </span>
                    </td>
                    <td>
                      <div className="action-row">
                        <button className="ghost-btn" onClick={() => startOnuEdit(onu)}>
                          <Edit3 size={15} />
                          Edit
                        </button>

                        <button
                          className="ghost-btn danger-btn"
                          onClick={() => {
                            if (confirm('Delete this ONU?')) {
                              deleteOnu.mutate(onu.id);
                            }
                          }}
                        >
                          <Trash2 size={15} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {onus.length === 0 && (
                  <tr>
                    <td colSpan={8} className="empty-cell">
                      No ONU devices added yet.
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
