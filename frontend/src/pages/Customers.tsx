import { useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit3, Plus, Save, Trash2, UserPlus, X } from 'lucide-react';
import { api } from '../api/client';

type RouterItem = {
  id: string;
  name: string;
};

type PackageItem = {
  id: string;
  name: string;
  price: number;
  mikrotikProfile?: string;
};

type CustomerItem = {
  id: string;
  customerNo: string;
  fullName: string;
  fatherName?: string | null;
  cnic?: string | null;
  phone: string;
  whatsapp?: string | null;
  email?: string | null;
  address?: string | null;
  gpsLocation?: string | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'TERMINATED';
  routerId: string;
  packageId: string;
  dueDate?: string | null;
  router?: RouterItem;
  package?: PackageItem;
  pppAccount?: {
    id: string;
    username: string;
    password?: string;
    profile: string;
    disabled: boolean;
  } | null;
};

const emptyForm = {
  customerNo: '',
  fullName: '',
  fatherName: '',
  cnic: '',
  phone: '',
  whatsapp: '',
  email: '',
  address: '',
  gpsLocation: '',
  routerId: '',
  packageId: '',
  pppUsername: '',
  pppPassword: '',
  mikrotikProfile: '',
  dueDate: '',
  notes: '',
};

export default function Customers() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: customers = [], isLoading } = useQuery<CustomerItem[]>({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await api.get('/customers');
      return res.data;
    },
  });

  const { data: routers = [] } = useQuery<RouterItem[]>({
    queryKey: ['routers'],
    queryFn: async () => {
      const res = await api.get('/routers');
      return res.data;
    },
  });

  const { data: packages = [] } = useQuery<PackageItem[]>({
    queryKey: ['packages'],
    queryFn: async () => {
      const res = await api.get('/packages');
      return res.data;
    },
  });

  const saveCustomer = useMutation({
    mutationFn: async () => {
      const body = {
        ...form,
        dueDate: form.dueDate || undefined,
        mikrotikProfile: form.mikrotikProfile || undefined,
      };

      if (editingId) {
        const res = await api.patch(`/customers/${editingId}`, body);
        return res.data;
      }

      const res = await api.post('/customers', body);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['routers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setEditingId(null);
      setForm(emptyForm);
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'Customer save failed');
    },
  });

  const deleteCustomer = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/customers/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['routers'] });
      queryClient.invalidateQueries({ queryKey: ['billing-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['billing-payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'Customer delete failed');
    },
  });

  const suspendCustomer = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/customers/${id}/suspend`);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customers'] }),
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'Suspend failed');
    },
  });

  const activateCustomer = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/customers/${id}/activate`);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customers'] }),
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'Activate failed');
    },
  });

  const startEdit = (customer: CustomerItem) => {
    setEditingId(customer.id);

    setForm({
      customerNo: customer.customerNo || '',
      fullName: customer.fullName || '',
      fatherName: customer.fatherName || '',
      cnic: customer.cnic || '',
      phone: customer.phone || '',
      whatsapp: customer.whatsapp || '',
      email: customer.email || '',
      address: customer.address || '',
      gpsLocation: customer.gpsLocation || '',
      routerId: customer.routerId || '',
      packageId: customer.packageId || '',
      pppUsername: customer.pppAccount?.username || '',
      pppPassword: '',
      mikrotikProfile: customer.pppAccount?.profile || customer.package?.mikrotikProfile || '',
      dueDate: customer.dueDate ? customer.dueDate.slice(0, 10) : '',
      notes: '',
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    saveCustomer.mutate();
  };

  const selectedPackage = packages.find((item) => item.id === form.packageId);

  return (
    <div className="page">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Subscriber CRM</p>
          <h1>Customers</h1>
          <p>
            Add, edit, suspend and delete ISP customers. Deleting customer removes linked
            invoices, payments and PPP account from local database.
          </p>
        </div>

        <div className="hero-signal">
          <UserPlus size={44} />
          <span>CRM</span>
        </div>
      </section>

      <section className="glass-panel form-panel">
        <div className="panel-header">
          <div>
            <h2>{editingId ? 'Edit Customer' : 'Add Customer'}</h2>
            <p className="muted">
              Add customer with router, package and PPP account details.
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
              Customer No
              <input
                value={form.customerNo}
                onChange={(e) => setForm({ ...form, customerNo: e.target.value })}
                placeholder="CUST-001"
                required
              />
            </label>

            <label>
              Full Name
              <input
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="Customer name"
                required
              />
            </label>

            <label>
              Father Name
              <input
                value={form.fatherName}
                onChange={(e) => setForm({ ...form, fatherName: e.target.value })}
                placeholder="Father name"
              />
            </label>

            <label>
              CNIC
              <input
                value={form.cnic}
                onChange={(e) => setForm({ ...form, cnic: e.target.value })}
                placeholder="42101-0000000-0"
              />
            </label>

            <label>
              Phone
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="03000000000"
                required
              />
            </label>

            <label>
              WhatsApp
              <input
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                placeholder="03000000000"
              />
            </label>

            <label>
              Email
              <input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="customer@email.com"
              />
            </label>

            <label>
              GPS Location
              <input
                value={form.gpsLocation}
                onChange={(e) => setForm({ ...form, gpsLocation: e.target.value })}
                placeholder="24.8607, 67.0011"
              />
            </label>

            <label>
              Router
              <select
                value={form.routerId}
                onChange={(e) => setForm({ ...form, routerId: e.target.value })}
                required
              >
                <option value="">Select router</option>
                {routers.map((router) => (
                  <option key={router.id} value={router.id}>
                    {router.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Package
              <select
                value={form.packageId}
                onChange={(e) => {
                  const pkg = packages.find((item) => item.id === e.target.value);

                  setForm({
                    ...form,
                    packageId: e.target.value,
                    mikrotikProfile: pkg?.mikrotikProfile || pkg?.name || '',
                  });
                }}
                required
              >
                <option value="">Select package</option>
                {packages.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} - Rs. {Number(item.price || 0).toLocaleString()}
                  </option>
                ))}
              </select>
            </label>

            <label>
              PPP Username
              <input
                value={form.pppUsername}
                onChange={(e) => setForm({ ...form, pppUsername: e.target.value })}
                placeholder="testuser1"
                required={!editingId}
              />
            </label>

            <label>
              PPP Password
              <input
                value={form.pppPassword}
                onChange={(e) => setForm({ ...form, pppPassword: e.target.value })}
                placeholder={editingId ? 'Leave blank to keep old password' : '123456'}
                required={!editingId}
              />
            </label>

            <label>
              MikroTik Profile
              <input
                value={form.mikrotikProfile}
                onChange={(e) =>
                  setForm({ ...form, mikrotikProfile: e.target.value })
                }
                placeholder={selectedPackage?.mikrotikProfile || '20M'}
              />
            </label>

            <label>
              Due Date
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </label>

            <label>
              Address
              <textarea
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Customer address"
              />
            </label>

            <label>
              Notes
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Any note"
              />
            </label>
          </div>

          <button className="primary-btn small-btn" disabled={saveCustomer.isPending}>
            {editingId ? <Save size={18} /> : <Plus size={18} />}
            {saveCustomer.isPending
              ? 'Saving...'
              : editingId
                ? 'Update Customer'
                : 'Add Customer'}
          </button>
        </form>
      </section>

      <section className="glass-panel">
        <h2>Customers</h2>

        {isLoading ? (
          <p className="muted">Loading customers...</p>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Router</th>
                  <th>Package</th>
                  <th>PPP</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <strong>{customer.fullName}</strong>
                      <small className="table-sub">{customer.customerNo}</small>
                    </td>

                    <td>
                      {customer.phone}
                      <small className="table-sub">{customer.whatsapp || '-'}</small>
                    </td>

                    <td>{customer.router?.name || '-'}</td>

                    <td>
                      {customer.package?.name || '-'}
                      <small className="table-sub">
                        Rs. {Number(customer.package?.price || 0).toLocaleString()}
                      </small>
                    </td>

                    <td>
                      {customer.pppAccount?.username || '-'}
                      <small className="table-sub">
                        {customer.pppAccount?.profile || '-'}
                      </small>
                    </td>

                    <td>
                      {customer.dueDate
                        ? new Date(customer.dueDate).toLocaleDateString()
                        : '-'}
                    </td>

                    <td>
                      <span
                        className={
                          customer.status === 'ACTIVE'
                            ? 'badge green'
                            : customer.status === 'SUSPENDED'
                              ? 'badge orange'
                              : 'badge red'
                        }
                      >
                        {customer.status}
                      </span>
                    </td>

                    <td>
                      <div className="action-row">
                        <button className="ghost-btn" onClick={() => startEdit(customer)}>
                          <Edit3 size={15} />
                          Edit
                        </button>

                        {customer.status === 'ACTIVE' ? (
                          <button
                            className="ghost-btn danger-btn"
                            onClick={() => suspendCustomer.mutate(customer.id)}
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            className="ghost-btn"
                            onClick={() => activateCustomer.mutate(customer.id)}
                          >
                            Activate
                          </button>
                        )}

                        <button
                          className="ghost-btn danger-btn"
                          onClick={() => {
                            if (
                              confirm(
                                'Delete this customer? This will also delete linked invoices, payments and PPP account.',
                              )
                            ) {
                              deleteCustomer.mutate(customer.id);
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

                {customers.length === 0 && (
                  <tr>
                    <td colSpan={8} className="empty-cell">
                      No customers added yet.
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
