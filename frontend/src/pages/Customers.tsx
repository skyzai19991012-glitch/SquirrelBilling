import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PauseCircle, PlayCircle, UserPlus, Users } from 'lucide-react';
import { api } from '../api/client';
import type { CustomerItem, InternetPackage, RouterItem } from '../types';

export default function Customers() {
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    customerNo: `CUST-${Date.now()}`,
    fullName: '',
    phone: '',
    cnic: '',
    address: '',
    routerId: '',
    packageId: '',
    username: '',
    password: '',
    profile: '',
    dueDate: '',
    notes: '',
  });

  const { data: routers = [] } = useQuery<RouterItem[]>({
    queryKey: ['routers'],
    queryFn: async () => {
      const res = await api.get('/routers');
      return res.data;
    },
  });

  const { data: packages = [] } = useQuery<InternetPackage[]>({
    queryKey: ['packages'],
    queryFn: async () => {
      const res = await api.get('/packages');
      return res.data;
    },
  });

  const { data: customers = [], isLoading } = useQuery<CustomerItem[]>({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await api.get('/customers');
      return res.data;
    },
  });

  const selectedPackage = useMemo(
    () => packages.find((pkg) => pkg.id === form.packageId),
    [packages, form.packageId],
  );

  useEffect(() => {
    if (selectedPackage) {
      setForm((current) => ({
        ...current,
        profile: selectedPackage.mikrotikProfile,
      }));
    }
  }, [selectedPackage]);

  const createCustomer = useMutation({
    mutationFn: async () => {
      const body = {
        ...form,
        dueDate: form.dueDate || undefined,
        cnic: form.cnic || undefined,
        address: form.address || undefined,
        notes: form.notes || undefined,
        service: 'pppoe',
      };

      const res = await api.post('/customers', body);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });

      setForm({
        customerNo: `CUST-${Date.now()}`,
        fullName: '',
        phone: '',
        cnic: '',
        address: '',
        routerId: '',
        packageId: '',
        username: '',
        password: '',
        profile: '',
        dueDate: '',
        notes: '',
      });
    },
  });

  const suspendCustomer = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/customers/${id}/suspend`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });

  const activateCustomer = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/customers/${id}/activate`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    createCustomer.mutate();
  };

  return (
    <div className="page">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Subscribers</p>
          <h1>Customer Management</h1>
          <p>
            Add PPPoE customers, assign packages, set due dates, suspend and activate users.
          </p>
        </div>

        <div className="hero-signal">
          <Users size={44} />
          <span>CRM</span>
        </div>
      </section>

      <section className="glass-panel form-panel">
        <h2>Add Customer</h2>

        <form onSubmit={submit}>
          <div className="form-grid">
            <label>
              Customer No
              <input
                value={form.customerNo}
                onChange={(e) => setForm({ ...form, customerNo: e.target.value })}
                required
              />
            </label>

            <label>
              Full Name
              <input
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                required
              />
            </label>

            <label>
              Phone
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
              />
            </label>

            <label>
              CNIC
              <input
                value={form.cnic}
                onChange={(e) => setForm({ ...form, cnic: e.target.value })}
              />
            </label>

            <label>
              Address
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
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
                    {router.name} ({router.host})
                  </option>
                ))}
              </select>
            </label>

            <label>
              Package
              <select
                value={form.packageId}
                onChange={(e) => setForm({ ...form, packageId: e.target.value })}
                required
              >
                <option value="">Select package</option>
                {packages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name} - Rs. {pkg.price}
                  </option>
                ))}
              </select>
            </label>

            <label>
              PPP Username
              <input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
              />
            </label>

            <label>
              PPP Password
              <input
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </label>

            <label>
              MikroTik Profile
              <input
                value={form.profile}
                onChange={(e) => setForm({ ...form, profile: e.target.value })}
                required
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
              Notes
              <input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </label>
          </div>

          <button className="primary-btn small-btn" disabled={createCustomer.isPending}>
            <UserPlus size={18} />
            {createCustomer.isPending ? 'Saving...' : 'Add Customer'}
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
                  <th>No</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>PPP User</th>
                  <th>Package</th>
                  <th>Router</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td>{customer.customerNo}</td>
                    <td>{customer.fullName}</td>
                    <td>{customer.phone}</td>
                    <td>{customer.pppAccount?.username || '-'}</td>
                    <td>{customer.package?.name || '-'}</td>
                    <td>{customer.router?.name || '-'}</td>
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
                        <button
                          className="ghost-btn"
                          onClick={() => suspendCustomer.mutate(customer.id)}
                        >
                          <PauseCircle size={16} />
                          Suspend
                        </button>

                        <button
                          className="ghost-btn"
                          onClick={() => activateCustomer.mutate(customer.id)}
                        >
                          <PlayCircle size={16} />
                          Activate
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {customers.length === 0 && (
                  <tr>
                    <td colSpan={9} className="empty-cell">
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