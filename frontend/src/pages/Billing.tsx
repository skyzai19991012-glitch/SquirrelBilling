import { FormEvent, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Banknote,
  CalendarClock,
  CreditCard,
  FileText,
  PlayCircle,
  Receipt,
} from 'lucide-react';
import { api } from '../api/client';
import type { CustomerItem, InvoiceItem, PaymentItem } from '../types';

function money(value?: number) {
  return `Rs. ${Number(value || 0).toLocaleString()}`;
}

function BillingCard({
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

export default function Billing() {
  const queryClient = useQueryClient();

  const [invoiceForm, setInvoiceForm] = useState({
    customerId: '',
    amount: 0,
    dueDate: '',
    notes: '',
  });

  const [paymentForm, setPaymentForm] = useState({
    customerId: '',
    invoiceId: '',
    amount: 0,
    method: 'CASH',
    referenceNo: '',
    notes: '',
  });

  const { data: customers = [] } = useQuery<CustomerItem[]>({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await api.get('/customers');
      return res.data;
    },
  });

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery<InvoiceItem[]>({
    queryKey: ['billing-invoices'],
    queryFn: async () => {
      const res = await api.get('/billing/invoices');
      return res.data;
    },
  });

  const { data: payments = [], isLoading: paymentsLoading } = useQuery<PaymentItem[]>({
    queryKey: ['billing-payments'],
    queryFn: async () => {
      const res = await api.get('/billing/payments');
      return res.data;
    },
  });

  const { data: summary } = useQuery({
    queryKey: ['billing-summary'],
    queryFn: async () => {
      const res = await api.get('/billing/summary');
      return res.data;
    },
  });

  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.id === invoiceForm.customerId),
    [customers, invoiceForm.customerId],
  );

  const selectedPaymentCustomer = useMemo(
    () => customers.find((customer) => customer.id === paymentForm.customerId),
    [customers, paymentForm.customerId],
  );

  const customerInvoices = useMemo(
    () =>
      invoices.filter(
        (invoice) =>
          invoice.customerId === paymentForm.customerId &&
          invoice.status !== 'PAID' &&
          invoice.status !== 'CANCELLED',
      ),
    [invoices, paymentForm.customerId],
  );

  const createInvoice = useMutation({
    mutationFn: async () => {
      const body = {
        customerId: invoiceForm.customerId,
        amount: Number(invoiceForm.amount),
        dueDate: invoiceForm.dueDate || undefined,
        notes: invoiceForm.notes || undefined,
      };

      const res = await api.post('/billing/invoices', body);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['billing-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });

      setInvoiceForm({
        customerId: '',
        amount: 0,
        dueDate: '',
        notes: '',
      });
    },
  });

  const recordPayment = useMutation({
    mutationFn: async () => {
      const body = {
        customerId: paymentForm.customerId,
        invoiceId: paymentForm.invoiceId || undefined,
        amount: Number(paymentForm.amount),
        method: paymentForm.method,
        referenceNo: paymentForm.referenceNo || undefined,
        notes: paymentForm.notes || undefined,
      };

      const res = await api.post('/billing/payments', body);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-payments'] });
      queryClient.invalidateQueries({ queryKey: ['billing-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['billing-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });

      setPaymentForm({
        customerId: '',
        invoiceId: '',
        amount: 0,
        method: 'CASH',
        referenceNo: '',
        notes: '',
      });
    },
  });

  const runExpiry = useMutation({
    mutationFn: async () => {
      const res = await api.post('/billing/run-expiry');
      return res.data;
    },
    onSuccess: (data) => {
      alert(`Expiry completed. Expired customers: ${data.expiredCount}`);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['billing-summary'] });
    },
  });

  const submitInvoice = (event: FormEvent) => {
    event.preventDefault();
    createInvoice.mutate();
  };

  const submitPayment = (event: FormEvent) => {
    event.preventDefault();
    recordPayment.mutate();
  };

  return (
    <div className="page">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Finance Engine</p>
          <h1>Billing Control</h1>
          <p>
            Create invoices, record payments, monitor outstanding balance and run automatic expiry.
          </p>
        </div>

        <div className="hero-signal">
          <Banknote size={44} />
          <span>BILL</span>
        </div>
      </section>

      <section className="stats-grid">
        <BillingCard
          title="Today Collection"
          value={money(summary?.todayCollection)}
          sub="received today"
          icon={Banknote}
        />

        <BillingCard
          title="Monthly Collection"
          value={money(summary?.monthlyCollection)}
          sub="current month"
          icon={CreditCard}
        />

        <BillingCard
          title="Outstanding"
          value={money(summary?.outstanding)}
          sub="pending balance"
          icon={Receipt}
        />
      </section>

      <section className="two-grid">
        <form className="glass-panel form-panel" onSubmit={submitInvoice}>
          <h2>Create Invoice</h2>

          <div className="form-grid">
            <label>
              Customer
              <select
                value={invoiceForm.customerId}
                onChange={(e) => {
                  const customer = customers.find((item) => item.id === e.target.value);

                  setInvoiceForm({
                    ...invoiceForm,
                    customerId: e.target.value,
                    amount: customer?.package?.price || 0,
                  });
                }}
                required
              >
                <option value="">Select customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.customerNo} - {customer.fullName}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Amount
              <input
                type="number"
                value={invoiceForm.amount}
                onChange={(e) =>
                  setInvoiceForm({ ...invoiceForm, amount: Number(e.target.value) })
                }
                required
              />
            </label>

            <label>
              Due Date
              <input
                type="date"
                value={invoiceForm.dueDate}
                onChange={(e) =>
                  setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })
                }
              />
            </label>

            <label>
              Notes
              <input
                value={invoiceForm.notes}
                onChange={(e) =>
                  setInvoiceForm({ ...invoiceForm, notes: e.target.value })
                }
                placeholder="Monthly bill"
              />
            </label>
          </div>

          <p className="muted">
            Package: {selectedCustomer?.package?.name || '-'} | Price:{' '}
            {money(selectedCustomer?.package?.price)}
          </p>

          <button className="primary-btn small-btn" disabled={createInvoice.isPending}>
            <FileText size={18} />
            {createInvoice.isPending ? 'Creating...' : 'Create Invoice'}
          </button>
        </form>

        <form className="glass-panel form-panel" onSubmit={submitPayment}>
          <h2>Record Payment</h2>

          <div className="form-grid">
            <label>
              Customer
              <select
                value={paymentForm.customerId}
                onChange={(e) =>
                  setPaymentForm({
                    ...paymentForm,
                    customerId: e.target.value,
                    invoiceId: '',
                  })
                }
                required
              >
                <option value="">Select customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.customerNo} - {customer.fullName}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Invoice
              <select
                value={paymentForm.invoiceId}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, invoiceId: e.target.value })
                }
              >
                <option value="">No invoice selected</option>
                {customerInvoices.map((invoice) => (
                  <option key={invoice.id} value={invoice.id}>
                    {invoice.invoiceNo || invoice.id.slice(0, 8)} - {money(invoice.amount)}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Amount
              <input
                type="number"
                value={paymentForm.amount}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })
                }
                required
              />
            </label>

            <label>
              Method
              <select
                value={paymentForm.method}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, method: e.target.value })
                }
                required
              >
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="EASYPAISA">EasyPaisa</option>
                <option value="JAZZCASH">JazzCash</option>
                <option value="CARD">Card</option>
                <option value="OTHER">Other</option>
              </select>
            </label>

            <label>
              Reference No
              <input
                value={paymentForm.referenceNo}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, referenceNo: e.target.value })
                }
                placeholder="Optional"
              />
            </label>

            <label>
              Notes
              <input
                value={paymentForm.notes}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, notes: e.target.value })
                }
                placeholder="Payment note"
              />
            </label>
          </div>

          <p className="muted">
            Selected: {selectedPaymentCustomer?.fullName || '-'}
          </p>

          <button className="primary-btn small-btn" disabled={recordPayment.isPending}>
            <CreditCard size={18} />
            {recordPayment.isPending ? 'Saving...' : 'Record Payment'}
          </button>
        </form>
      </section>

      <section className="glass-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Automation</p>
            <h2>Auto Expiry</h2>
            <p className="muted">
              Run expiry manually. Expired customers will be marked expired and PPP will be disabled.
            </p>
          </div>

          <button className="primary-btn small-btn" onClick={() => runExpiry.mutate()}>
            <PlayCircle size={18} />
            {runExpiry.isPending ? 'Running...' : 'Run Expiry'}
          </button>
        </div>
      </section>

      <section className="glass-panel">
        <h2>Invoices</h2>

        {invoicesLoading ? (
          <p className="muted">Loading invoices...</p>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Paid</th>
                  <th>Balance</th>
                  <th>Due Date</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>{invoice.invoiceNo || invoice.id.slice(0, 8)}</td>
                    <td>{invoice.customer?.fullName || '-'}</td>
                    <td>{money(invoice.amount)}</td>
                    <td>{money(invoice.paidAmount)}</td>
                    <td>{money(invoice.balance)}</td>
                    <td>
                      {invoice.dueDate
                        ? new Date(invoice.dueDate).toLocaleDateString()
                        : '-'}
                    </td>
                    <td>
                      <span
                        className={
                          invoice.status === 'PAID'
                            ? 'badge green'
                            : invoice.status === 'PARTIALLY_PAID'
                              ? 'badge orange'
                              : 'badge red'
                        }
                      >
                        {invoice.status}
                      </span>
                    </td>
                  </tr>
                ))}

                {invoices.length === 0 && (
                  <tr>
                    <td colSpan={7} className="empty-cell">
                      No invoices created yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="glass-panel">
        <h2>Payments</h2>

        {paymentsLoading ? (
          <p className="muted">Loading payments...</p>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Reference</th>
                  <th>Notes</th>
                </tr>
              </thead>

              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>
                      {payment.paidAt
                        ? new Date(payment.paidAt).toLocaleDateString()
                        : new Date(payment.createdAt).toLocaleDateString()}
                    </td>
                    <td>{payment.customer?.fullName || '-'}</td>
                    <td>{money(payment.amount)}</td>
                    <td>{payment.method}</td>
                    <td>{payment.referenceNo || '-'}</td>
                    <td>{payment.notes || '-'}</td>
                  </tr>
                ))}

                {payments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="empty-cell">
                      No payments recorded yet.
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