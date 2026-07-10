import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PackagePlus, Signal } from 'lucide-react';
import { api } from '../api/client';
import type { InternetPackage } from '../types';

export default function Packages() {
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: '',
    downloadMbps: 17,
    uploadMbps: 17,
    price: 0,
    mikrotikProfile: '',
    active: true,
  });

  const { data: packages = [], isLoading } = useQuery<InternetPackage[]>({
    queryKey: ['packages'],
    queryFn: async () => {
      const res = await api.get('/packages');
      return res.data;
    },
  });

  const createPackage = useMutation({
    mutationFn: async () => {
      const res = await api.post('/packages', form);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      setForm({
        name: '',
        downloadMbps: 17,
        uploadMbps: 17,
        price: 0,
        mikrotikProfile: '',
        active: true,
      });
    },
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();

    if (!form.mikrotikProfile) {
      setForm((current) => ({
        ...current,
        mikrotikProfile: current.name,
      }));
    }

    createPackage.mutate();
  };

  return (
    <div className="page">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Speed Profiles</p>
          <h1>Internet Packages</h1>
          <p>Create billing packages and map them to MikroTik PPP profiles.</p>
        </div>

        <div className="hero-signal">
          <Signal size={44} />
          <span>PLAN</span>
        </div>
      </section>

      <section className="two-grid">
        <form className="glass-panel form-panel" onSubmit={submit}>
          <h2>Add Package</h2>

          <div className="form-grid">
            <label>
              Package Name
              <input
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                    mikrotikProfile: e.target.value,
                  })
                }
                placeholder="17M"
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
                onChange={(e) =>
                  setForm({ ...form, price: Number(e.target.value) })
                }
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
                placeholder="17M"
                required
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

          <button className="primary-btn small-btn" disabled={createPackage.isPending}>
            <PackagePlus size={18} />
            {createPackage.isPending ? 'Saving...' : 'Add Package'}
          </button>
        </form>

        <div className="glass-panel">
          <h2>Package Mapping</h2>
          <p className="muted">
            The MikroTik profile name must match your PPP profile exactly, for example
            <strong> 17M</strong>, <strong>32M</strong>, or <strong>100M</strong>.
          </p>
        </div>
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
                  <th>Download</th>
                  <th>Upload</th>
                  <th>Price</th>
                  <th>MikroTik Profile</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {packages.map((pkg) => (
                  <tr key={pkg.id}>
                    <td>{pkg.name}</td>
                    <td>{pkg.downloadMbps} Mbps</td>
                    <td>{pkg.uploadMbps} Mbps</td>
                    <td>Rs. {pkg.price}</td>
                    <td>{pkg.mikrotikProfile}</td>
                    <td>
                      <span className={pkg.active ? 'badge green' : 'badge red'}>
                        {pkg.active ? 'Active' : 'Inactive'}
                      </span>
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