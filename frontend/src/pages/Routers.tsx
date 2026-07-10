import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DownloadCloud, PlugZap, Plus, Router as RouterIcon } from 'lucide-react';
import { api } from '../api/client';
import type { RouterItem } from '../types';

export default function Routers() {
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: 'Main RB4011',
    host: '',
    apiPort: 8729,
    username: '',
    password: '',
    ssl: true,
  });

  const { data: routers = [], isLoading } = useQuery<RouterItem[]>({
    queryKey: ['routers'],
    queryFn: async () => {
      const res = await api.get('/routers');
      return res.data;
    },
  });

  const createRouter = useMutation({
    mutationFn: async () => {
      const res = await api.post('/routers', form);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routers'] });
      setForm({
        name: 'Main RB4011',
        host: '',
        apiPort: 8729,
        username: '',
        password: '',
        ssl: true,
      });
    },
  });

  const testRouter = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/routers/${id}/test`);
      return res.data;
    },
    onSuccess: (data) => {
      alert(data.message);
      queryClient.invalidateQueries({ queryKey: ['routers'] });
    },
  });

  const importRouter = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/mikrotik/routers/${id}/import`);
      return res.data;
    },
    onSuccess: (data) => {
      alert(
        `Import complete\nProfiles: ${data.importedProfiles}\nNew users: ${data.importedSecrets}\nUpdated users: ${data.updatedSecrets}`,
      );
      queryClient.invalidateQueries({ queryKey: ['routers'] });
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    createRouter.mutate();
  };

  return (
    <div className="page">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">MikroTik Core</p>
          <h1>Router Management</h1>
          <p>Add MikroTik routers, test API access, and import PPPoE users directly into billing.</p>
        </div>

        <div className="hero-signal">
          <RouterIcon size={44} />
          <span>API</span>
        </div>
      </section>

      <section className="two-grid">
        <form className="glass-panel form-panel" onSubmit={submit}>
          <h2>Add Router</h2>

          <div className="form-grid">
            <label>
              Router Name
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </label>

            <label>
              Static IP / Host
              <input
                value={form.host}
                onChange={(e) => setForm({ ...form, host: e.target.value })}
                placeholder="x.x.x.x"
                required
              />
            </label>

            <label>
              API Port
              <input
                type="number"
                value={form.apiPort}
                onChange={(e) =>
                  setForm({ ...form, apiPort: Number(e.target.value) })
                }
                required
              />
            </label>

            <label>
              Username
              <input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </label>

            <label className="check-row">
              <input
                type="checkbox"
                checked={form.ssl}
                onChange={(e) => setForm({ ...form, ssl: e.target.checked })}
              />
              SSL API
            </label>
          </div>

          <button className="primary-btn small-btn" disabled={createRouter.isPending}>
            <Plus size={18} />
            {createRouter.isPending ? 'Saving...' : 'Add Router'}
          </button>
        </form>

        <div className="glass-panel">
          <h2>API Notes</h2>
          <p className="muted">
            For SSL API use port <strong>8729</strong>. For non-SSL API use port <strong>8728</strong>.
            Your MikroTik must allow API access from this billing server.
          </p>
        </div>
      </section>

      <section className="glass-panel">
        <h2>Routers</h2>

        {isLoading ? (
          <p className="muted">Loading routers...</p>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Host</th>
                  <th>Port</th>
                  <th>Config</th>
                  <th>Identity</th>
                  <th>Version</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {routers.map((router) => (
                  <tr key={router.id}>
                    <td>{router.name}</td>
                    <td>{router.host}</td>
                    <td>{router.apiPort}</td>
                    <td>
                      <span className={router.active ? 'badge green' : 'badge red'}>
                        {router.active ? 'Configured' : 'Disabled'}
                      </span>
                    </td>
                    <td>{router.identity || '-'}</td>
                    <td>{router.version || '-'}</td>
                    <td>
                      <div className="action-row">
                        <button
                          className="ghost-btn"
                          onClick={() => testRouter.mutate(router.id)}
                        >
                          <PlugZap size={16} />
                          Test
                        </button>

                        <button
                          className="ghost-btn"
                          onClick={() => importRouter.mutate(router.id)}
                        >
                          <DownloadCloud size={16} />
                          Import
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {routers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="empty-cell">
                      No routers added yet.
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