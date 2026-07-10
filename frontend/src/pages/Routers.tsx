import { useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit3, Plus, Router, Save, Trash2, X, Zap } from 'lucide-react';
import { api } from '../api/client';
import type { RouterItem } from '../types';

const emptyForm = {
  name: '',
  host: '',
  apiPort: 8729,
  username: '',
  password: '',
  ssl: true,
  active: true,
};

export default function Routers() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: routers = [], isLoading } = useQuery<RouterItem[]>({
    queryKey: ['routers'],
    queryFn: async () => {
      const res = await api.get('/routers');
      return res.data;
    },
  });

  const saveRouter = useMutation({
    mutationFn: async () => {
      if (editingId) {
        const res = await api.patch(`/routers/${editingId}`, form);
        return res.data;
      }

      const res = await api.post('/routers', form);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setEditingId(null);
      setForm(emptyForm);
    },
  });

  const deleteRouter = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/routers/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });

  const testRouter = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/routers/${id}/test`);
      return res.data;
    },
    onSuccess: (data) => {
      alert(data.message || 'Router test completed');
      queryClient.invalidateQueries({ queryKey: ['routers'] });
    },
  });

  const startEdit = (router: RouterItem) => {
    setEditingId(router.id);
    setForm({
      name: router.name || '',
      host: router.host || '',
      apiPort: Number(router.apiPort || 8729),
      username: router.username || '',
      password: '',
      ssl: router.ssl ?? true,
      active: router.active ?? true,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    saveRouter.mutate();
  };

  return (
    <div className="page">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">MikroTik Layer</p>
          <h1>Router Management</h1>
          <p>
            Add MikroTik routers per tenant, test API port reachability and manage router records.
          </p>
        </div>

        <div className="hero-signal">
          <Router size={44} />
          <span>API</span>
        </div>
      </section>

      <section className="glass-panel form-panel">
        <div className="panel-header">
          <div>
            <h2>{editingId ? 'Edit Router' : 'Add Router'}</h2>
            <p className="muted">
              {editingId
                ? 'Updating router resets connection status to NOT_TESTED.'
                : 'For real MikroTik API use SSL 443/8729 or non-SSL 8728.'}
            </p>
          </div>

          {editingId && (
            <button className="ghost-btn danger-btn" onClick={cancelEdit}>
              <X size={16} />
              Cancel Edit
            </button>
          )}
        </div>

        <form onSubmit={submit}>
          <div className="form-grid">
            <label>
              Router Name
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Main MikroTik"
                required
              />
            </label>

            <label>
              Host / IP
              <input
                value={form.host}
                onChange={(e) => setForm({ ...form, host: e.target.value })}
                placeholder="127.0.0.1"
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
                placeholder={editingId ? 'Leave blank only if backend keeps old' : 'Router password'}
                required={!editingId}
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

            <label className="check-row">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
              Enabled
            </label>
          </div>

          <button className="primary-btn small-btn" disabled={saveRouter.isPending}>
            {editingId ? <Save size={18} /> : <Plus size={18} />}
            {saveRouter.isPending
              ? 'Saving...'
              : editingId
                ? 'Update Router'
                : 'Add Router'}
          </button>
        </form>
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
                  <th>SSL</th>
                  <th>Status</th>
                  <th>Customers</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {routers.map((router) => (
                  <tr key={router.id}>
                    <td>{router.name}</td>
                    <td>{router.host}</td>
                    <td>{router.apiPort}</td>
                    <td>{router.ssl ? 'Yes' : 'No'}</td>
                    <td>
                      <span
                        className={
                          router.connectionStatus === 'CONNECTED'
                            ? 'badge green'
                            : router.connectionStatus === 'FAILED'
                              ? 'badge red'
                              : 'badge orange'
                        }
                      >
                        {router.connectionStatus || 'NOT_TESTED'}
                      </span>

                      {router.lastTestedAt && (
                        <small className="table-sub">
                          {new Date(router.lastTestedAt).toLocaleString()}
                        </small>
                      )}

                      {router.lastError && (
                        <small className="table-error">{router.lastError}</small>
                      )}
                    </td>
                    <td>{router._count?.customers || 0}</td>
                    <td>
                      <div className="action-row">
                        <button
                          className="ghost-btn"
                          onClick={() => testRouter.mutate(router.id)}
                        >
                          <Zap size={15} />
                          Test
                        </button>

                        <button className="ghost-btn" onClick={() => startEdit(router)}>
                          <Edit3 size={15} />
                          Edit
                        </button>

                        <button
                          className="ghost-btn danger-btn"
                          onClick={() => {
                            if (confirm('Delete this router? It must have no customers.')) {
                              deleteRouter.mutate(router.id);
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
