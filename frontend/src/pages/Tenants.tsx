import { useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Edit3, Plus, Save, ShieldCheck, Trash2, Users, X } from 'lucide-react';
import { api } from '../api/client';
import type { TenantItem } from '../types';

function money(value?: number) {
  return `Rs. ${Number(value || 0).toLocaleString()}`;
}

const emptyForm = {
  name: '',
  companyName: '',
  ownerName: '',
  email: '',
  phone: '',
  planName: 'STARTER',
  monthlyPrice: 5000,
  maxCustomers: 300,
  maxRouters: 1,
  maxOlts: 1,
  subscriptionEnd: '',
  adminFullName: '',
  adminUsername: '',
  adminPassword: '',
};

export default function Tenants() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: tenants = [], isLoading } = useQuery<TenantItem[]>({
    queryKey: ['tenants'],
    queryFn: async () => {
      const res = await api.get('/tenants');
      return res.data;
    },
  });

  const createTenant = useMutation({
    mutationFn: async () => {
      const res = await api.post('/tenants', {
        ...form,
        monthlyPrice: Number(form.monthlyPrice),
        maxCustomers: Number(form.maxCustomers),
        maxRouters: Number(form.maxRouters),
        maxOlts: Number(form.maxOlts),
        subscriptionEnd: form.subscriptionEnd || undefined,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      setForm(emptyForm);
    },
  });

  const updateTenant = useMutation({
    mutationFn: async () => {
      const res = await api.patch(`/tenants/${editingId}`, {
        name: form.name,
        companyName: form.companyName,
        ownerName: form.ownerName,
        email: form.email,
        phone: form.phone,
        planName: form.planName,
        monthlyPrice: Number(form.monthlyPrice),
        maxCustomers: Number(form.maxCustomers),
        maxRouters: Number(form.maxRouters),
        maxOlts: Number(form.maxOlts),
        subscriptionEnd: form.subscriptionEnd,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      setEditingId(null);
      setForm(emptyForm);
    },
  });

  const deleteTenant = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/tenants/${id}`);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenants'] }),
  });

  const suspendTenant = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/tenants/${id}/suspend`);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenants'] }),
  });

  const activateTenant = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/tenants/${id}/activate`);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenants'] }),
  });

  const startEdit = (tenant: TenantItem) => {
    setEditingId(tenant.id);
    setForm({
      name: tenant.name || '',
      companyName: tenant.companyName || '',
      ownerName: tenant.ownerName || '',
      email: tenant.email || '',
      phone: tenant.phone || '',
      planName: tenant.planName || 'STARTER',
      monthlyPrice: Number(tenant.monthlyPrice || 0),
      maxCustomers: Number(tenant.maxCustomers || 300),
      maxRouters: Number(tenant.maxRouters || 1),
      maxOlts: Number(tenant.maxOlts || 1),
      subscriptionEnd: tenant.subscriptionEnd
        ? tenant.subscriptionEnd.slice(0, 10)
        : '',
      adminFullName: '',
      adminUsername: '',
      adminPassword: '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();

    if (editingId) {
      updateTenant.mutate();
    } else {
      createTenant.mutate();
    }
  };

  return (
    <div className="page">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">SaaS Revenue</p>
          <h1>Tenant Management</h1>
          <p>
            Create ISP companies, assign admin logins, plan limits and subscription expiry.
          </p>
        </div>

        <div className="hero-signal">
          <ShieldCheck size={44} />
          <span>SAAS</span>
        </div>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Building2 size={23} />
          </div>
          <div>
            <p>Total Tenants</p>
            <h3>{tenants.length}</h3>
            <span>ISP companies</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Users size={23} />
          </div>
          <div>
            <p>Active Tenants</p>
            <h3>{tenants.filter((item) => item.status === 'ACTIVE').length}</h3>
            <span>billing accounts active</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <ShieldCheck size={23} />
          </div>
          <div>
            <p>Monthly Revenue</p>
            <h3>
              {money(
                tenants
                  .filter((item) => item.status === 'ACTIVE')
                  .reduce((sum, item) => sum + Number(item.monthlyPrice || 0), 0),
              )}
            </h3>
            <span>active subscriptions</span>
          </div>
        </div>
      </section>

      <section className="glass-panel form-panel">
        <div className="panel-header">
          <div>
            <h2>{editingId ? 'Edit ISP Tenant' : 'Create ISP Tenant'}</h2>
            <p className="muted">
              {editingId
                ? 'Update tenant plan, limits and subscription.'
                : 'Create a new ISP company with admin login.'}
            </p>
          </div>

          {editingId && (
            <button type="button" className="ghost-btn danger-btn" onClick={cancelEdit}>
              <X size={16} />
              Cancel Edit
            </button>
          )}
        </div>

        <form onSubmit={submit}>
          <div className="form-grid">
            <label>
              Tenant Slug
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="city-isp"
                required
              />
            </label>

            <label>
              Company Name
              <input
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                placeholder="City Fiber ISP"
              />
            </label>

            <label>
              Owner Name
              <input
                value={form.ownerName}
                onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                placeholder="Owner name"
              />
            </label>

            <label>
              Phone
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="03000000000"
              />
            </label>

            <label>
              Email
              <input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="owner@isp.com"
              />
            </label>

            <label>
              Plan
              <select
                value={form.planName}
                onChange={(e) => setForm({ ...form, planName: e.target.value })}
              >
                <option value="STARTER">Starter</option>
                <option value="PRO">Pro</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>
            </label>

            <label>
              Monthly Price
              <input
                type="number"
                value={form.monthlyPrice}
                onChange={(e) =>
                  setForm({ ...form, monthlyPrice: Number(e.target.value) })
                }
              />
            </label>

            <label>
              Max Customers
              <input
                type="number"
                value={form.maxCustomers}
                onChange={(e) =>
                  setForm({ ...form, maxCustomers: Number(e.target.value) })
                }
              />
            </label>

            <label>
              Max Routers
              <input
                type="number"
                value={form.maxRouters}
                onChange={(e) =>
                  setForm({ ...form, maxRouters: Number(e.target.value) })
                }
              />
            </label>

            <label>
              Max OLTs
              <input
                type="number"
                value={form.maxOlts}
                onChange={(e) =>
                  setForm({ ...form, maxOlts: Number(e.target.value) })
                }
              />
            </label>

            <label>
              Subscription End
              <input
                type="date"
                value={form.subscriptionEnd}
                onChange={(e) =>
                  setForm({ ...form, subscriptionEnd: e.target.value })
                }
              />
            </label>

            {!editingId && (
              <>
                <label>
                  Admin Full Name
                  <input
                    value={form.adminFullName}
                    onChange={(e) =>
                      setForm({ ...form, adminFullName: e.target.value })
                    }
                    placeholder="ISP Admin"
                    required
                  />
                </label>

                <label>
                  Admin Username
                  <input
                    value={form.adminUsername}
                    onChange={(e) =>
                      setForm({ ...form, adminUsername: e.target.value })
                    }
                    placeholder="isp_admin"
                    required
                  />
                </label>

                <label>
                  Admin Password
                  <input
                    value={form.adminPassword}
                    onChange={(e) =>
                      setForm({ ...form, adminPassword: e.target.value })
                    }
                    placeholder="password"
                    required
                  />
                </label>
              </>
            )}
          </div>

          <button
            className="primary-btn small-btn"
            disabled={createTenant.isPending || updateTenant.isPending}
          >
            {editingId ? <Save size={18} /> : <Plus size={18} />}
            {editingId
              ? updateTenant.isPending
                ? 'Updating...'
                : 'Update Tenant'
              : createTenant.isPending
                ? 'Creating...'
                : 'Create Tenant'}
          </button>
        </form>
      </section>

      <section className="glass-panel">
        <h2>ISP Tenants</h2>

        {isLoading ? (
          <p className="muted">Loading tenants...</p>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Owner</th>
                  <th>Plan</th>
                  <th>Limits</th>
                  <th>Usage</th>
                  <th>Subscription</th>
                  <th>Status</th>
                  <th>Admin</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {tenants.map((tenant) => (
                  <tr key={tenant.id}>
                    <td>
                      <strong>{tenant.companyName || tenant.name}</strong>
                      <small className="table-sub">{tenant.name}</small>
                    </td>
                    <td>
                      {tenant.ownerName || '-'}
                      <small className="table-sub">{tenant.phone || tenant.email || '-'}</small>
                    </td>
                    <td>
                      {tenant.planName}
                      <small className="table-sub">{money(tenant.monthlyPrice)}</small>
                    </td>
                    <td>
                      C: {tenant.maxCustomers} / R: {tenant.maxRouters} / O: {tenant.maxOlts}
                    </td>
                    <td>
                      C: {tenant._count?.customers || 0} / R: {tenant._count?.routers || 0} / O:{' '}
                      {tenant._count?.olts || 0}
                    </td>
                    <td>
                      {tenant.subscriptionEnd
                        ? new Date(tenant.subscriptionEnd).toLocaleDateString()
                        : 'No expiry'}
                    </td>
                    <td>
                      <span
                        className={
                          tenant.status === 'ACTIVE'
                            ? 'badge green'
                            : tenant.status === 'SUSPENDED'
                              ? 'badge orange'
                              : 'badge red'
                        }
                      >
                        {tenant.status}
                      </span>
                    </td>
                    <td>
                      {tenant.users?.[0]?.username || '-'}
                      <small className="table-sub">{tenant.users?.[0]?.fullName || '-'}</small>
                    </td>
                    <td>
                      <div className="action-row">
                        <button className="ghost-btn" onClick={() => startEdit(tenant)}>
                          <Edit3 size={15} />
                          Edit
                        </button>

                        {tenant.status === 'ACTIVE' ? (
                          <button
                            className="ghost-btn danger-btn"
                            onClick={() => suspendTenant.mutate(tenant.id)}
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            className="ghost-btn"
                            onClick={() => activateTenant.mutate(tenant.id)}
                          >
                            Activate
                          </button>
                        )}

                        <button
                          className="ghost-btn danger-btn"
                          onClick={() => {
                            if (confirm('Delete this tenant? It must have no data.')) {
                              deleteTenant.mutate(tenant.id);
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

                {tenants.length === 0 && (
                  <tr>
                    <td colSpan={9} className="empty-cell">
                      No tenants created yet.
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
