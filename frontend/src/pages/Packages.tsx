import { useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit3, Package, Plus, Save, Trash2, X } from 'lucide-react';
import { api } from '../api/client';
import type { InternetPackage } from '../types';

const emptyForm = {
  name: '',
  downloadMbps: 10,
  uploadMbps: 10,
  price: 0,
  mikrotikProfile: '',
  active: true,
};

function money(value?: number) {
  return `Rs. ${Number(value || 0).toLocaleString()}`;
}

export default function Packages() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: packages = [], isLoading } = useQuery<InternetPackage[]>({
    queryKey: ['packages'],
    queryFn: async () => {
      const res = await api.get('/packages');
      return res.data;
    },
  });

  const savePackage = useMutation({
    mutationFn: async () => {
      const body = {
        ...form,
        downloadMbps: Number(form.downloadMbps),
        uploadMbps: Number(form.uploadMbps),
        price: Number(form.price),
        mikrotikProfile: form.mikrotikProfile || form.name,
      };

      if (editingId) {
        const res = await api.patch(`/packages/${editingId}`, body);
        return res.data;
      }

      const res = await api.post('/packages', body);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setEditingId(null);
      setForm(emptyForm);
    },
  });

  const deletePackage = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/packages/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });

  const startEdit = (item: InternetPackage) => {
    setEditingId(item.id);
    setForm({
      name: item.name || '',
      downloadMbps: Number(item.downloadMbps || 0),
      uploadMbps: Number(item.uploadMbps || 0),
      price: Number(item.price || 0),
      mikrotikProfile: item.mikrotikProfile || item.name || '',
      active: item.active ?? true,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    savePackage.mutate();
  };

  return (
    <div className="page">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Service Plans</p>
          <h1>Internet Packages</h1>
          <p>
            Create speed plans and bind them with MikroTik PPP profiles.
          </p>
        </div>

        <div className="hero-signal">
          <Package size={44} />
          <span>PLAN</span>
        </div>
      </section>

      <section className="glass-panel form-panel">
        <div className="panel-header">
          <div>
            <h2>{editingId ? 'Edit Package' : 'Add Package'}</h2>
            <p className="muted">
              Package name and MikroTik profile should match your PPP profile.
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
              Package Name
              <input
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                    mikrotikProfile: form.mikrotikProfile || e.target.value,
                  })
                }
                placeholder="20M"
                required
              />
            </label>

            <label>
              Download Mbps
              <input
                type="number"
                value={form.downloadMbps}
                onChange={(e) =>
                  setForm({ ...form, downloadMbps: Number(e.target.value) })
                }
                required
              />
            </label>

            <label>
              Upload Mbps
              <input
                type="number"
                value={form.uploadMbps}
                onChange={(e) =>
                  setForm({ ...form, uploadMbps: Number(e.target.value) })
                }
                required
              />
            </label>

            <label>
              Monthly Price
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                required
              />
            </label>

            <label>
              MikroTik Profile
              <input
                value={form.mikrotikProfile}
                onChange={(e) =>
                  setForm({ ...form, mikrotikProfile: e.target.value })
                }
                placeholder="20M"
              />
            </label>

            <label className="check-row">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
              Active
            </label>
          </div>

          <button className="primary-btn small-btn" disabled={savePackage.isPending}>
            {editingId ? <Save size={18} /> : <Plus size={18} />}
            {savePackage.isPending
              ? 'Saving...'
              : editingId
                ? 'Update Package'
                : 'Add Package'}
          </button>
        </form>
      </section>

      <section className="glass-panel">
        <h2>Packages</h2>

        {isLoading ? (
          <p className="muted">Loading packages...</p>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Speed</th>
                  <th>Price</th>
                  <th>MikroTik Profile</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {packages.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>
                      {item.downloadMbps}M / {item.uploadMbps}M
                    </td>
                    <td>{money(item.price)}</td>
                    <td>{item.mikrotikProfile}</td>
                    <td>
                      <span className={item.active ? 'badge green' : 'badge red'}>
                        {item.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="action-row">
                        <button className="ghost-btn" onClick={() => startEdit(item)}>
                          <Edit3 size={15} />
                          Edit
                        </button>

                        <button
                          className="ghost-btn danger-btn"
                          onClick={() => {
                            if (confirm('Delete this package? It must have no customers.')) {
                              deletePackage.mutate(item.id);
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

                {packages.length === 0 && (
                  <tr>
                    <td colSpan={6} className="empty-cell">
                      No packages created yet.
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
